import { app, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { backupDatabase } from './database';

export function setupUpdater() {
  // Configura il logger
  autoUpdater.logger = require('electron-log');
  (autoUpdater.logger as any).transports.file.level = 'info';

  console.log('App version:', app.getVersion());
  console.log('Feed URL:', autoUpdater.currentVersion);

  // Controlla aggiornamenti al startup
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.error('Error checking for updates:', err);
  });

  // Controlla aggiornamenti ogni 60 minuti (in produzione)
  setInterval(() => {
    console.log('Checking for updates...');
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Error checking for updates:', err);
    });
  }, 60 * 60 * 1000);

  // Event listeners
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    console.log('Update downloaded:', info.version);
    
    try {
      // Backup del database prima di aggiornare
      const backupPath = await backupDatabase();
      console.log('Database backed up at:', backupPath);
      
      // Chiedi all'utente se vuole installare
      dialog.showMessageBox({
        type: 'info',
        title: 'Aggiornamento disponibile',
        message: `Un nuovo aggiornamento (v${info.version}) è pronto per essere installato.`,
        detail: 'L\'app si riavvierà per completare l\'installazione.',
        buttons: ['Installa ora', 'Installa più tardi'],
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    } catch (error) {
      console.error('Error during update installation:', error);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available. Current version:', info.version);
  });

  // IPC handler per controllo manuale aggiornamenti
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        updateAvailable: result && result.updateInfo !== null,
        version: result?.updateInfo?.version,
        currentVersion: app.getVersion(),
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        updateAvailable: false,
        error: (error as Error).message,
      };
    }
  });

  ipcMain.handle('install-update', async () => {
    try {
      await backupDatabase();
      autoUpdater.quitAndInstall();
    } catch (error) {
      console.error('Error installing update:', error);
      throw error;
    }
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}
