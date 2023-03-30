import vscode from 'vscode';
import fs, { Stats } from 'fs';

import { polyDataChanged } from './events';

const CHECK_INTERVAL = 5000;

let libraryInstalledCheckerTimeoutID: NodeJS.Timeout;

type Info = {
  timeoutID: NodeJS.Timeout;
  fileStats?: Stats;
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
    libraryInstalledCheckerTimeoutID = setTimeout(() => checkForLibraryInstalled(), CHECK_INTERVAL);
  }
  vscode.commands.executeCommand('setContext', 'polyLibraryInstalled', installed);
};

export const start = () => {
  polyDataChanged({});

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

const getPolyDataPath = (folder: vscode.WorkspaceFolder) => `${folder.uri.fsPath}/node_modules/.poly/lib/context-data.json`;
const getPolyData = (folder: vscode.WorkspaceFolder) => {
  const polyDataPath = getPolyDataPath(folder);
  if (!fs.existsSync(polyDataPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(polyDataPath, 'utf8'));
};

const watchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const polyDataPath = getPolyDataPath(folder);
  let stats: Stats;

  if (fs.existsSync(polyDataPath)) {
    stats = fs.statSync(polyDataPath);
    if (watchedWorkspaceInfos.get(folder)?.fileStats?.mtimeMs !== stats.mtimeMs) {
      console.log('POLY: Poly library changed, sending event...');
      watchedWorkspaceInfos.set(folder, { timeoutID: null, fileStats: stats });
      polyDataChanged(getPolyData(folder));
    }
  } else if (watchedWorkspaceInfos.get(folder)?.fileStats) {
    console.log('POLY: Poly library removed, sending event...');
    polyDataChanged({});
  }

  const timeoutID = setTimeout(() => watchWorkspace(folder), CHECK_INTERVAL);
  watchedWorkspaceInfos.set(folder, { timeoutID, fileStats: stats });
};

const unwatchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const info = watchedWorkspaceInfos.get(folder);
  if (info) {
    if (info.timeoutID) {
      clearTimeout(info.timeoutID);
    }
    watchedWorkspaceInfos.delete(folder);
  }
};
