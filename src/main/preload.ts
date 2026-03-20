import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  // Folders
  createFolder: (name: string) => Promise<any>;
  listFolders: () => Promise<any>;
  deleteFolder: (id: number) => Promise<any>;
  renameFolder: (id: number, newName: string) => Promise<any>;

  // Tasks
  createTask: (task: any) => Promise<any>;
  listTasks: (folderId?: number | null) => Promise<any>;
  updateTask: (id: number, updates: any) => Promise<any>;
  deleteTask: (id: number) => Promise<any>;
  moveTaskUp: (taskId: number, folderId?: number | null) => Promise<any>;
  moveTaskDown: (taskId: number, folderId?: number | null) => Promise<any>;

  // Database
  backupDatabase: () => Promise<any>;

  // Updates
  checkForUpdates: () => Promise<any>;
  installUpdate: () => Promise<any>;
  getAppVersion: () => Promise<string>;
}

const electronAPI: ElectronAPI = {
  createFolder: (name: string) => ipcRenderer.invoke('folder:create', name),
  listFolders: () => ipcRenderer.invoke('folder:list'),
  deleteFolder: (id: number) => ipcRenderer.invoke('folder:delete', id),
  renameFolder: (id: number, newName: string) =>
    ipcRenderer.invoke('folder:rename', id, newName),

  createTask: (task: any) => ipcRenderer.invoke('task:create', task),
  listTasks: (folderId?: number | null) => ipcRenderer.invoke('task:list', folderId),
  updateTask: (id: number, updates: any) => ipcRenderer.invoke('task:update', id, updates),
  deleteTask: (id: number) => ipcRenderer.invoke('task:delete', id),
  moveTaskUp: (taskId: number, folderId?: number | null) => ipcRenderer.invoke('task:moveUp', taskId, folderId),
  moveTaskDown: (taskId: number, folderId?: number | null) => ipcRenderer.invoke('task:moveDown', taskId, folderId),

  backupDatabase: () => ipcRenderer.invoke('db:backup'),

  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
};

contextBridge.exposeInMainWorld('electron', electronAPI);

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
