import React, { useState } from 'react';
import { Moon, Sun, Settings } from 'lucide-react';

interface HeaderProps {
  onThemeToggle: () => void;
}

export default function Header({ onThemeToggle }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  React.useEffect(() => {
    loadAppInfo();
  }, []);

  async function loadAppInfo() {
    try {
      const version = await (window as any).electron.getAppVersion();
      setAppVersion(version);

      const updateResult = await (window as any).electron.checkForUpdates();
      setUpdateAvailable(updateResult.updateAvailable);
    } catch (error) {
      console.error('Error loading app info:', error);
    }
  }

  async function handleUpdateClick() {
    try {
      if (confirm('Installare l\'aggiornamento? L\'app si riavvierà automaticamente.')) {
        await (window as any).electron.installUpdate();
      }
    } catch (error) {
      alert('Errore durante l\'installazione dell\'aggiornamento');
      console.error(error);
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1>📋 NuotoTodo</h1>
      </div>
      <div className="header-right">
        {updateAvailable && (
          <button className="btn-update" onClick={handleUpdateClick}>
            🔄 Aggiornamento disponibile
          </button>
        )}
        <button className="btn-icon" onClick={onThemeToggle} title="Cambia tema">
          <Sun size={20} />
        </button>
        <button
          className="btn-icon"
          onClick={() => setShowSettings(!showSettings)}
          title="Impostazioni"
        >
          <Settings size={20} />
        </button>
      </div>

      {showSettings && (
        <div className="settings-popup">
          <div className="settings-content">
            <h2>Impostazioni</h2>
            <div className="setting-item">
              <label>Versione app: v{appVersion}</label>
            </div>
            <div className="setting-item">
              <button onClick={() => loadAppInfo()}>Controlla aggiornamenti</button>
            </div>
            <button
              className="btn-close"
              onClick={() => setShowSettings(false)}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
