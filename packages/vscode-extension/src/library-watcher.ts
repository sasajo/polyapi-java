import vscode from 'vscode';
import chokidar, { FSWatcher } from 'chokidar';
import fs, { Stats } from 'fs';

import { polyDataChanged } from './events';

let libraryInstalledCheckerTimeoutID: NodeJS.Timeout;

type Info = {
  timeoutID: NodeJS.Timeout;
  watcher: FSWatcher;
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

const getPolyPath = (folder: vscode.WorkspaceFolder) => `${folder.uri.fsPath}/node_modules/.poly`;
const getPolyData = (folder: vscode.WorkspaceFolder) => {
  const polyFunctionsFilePath = `${folder.uri.fsPath}/node_modules/.poly/lib/context-data.json`;
  if (!fs.existsSync(polyFunctionsFilePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(polyFunctionsFilePath, 'utf8'));
};

const watchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const polyPath = getPolyPath(folder);

  const watchAfterDelay = () => {
    const timeoutID = setTimeout(() => watchWorkspace(folder), 5000);
    watchedWorkspaceInfos.set(folder, { timeoutID, watcher: null });
  };

  if (fs.existsSync(polyPath)) {
    console.log('POLY: Poly path found, watching for changes...');

    const watcher = chokidar.watch(polyPath)
      .on('all', (event, path) => {
        if (path.endsWith('lib/context-data.json')) {
          if (event === 'unlink') {
            void watcher.close();
            polyDataChanged({});
            watchWorkspace(folder);
          } else {
            console.log('POLY: Poly library changed, sending event...');
            polyDataChanged(getPolyData(folder));
          }
        }
      });
    watchedWorkspaceInfos.set(folder, { timeoutID: null, watcher });
  } else {
    console.log('POLY: Poly path not found, waiting...');
    watchAfterDelay();
  }
};

const unwatchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const info = watchedWorkspaceInfos.get(folder);
  if (info) {
    if (info.timeoutID) {
      clearTimeout(info.timeoutID);
    }
    if (info.watcher) {
      void info.watcher.close();
    }
    watchedWorkspaceInfos.delete(folder);
  }
};
