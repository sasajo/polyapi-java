import vscode from 'vscode';
import fs, { Stats } from 'fs';

type Info = {
  timeoutID: NodeJS.Timeout;
  changeListener: (curr: Stats, prev: Stats) => void;
};

const watchedWorkspaceInfos = new Map<vscode.WorkspaceFolder, Info>();

export const start = () => {
  vscode.workspace.onDidChangeWorkspaceFolders((event) => {
    event.added.forEach(watchWorkspace);
    event.removed.forEach(unwatchWorkspace);
  });
  vscode.workspace.workspaceFolders?.forEach(watchWorkspace);
};

const getPolyIndexFilePath = (folder: vscode.WorkspaceFolder) => `${folder.uri.fsPath}/node_modules/.poly/lib/index.js`;

const watchWorkspace = (folder: vscode.WorkspaceFolder) => {
  const polyIndexFilePath = getPolyIndexFilePath(folder);
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
        watchWorkspace(folder);
      }
    };
    fs.watch(polyIndexFilePath, changeListener);
    watchedWorkspaceInfos.set(folder, { timeoutID: null, changeListener });
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
