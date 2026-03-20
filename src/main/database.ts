import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const dbPath = path.join(app.getPath('userData'), 'nuototodo.db');

export interface Folder {
  id: number;
  name: string;
  created_at: string;
}

export interface Task {
  id: number;
  folder_id: number | null;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'bassa' | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

let db: sqlite3.Database;

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);

      // Abilita foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);

        // Crea tabelle se non esistono
        db.serialize(() => {
          db.run(`
            CREATE TABLE IF NOT EXISTS folders (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT UNIQUE NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              folder_id INTEGER,
              title TEXT NOT NULL,
              description TEXT DEFAULT '',
              priority TEXT,
              completed BOOLEAN DEFAULT 0,
              due_date DATE,
              task_order INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS config (
              key TEXT PRIMARY KEY,
              value TEXT
            )
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  });
}

export function getDatabase(): sqlite3.Database {
  return db;
}

// Folders
export function createFolder(name: string): Promise<Folder> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO folders (name) VALUES (?)',
      [name],
      function(err) {
        if (err) reject(err);
        else {
          db.get(
            'SELECT * FROM folders WHERE id = ?',
            [this.lastID],
            (err, row) => {
              if (err) reject(err);
              else resolve(row as Folder);
            }
          );
        }
      }
    );
  });
}

export function getFolders(): Promise<Folder[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM folders ORDER BY created_at ASC', (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as Folder[]);
    });
  });
}

export function deleteFolder(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM folders WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function renameFolder(id: number, newName: string): Promise<Folder> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE folders SET name = ? WHERE id = ?',
      [newName, id],
      (err) => {
        if (err) reject(err);
        else {
          db.get('SELECT * FROM folders WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row as Folder);
          });
        }
      }
    );
  });
}

// Tasks
export function createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  return new Promise((resolve, reject) => {
    const { folder_id, title, description, priority, completed, due_date } = task;
    db.run(
      `INSERT INTO tasks (folder_id, title, description, priority, completed, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [folder_id || null, title, description, priority, completed ? 1 : 0, due_date || null],
      function(err) {
        if (err) reject(err);
        else {
          db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
            if (err) reject(err);
            else {
              const taskRow = row as any;
              resolve({
                ...taskRow,
                completed: Boolean(taskRow.completed),
              } as Task);
            }
          });
        }
      }
    );
  });
}

export function getTasks(folderId?: number | null): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM tasks';
    let params: any[] = [];

    if (folderId !== undefined) {
      if (folderId === null) {
        query += ' WHERE folder_id IS NULL';
      } else {
        query += ' WHERE folder_id = ?';
        params.push(folderId);
      }
    }

    query += ' ORDER BY task_order ASC, created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else {
        const tasks = ((rows || []) as any[]).map(row => ({
          ...row,
          completed: Boolean(row.completed),
        }));
        resolve(tasks as Task[]);
      }
    });
  });
}

export function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  return new Promise((resolve, reject) => {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        if (key === 'completed') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    });

    values.push(id);

    db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
      if (err) reject(err);
      else {
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else {
            const taskRow = row as any;
            resolve({
              ...taskRow,
              completed: Boolean(taskRow.completed),
            } as Task);
          }
        });
      }
    });
  });
}

export function deleteTask(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function reorderTasks(folderId: number | null, taskIds: number[]): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      taskIds.forEach((id, index) => {
        db.run('UPDATE tasks SET task_order = ? WHERE id = ?', [index, id], (err) => {
          if (err) reject(err);
        });
      });
      resolve();
    });
  });
}

export async function moveTaskUp(taskId: number, folderId: number | null): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    // Ottieni la task corrente
    db.get('SELECT task_order FROM tasks WHERE id = ?', [taskId], (err, row: any) => {
      if (err) reject(err);
      if (!row) {
        reject(new Error('Task not found'));
        return;
      }

      const currentOrder = row.task_order;
      if (currentOrder === 0) {
        // Già la prima
        getTasks(folderId).then(resolve).catch(reject);
        return;
      }

      // Trova la task con ordine precedente
      let query = 'SELECT id FROM tasks WHERE task_order = ? AND ';
      if (folderId === null) {
        query += 'folder_id IS NULL';
      } else {
        query += 'folder_id = ?';
      }
      
      const params = folderId === null ? [currentOrder - 1] : [currentOrder - 1, folderId];

      db.get(query, params, (err, prevRow: any) => {
        if (err) reject(err);
        if (!prevRow) {
          reject(new Error('Previous task not found'));
          return;
        }

        // Scambia gli ordini
        db.serialize(() => {
          db.run('UPDATE tasks SET task_order = ? WHERE id = ?', [currentOrder - 1, taskId]);
          db.run('UPDATE tasks SET task_order = ? WHERE id = ?', [currentOrder, prevRow.id], (err) => {
            if (err) reject(err);
            getTasks(folderId).then(resolve).catch(reject);
          });
        });
      });
    });
  });
}

export async function moveTaskDown(taskId: number, folderId: number | null): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    // Ottieni la task corrente
    db.get('SELECT task_order FROM tasks WHERE id = ?', [taskId], (err, row: any) => {
      if (err) reject(err);
      if (!row) {
        reject(new Error('Task not found'));
        return;
      }

      const currentOrder = row.task_order;

      // Trova il numero massimo di ordini
      let query = 'SELECT MAX(task_order) as maxOrder FROM tasks WHERE ';
      if (folderId === null) {
        query += 'folder_id IS NULL';
      } else {
        query += 'folder_id = ?';
      }

      const params = folderId === null ? [] : [folderId];

      db.get(query, params, (err, maxRow: any) => {
        if (err) reject(err);

        const maxOrder = maxRow?.maxOrder || 0;
        if (currentOrder >= maxOrder) {
          // Già l'ultima
          getTasks(folderId).then(resolve).catch(reject);
          return;
        }

        // Trova la task con ordine successivo
        let findQuery = 'SELECT id FROM tasks WHERE task_order = ? AND ';
        if (folderId === null) {
          findQuery += 'folder_id IS NULL';
        } else {
          findQuery += 'folder_id = ?';
        }

        const findParams = folderId === null ? [currentOrder + 1] : [currentOrder + 1, folderId];

        db.get(findQuery, findParams, (err, nextRow: any) => {
          if (err) reject(err);
          if (!nextRow) {
            reject(new Error('Next task not found'));
            return;
          }

          // Scambia gli ordini
          db.serialize(() => {
            db.run('UPDATE tasks SET task_order = ? WHERE id = ?', [currentOrder + 1, taskId]);
            db.run('UPDATE tasks SET task_order = ? WHERE id = ?', [currentOrder, nextRow.id], (err) => {
              if (err) reject(err);
              getTasks(folderId).then(resolve).catch(reject);
            });
          });
        });
      });
    });
  });
}

export function backupDatabase(): Promise<string> {
  return new Promise((resolve, reject) => {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `nuototodo-backup-${timestamp}.db`);

    fs.copyFile(dbPath, backupPath, (err) => {
      if (err) reject(err);
      else resolve(backupPath);
    });
  });
}
