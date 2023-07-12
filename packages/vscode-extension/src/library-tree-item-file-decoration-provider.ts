import vscode, { FileDecoration, FileDecorationProvider } from 'vscode';

export class LibraryTreeItemFileDecorationProvider implements FileDecorationProvider {
  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<FileDecoration> {
    if (uri.scheme === 'poly') {
      if (uri.authority === 'type') {
        return {
          color: this.getTypeColor(uri.path),
        };
      }
    }

    return undefined;
  }

  private getTypeColor(type: string): vscode.ThemeColor | undefined {
    switch (type) {
      case '/serverVariable':
        return new vscode.ThemeColor('poly.variable');
      case '/apiFunction':
      case '/customFunction':
      case '/serverFunction':
      case '/authFunction':
      case '/webhookHandle':
        return new vscode.ThemeColor('poly.function');
      case '/context':
        return new vscode.ThemeColor('poly.context');
      default:
        return undefined;
    }
  }
}
