# Poly VS Code Extension

## Development

1. Open VS Code on this folder.
2. `yarn install` to install all necessary dependencies
3. Run with F5 to start a new window with your extension loaded. 

## Extension Settings

Extension settings are configured in the `settings.json` file. You can access it by clicking the gear icon in the lower left corner of the VS Code window.

* `poly.apiBaseUrl`: The base URL for the Poly API. Defaults to `https://api.polyapi.io`.
* `poly.apiKey`: The API key to use when making requests to the Poly API.

## Packaging

Make sure you have Node.js installed. Then run:\
`npm install -g @vscode/vsce`

To create a `.vsix` file, run:\
`vsce package`
