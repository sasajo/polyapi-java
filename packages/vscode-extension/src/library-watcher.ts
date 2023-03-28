import vscode from 'vscode';
import fs, { Stats } from 'fs';

import { polyDataChanged } from './events';

let libraryInstalledCheckerTimeoutID: NodeJS.Timeout;

type Info = {
  timeoutID: NodeJS.Timeout;
  changeListener: (curr: Stats, prev: Stats) => void;
};

const watchedWorkspaceInfos = new Map<vscode.WorkspaceFolder, Info>();

const checkForLibraryInstalled = () => {
  let installed = false;
  vscode.workspace.workspaceFolders?.forEach((folder) => {
    if (fs.existsSync(`${folder.uri.fsPath}/node_modules/polyapi/package.json`)) {
      installed = true;
    }
  });
  if (!installed) {
    libraryInstalledCheckerTimeoutID = setTimeout(() => checkForLibraryInstalled(), 5000);
  }
  vscode.commands.executeCommand('setContext', 'polyLibraryInstalled', installed);
};

export const start = () => {
  vscode.workspace.onDidChangeWorkspaceFolders((event) => {
    event.added.forEach(watchWorkspace);
    event.removed.forEach(unwatchWorkspace);
  });
  vscode.workspace.workspaceFolders?.forEach(watchWorkspace);

  checkForLibraryInstalled();

  return () => {
    watchedWorkspaceInfos.forEach((_, folder) => unwatchWorkspace(folder));
    if (libraryInstalledCheckerTimeoutID) {
      clearTimeout(libraryInstalledCheckerTimeoutID);
    }
  };
};

const getPolyIndexFilePath = (folder: vscode.WorkspaceFolder) => `${folder.uri.fsPath}/node_modules/.poly/lib/index.js`;
const getPolyData = (folder: vscode.WorkspaceFolder) => {
  const polyFunctionsFilePath = `${folder.uri.fsPath}/node_modules/.poly/lib/context-data.json`;
  if (!fs.existsSync(polyFunctionsFilePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(polyFunctionsFilePath, 'utf8'));
};

const watchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const polyIndexFilePath = getPolyIndexFilePath(folder);
  if (fs.existsSync(polyIndexFilePath)) {
    console.log('POLY: Poly index file found, watching for changes...');

    const changeListener = (event) => {
      if (event !== 'change') {
        return;
      }

      if (!fs.existsSync(polyIndexFilePath)) {
        console.log('POLY: Poly index file deleted, reapplying watch...');
        fs.unwatchFile(polyIndexFilePath, changeListener);
        watchWorkspace(folder);
      } else {
        console.log('POLY: Poly library changed, sending event...');
        polyDataChanged(getPolyData(folder));
      }
    };
    fs.watch(polyIndexFilePath, changeListener);
    watchedWorkspaceInfos.set(folder, { timeoutID: null, changeListener });

    polyDataChanged(getPolyData(folder));
  } else {
    console.log('POLY: Poly index file not found, waiting...');
    const timeoutID = setTimeout(() => watchWorkspace(folder), 5000);
    watchedWorkspaceInfos.set(folder, { timeoutID, changeListener: null });
  }
};

const unwatchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const info = watchedWorkspaceInfos.get(folder);
  if (info) {
    if (info.timeoutID) {
      clearTimeout(info.timeoutID);
    }
    if (info.changeListener) {
      fs.unwatchFile(getPolyIndexFilePath(folder), info.changeListener);
    }
    watchedWorkspaceInfos.delete(folder);
  }
};
