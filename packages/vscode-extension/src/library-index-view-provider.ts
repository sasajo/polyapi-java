import * as vscode from 'vscode';
import { ProviderResult, TreeItem } from 'vscode';

class LibraryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly parentPath: string,
    public readonly data: any,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    switch (data.type) {
      case 'function':
        const title = data.customCode ? 'Custom function' : 'Function';
        this.tooltip = new vscode.MarkdownString(
          `**${title}**\n\n---\n\n${data.description
            ? `${data.description}\n\n---\n\n`
            : ''}${data.name}(${data.arguments.map(arg => `${arg.name}: ${arg.type}`).join(', ')})`,
        );
        break;
      case 'webhookHandle':
        this.tooltip = new vscode.MarkdownString(
          `**Webhook listener**\n\n---\n\n${data.name}()`,
        );
        break;
      default:
        this.tooltip = new vscode.MarkdownString(
          `**Context**\n\n---\n\n${label}`,
        );
        break;
    }
  }
}

export default class LibraryIndexViewProvider implements vscode.TreeDataProvider<LibraryTreeItem> {
  private contextData: Record<string, any> = {};

  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  getChildren(parent?: LibraryTreeItem): ProviderResult<LibraryTreeItem[]> {
    const data = parent?.data || this.contextData;
    if (data.type) {
      return [];
    }

    const parentPath = parent ? `${parent.parentPath}.${parent.label}` : 'poly';
    return Object.keys(data)
      .map(key => {
        const collapsibleState = data[key].type
          ? vscode.TreeItemCollapsibleState.None
          : vscode.TreeItemCollapsibleState.Collapsed;

        return new LibraryTreeItem(parentPath, data[key], key, collapsibleState);
      })
      .sort((a, b) => {
        if (a.data.type && !b.data.type) {
          return 1;
        } else if (b.data.type && !a.data.type) {
          return -1;
        }
        return a.label.localeCompare(b.label);
      });
  }

  getTreeItem(element: LibraryTreeItem): TreeItem | Thenable<TreeItem> {
    element.command = {
      title: 'Copy to clipboard',
      command: 'poly.copyLibraryItem',
      arguments: [element],
    };
    return element;
  }

  public refresh(contextData: Record<string, any>) {
    console.log('POLY: Refreshing index tree data...', contextData);
    this.contextData = contextData;
    this._onDidChangeTreeData.fire();
  }

  static copyLibraryItem(item: LibraryTreeItem) {
    const { parentPath, data, label } = item;
    const {type, name, arguments: args} = data;
    switch (type) {
      case 'function':
        const functionArgs = args.filter(arg => !arg.payload);
        const payloadArgs = args.filter(arg => arg.payload);
        vscode.env.clipboard.writeText(
          `await ${parentPath}.${name}(${functionArgs.map(arg => `${arg.name}`).join(', ')}${payloadArgs.length ? `${functionArgs.length ? ', ' : ''}payload` : ''});`
        );
        break;
      case 'webhookHandle':
        vscode.env.clipboard.writeText(`${parentPath}.${name}(event => {\n\n});`);
        break;
      default:
        vscode.env.clipboard.writeText(`${parentPath}.${label}`);
        break;
    }
    vscode.window.showInformationMessage('Copied');
  }
}
