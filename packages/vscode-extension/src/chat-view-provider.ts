import * as vscode from 'vscode';
import axios from 'axios';

export default class ChatViewProvider implements vscode.WebviewViewProvider {

  private webView?: vscode.WebviewView;
  private requestAbortController;

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.webView = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this.context.extensionUri
      ]
    };

    webviewView.webview.html = this.getWebviewHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'sendQuestion': {
          void this.sendPolyQuestionRequest(data.value);
          break;
        }
        case 'cancelRequest': {
          this.requestAbortController?.abort();
          break;
        }
      }
    });
  }

  private async sendPolyQuestionRequest(message: string) {
    const apiBaseUrl = vscode.workspace.getConfiguration('poly').get('apiBaseUrl');
    const apiKey = vscode.workspace.getConfiguration('poly').get('apiKey');

    if (!apiBaseUrl || !apiKey) {
      vscode.window.showErrorMessage('Please set the API base URL and API key in the extension settings.');
      return;
    }

    this.webView?.webview.postMessage({
      type: 'addQuestion',
      value: message
    });
    this.webView?.webview.postMessage({
      type: 'setLoading',
    });

    this.requestAbortController?.abort();
    this.requestAbortController = new AbortController();
    try {
      const {data} = await axios.post(`${apiBaseUrl}/chat/question`, {
        headers: {
          // HARDCODED FOR NOW, vlad fixme?
          "X-PolyApiKey": "ab4f62d3421bca3674hfd627",
        },
        message
      }, {
        signal: this.requestAbortController.signal,
      });

      this.webView?.webview.postMessage({
        type: 'addResponseTexts',
        value: data.texts
      });
    } catch (error) {
      console.error(error);
      this.webView?.webview.postMessage({
        type: 'addResponseTexts',
        value: [{
          type: 'error',
          value: error.message
        }]
      });
    }
  }

  focusMessageInput() {
    this.webView?.show();
    this.webView?.webview.postMessage({
      type: 'focusMessageInput'
    });
  }

  private getWebviewHtml(webview: vscode.Webview) {
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'main.css'));
    const mainJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'main.js'));
    const tailwindJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'tailwindcss.min.js'));
    const markedJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'marked.min.js'));
    const highlightJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'highlight.min.js'));
    const highlightCss = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'highlight.min.css'));

    return (
      `<!DOCTYPE html>
      <html lang='en'>
      <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Poly Chat</title>
        <link href='${styleVSCodeUri}' rel='stylesheet'>
        <link href='${styleMainUri}' rel='stylesheet'>
        <script src='${tailwindJs}'></script>
        <script src='${markedJs}'></script>
        <script src='${highlightJs}'></script>
        <link href='${highlightCss}' rel='stylesheet'>
      </head>
      <body class='overflow-hidden'>
        <div class='flex flex-col h-screen'>
          <div id='action-bar' class='flex justify-end hidden mb-2'>
            <button id='clear-conversation-button' class='rounded-lg p-1.5 ml-2'>
              <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 128 128'>
                <path fill='currentColor' d='M112.701 13.523c4.614 2.664 6.206 8.524 3.543 13.137L95.789 62.088l16.48 9.515a9.578 9.578 0 0 1 3.517 13.122l-5.59 9.683-8.031-4.636c-3.182 4.615-7.29 10.527-11.003 15.481-2.788 3.721-3.857 6.62-7.09 8.888-1.617 1.134-3.795 1.7-5.909 1.627-2.113-.072-4.282-.603-7.026-1.467a3.88 3.88 0 0 1-.439-.148L23.62 92.85c-2.944-1.331-5.304-2.305-7.094-3.046-1.79-.741-2.703-.945-4.133-1.932-.358-.246-.859-.466-1.462-1.649-.302-.591-.596-1.569-.402-2.576.193-1.008.814-1.802 1.287-2.23.947-.858 1.465-.904 1.88-1.015.416-.11.727-.151 1.058-.194 1.323-.171 2.915-.197 5.327-.319l12.162-.64c2.861-.145 6.935-3.557 9.122-6.77l8.683-12.798-5.117-2.954 5.59-9.684c2.664-4.613 8.535-6.164 13.148-3.5l15.457 8.924L99.58 17.039a9.578 9.578 0 0 1 13.121-3.516zm-17.254 72.37L56.79 63.575l-9.023 13.266c-2.979 4.377-7.96 9.794-15.136 10.156l-2.778.145 43.602 19.75c.031.01.036-.006.067.004 2.382.745 4.04 1.093 4.915 1.123.886.03.867-.04 1.155-.243.576-.403 2.22-2.97 5.358-7.158 3.38-4.512 7.335-10.153 10.496-14.725z'/>
              </svg>
            </button>
          </div>
          <div class='flex-1 overflow-y-auto' id='conversation-list'></div>
          <div class='p-2 flex items-center pb-4'>
            <div class='flex-1 message-input-wrapper'>
              <textarea
                id='message-input'
                type='text'
                placeholder='Ask me...'
                onInput='this.parentNode.dataset.messageValue = this.value'
              ></textarea>
            </div>
            <button id='send-message-button' class='right-6 absolute rounded-lg p-1.5 ml-5'>
              <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'>
                <path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10.5 12H5m-.084.291L2.58 19.266c-.184.548-.275.822-.21.99a.5.5 0 0 0 .332.3c.174.05.438-.07.965-.306l16.711-7.52c.515-.232.772-.348.851-.509a.5.5 0 0 0 0-.443c-.08-.16-.336-.276-.85-.508L3.661 3.748c-.525-.237-.788-.355-.962-.307a.5.5 0 0 0-.332.3c-.066.168.025.441.206.988l2.342 7.056a.967.967 0 0 1 .053.19.5.5 0 0 1 0 .127c-.006.049-.022.095-.053.19Z'/>
              </svg>
            </button>
          </div>
        </div>
		<script src='${mainJs}'></script>
      </body>
      </html>`
    );
  }
}
