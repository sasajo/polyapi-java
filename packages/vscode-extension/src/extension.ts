import * as vscode from 'vscode';
import ChatViewProvider from './chat-view-provider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context);

  context.subscriptions.push(vscode.commands.registerCommand('poly.focusMessageInput', () => {
    provider.focusMessageInput();
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
