import * as vscode from 'vscode';
import ChatViewProvider from './chat-view-provider';

import { start as startFileWatcher } from './file-watcher';

export async function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context);

  startFileWatcher();

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
