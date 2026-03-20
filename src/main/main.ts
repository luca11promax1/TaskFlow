import { app, BrowserWindow } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { initDatabase } from './database';
import { setupIPC } from './ipc';
import { setupUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../../public/icon.svg'),
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../build/index.html')}`;

  await mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  try {
    // Inizializza il database
    await initDatabase();
    console.log('Database initialized');

    // Setup IPC handlers
    setupIPC();
    console.log('IPC handlers registered');

    // Setup auto-updater (solo se packaged, non in dev)
    if (!isDev) {
      setupUpdater();
      console.log('Auto-updater configured for GitHub');
    }

    // Crea la finestra principale
    await createWindow();
  } catch (error) {
    console.error('Error during app initialization:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestisci qualsiasi errore non catturato
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
