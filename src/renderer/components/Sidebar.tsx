import React, { useEffect, useState } from 'react';
import { FolderPlus, FolderOpen, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function Sidebar() {
  const {
    folders,
    selectedFolderId,
    setFolders,
    addFolder,
    removeFolder,
    setSelectedFolder,
  } = useAppStore();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    try {
      const result = await (window as any).electron.listFolders();
      if (result.success) {
        setFolders(result.data);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      alert('Inserisci un nome per la cartella');
      return;
    }

    try {
      const result = await (window as any).electron.createFolder(newFolderName);
      if (result.success) {
        addFolder(result.data);
        setNewFolderName('');
        setIsCreating(false);
      } else {
        alert('Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Errore durante la creazione della cartella');
    }
  }

  async function handleDeleteFolder(id: number) {
    if (!confirm('Eliminare la cartella? Le task non verranno eliminate.')) {
      return;
    }

    try {
      const result = await (window as any).electron.deleteFolder(id);
      if (result.success) {
        removeFolder(id);
        if (selectedFolderId === id) {
          setSelectedFolder(null, 'Inbox');
        }
      } else {
        alert('Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Errore durante l\'eliminazione della cartella');
    }
  }

  return (
    <aside className="sidebar">
      <h2>Cartelle</h2>

      {/* Inbox */}
      <button
        className={`folder-btn ${selectedFolderId === null ? 'active' : ''}`}
        onClick={() => setSelectedFolder(null, 'Inbox')}
      >
        <FolderOpen size={18} />
        Inbox
      </button>

      {/* Custom Folders */}
      <div className="folders-list">
        {folders.map((folder) => (
          <div key={folder.id} className="folder-item">
            <button
              className={`folder-btn ${selectedFolderId === folder.id ? 'active' : ''}`}
              onClick={() => setSelectedFolder(folder.id, folder.name)}
            >
              <FolderOpen size={18} />
              {folder.name}
            </button>
            <button
              className="btn-delete"
              onClick={() => handleDeleteFolder(folder.id)}
              title="Elimina cartella"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Create new folder */}
      {isCreating ? (
        <div className="create-folder">
          <input
            type="text"
            placeholder="Nome cartella..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
            autoFocus
          />
          <button onClick={handleCreateFolder} className="btn-confirm">
            ✓
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className="btn-cancel"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          className="btn-new-folder"
          onClick={() => setIsCreating(true)}
        >
          <FolderPlus size={18} />
          Nuova cartella
        </button>
      )}
    </aside>
  );
}
