# NuotoTodo - Task Manager Desktop App

Una semplice e intuitiva app di gestione task per Windows con cartelle, priorità, notifiche e auto-aggiornamento.

## Caratteristiche

✨ **Task Management**
- Crea, modifica, elimina e completa le task
- Descrizione task (opzionale)
- Priorità (Alta, Media, Bassa)
- Date di scadenza con notifiche

📁 **Organizzazione**
- Crea cartelle per organizzare le task
- Cartella predefinita "Inbox"
- Gestione semplice delle cartelle

🔄 **Auto-aggiornamento**
- Controlla GitHub automaticamente ogni 24 ore
- Backup automatico del database prima dell'aggiornamento
- I dati persistono dopo l'aggiornamento
- Controlla manualmente gli aggiornamenti dalle impostazioni

⚙️ **Impostazioni**
- Tema light/dark (opzionale)
- Notifiche desktop per task in scadenza
- Backup manuale del database
- Informazioni sull'app

💾 **Archiviazione**
- Database SQLite locale
- Nessun sync cloud
- Backup automatico

## Stack tecnologico

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Electron 28
- **Database**: SQLite3
- **State Management**: Zustand
- **Auto-updater**: electron-updater
- **Installer**: NSIS (Windows)

## Setup / Sviluppo

### Prerequisiti
- Node.js 16+ e npm

### Installazione

```bash
# Installa dipendenze
npm install

# Avvia in modalità sviluppo (Main + Renderer)
npm run dev

# Build per produzione
npm run build

# Crea installer Windows
npm run dist
```

## Struttura progetto

```
nuototodo/
├── src/
│   ├── main/              # Process principale Electron
│   │   ├── main.ts        # Entry point
│   │   ├── database.ts    # SQLite operations
│   │   ├── ipc.ts         # IPC handlers
│   │   ├── updater.ts     # Auto-updater
│   │   └── preload.ts     # Secure bridge
│   ├── renderer/          # React frontend
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   ├── components/    # React components
│   │   └── stores/        # Zustand stores
│   └── ...
├── public/
│   └── index.html         # HTML template
├── package.json
├── tsconfig.json
└── README.md
```

## Build & Release

### Build della app
```bash
npm run dist
```

Genera:
- Installer NSIS (`.exe`)
- Portable version (`.exe`)

### Release su GitHub

1. Fai un tag dei rilasci: `v0.1.0`, `v0.2.0`, ecc.
2. Carica il file `.exe` dell'installer come release asset
3. L'app controllerà automaticamente i nuovi rilasci su GitHub

## Database

Struttura:
- **folders**: cartelle utente
- **tasks**: singole task con riferimento a cartella
- **config**: configurazioni app

Backup automatico salvato in `%APPDATA%/NuotoTodo/backups/`

## Licenza

MIT
