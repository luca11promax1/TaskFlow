import { ipcMain } from 'electron';
import * as db from './database';

export function setupIPC() {
  // Folder operations
  ipcMain.handle('folder:create', async (event, name: string) => {
    try {
      const folder = await db.createFolder(name);
      return { success: true, data: folder };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('folder:list', async () => {
    try {
      const folders = await db.getFolders();
      return { success: true, data: folders };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('folder:delete', async (event, id: number) => {
    try {
      await db.deleteFolder(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('folder:rename', async (event, id: number, newName: string) => {
    try {
      const folder = await db.renameFolder(id, newName);
      return { success: true, data: folder };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Task operations
  ipcMain.handle('task:create', async (event, task) => {
    try {
      const newTask = await db.createTask(task);
      return { success: true, data: newTask };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('task:list', async (event, folderId?: number | null) => {
    try {
      const tasks = await db.getTasks(folderId);
      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('task:update', async (event, id: number, updates) => {
    try {
      const task = await db.updateTask(id, updates);
      return { success: true, data: task };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('task:delete', async (event, id: number) => {
    try {
      await db.deleteTask(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('task:moveUp', async (event, taskId: number, folderId?: number | null) => {
    try {
      const tasks = await db.moveTaskUp(taskId, folderId ?? null);
      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('task:moveDown', async (event, taskId: number, folderId?: number | null) => {
    try {
      const tasks = await db.moveTaskDown(taskId, folderId ?? null);
      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Database operations
  ipcMain.handle('db:backup', async () => {
    try {
      const backupPath = await db.backupDatabase();
      return { success: true, data: { backupPath } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
