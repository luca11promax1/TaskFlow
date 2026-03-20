import { create } from 'zustand';

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

interface AppStore {
  folders: Folder[];
  tasks: Task[];
  selectedFolderId: number | null;
  selectedFolderName: string;
  darkMode: boolean;

  // Folder actions
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  removeFolder: (id: number) => void;
  updateFolder: (folder: Folder) => void;

  // Task actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  removeTask: (id: number) => void;
  updateTask: (task: Task) => void;

  // UI state
  setSelectedFolder: (id: number | null, name: string) => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  folders: [],
  tasks: [],
  selectedFolderId: null,
  selectedFolderName: 'Inbox',
  darkMode: false,

  setFolders: (folders) => set({ folders }),
  addFolder: (folder) =>
    set((state) => ({ folders: [...state.folders, folder] })),
  removeFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
    })),
  updateFolder: (folder) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folder.id ? folder : f)),
    })),

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  updateTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    })),

  setSelectedFolder: (id, name) =>
    set({ selectedFolderId: id, selectedFolderName: name }),
  setDarkMode: (enabled) => set({ darkMode: enabled }),
}));
