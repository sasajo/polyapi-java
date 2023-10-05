import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

export const HOST_LIBRARY_VERSION_MAP = {
  'na1.polyapi.io': 'latest',
  'develop-k8s.polyapi.io': 'develop',
};

export const getCredentialsFromExtension = () => {
  return {
    apiBaseUrl: vscode.workspace.getConfiguration('poly').get('apiBaseUrl'),
    apiKey: vscode.workspace.getConfiguration('poly').get('apiKey'),
  };
};

export const saveCredentialsInExtension = (apiBaseUrl: unknown, apiKey: unknown) => {
  vscode.workspace.getConfiguration('poly').update('apiBaseUrl', apiBaseUrl);
  vscode.workspace.getConfiguration('poly').update('apiKey', apiKey);
};

export const getWorkspacePath = () => {
  return vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
};

export const getPackageManager = (): 'yarn' | 'npm' => {
  return fs.existsSync(`${getWorkspacePath()}/yarn.lock`) ? 'yarn' : 'npm';
};

export const getLibraryVersionFromApiHost = (apiBaseUrl: unknown) => {
  let result = '';

  if (!apiBaseUrl) {
    return result;
  }

  for (const [k, v] of Object.entries(HOST_LIBRARY_VERSION_MAP)) {
    if ((apiBaseUrl as string).match(new RegExp(k))) {
      result = v;
      break;
    }
  }

  return result;
};

export const saveLibraryConfig = (newConfig: Record<string, any>) => {
  const workspacePath = getWorkspacePath();

  if (!workspacePath) {
    return;
  }

  const polyFolder = path.join(getWorkspacePath(), 'node_modules/.poly');

  const configEnvPath = path.join(polyFolder, '.config.env');

  let currentConfig = {};

  if (fs.existsSync(configEnvPath)) {
    const content = fs.readFileSync(configEnvPath, 'utf8');

    const credentialsList = content.split('\n').filter(value => value !== '');

    currentConfig = credentialsList.reduce((acum, value) => {
      const [credentialKey, credentialValue] = value.split('=');

      return {
        ...acum,
        [credentialKey]: credentialValue,
      };
    }, {});
  }

  try {
    fs.mkdirSync(polyFolder, { recursive: true });

    const newContent = Object.entries({
      ...currentConfig,
      ...newConfig,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync(
      configEnvPath,
      newContent,
    );
  } catch (err) {
    console.log(err);
  }
};

export const getLibraryConfig = () => {
  const configEnvPath = path.join(getWorkspacePath(), 'node_modules/.poly/.config.env');

  if (!fs.existsSync(configEnvPath)) {
    return {};
  }

  const content = fs.readFileSync(configEnvPath, 'utf8');

  const credentialsList = content.split('\n').filter(line => line !== '');

  return credentialsList.reduce((acum, value) => {
    const [credentialKey, credentialValue] = value.split('=');

    return {
      ...acum,
      [credentialKey]: credentialValue,
    };
  }, {});
};

export const isPolyLibraryInstalled = () => {
  return vscode.workspace.workspaceFolders?.some((folder) => {
    if (fs.existsSync(`${folder.uri.fsPath}/node_modules/polyapi/package.json`)) {
      return true;
    }

    return false;
  });
};

export const getClientPackageJson = () => {
  return fs.readFileSync(`${getWorkspacePath()}/package.json`, 'utf-8');
};
