import * as vscode from 'vscode';
import * as fs from 'fs';
import ChatViewProvider from './chat-view-provider';

const watchWorkspaceFolder = (folder: vscode.WorkspaceFolder) => {
  const polyIndexFilePath = `${folder.uri.fsPath}/node_modules/.poly/lib/index.js`;
  if (fs.existsSync(polyIndexFilePath)) {
    console.log('POLY: Poly index file found, watching for changes...');
    const changeListener = (event) => {
      if (event !== 'change') {
        return;
      }

      console.log('POLY: Poly index file changed, restarting TS server...');
      vscode.commands.executeCommand('typescript.restartTsServer');

      if (!fs.existsSync(polyIndexFilePath)) {
        console.log('POLY: Poly index file deleted, reapplying watch...');
        fs.unwatchFile(polyIndexFilePath, changeListener);
        watchWorkspaceFolder(folder);
      }
    };
    fs.watch(polyIndexFilePath, changeListener);
  } else {
    console.log('POLY: Poly index file not found, waiting...');
    setTimeout(() => watchWorkspaceFolder(folder), 5000);
  }
};

export async function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context);

  vscode.workspace.workspaceFolders.forEach(watchWorkspaceFolder);

  context.subscriptions.push(vscode.commands.registerCommand('poly.focusMessageInput', () => {
    provider.focusMessageInput();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('poly.copySelection', () => {
    vscode.commands.executeCommand('editor.action.clipboardCopyAction');
  }));
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(
    'poly.chat-view',
    provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  ));
}
