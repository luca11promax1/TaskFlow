import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import Header from './components/Header';
import './App.css';

function App() {
  const { darkMode, setDarkMode, setFolders, setTasks, setSelectedFolder } =
    useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupNotifications();
  }, []);

  async function loadData() {
    try {
      const foldersResult = await (window as any).electron.listFolders();
      if (foldersResult.success) {
        setFolders(foldersResult.data);
      }

      const tasksResult = await (window as any).electron.listTasks();
      if (tasksResult.success) {
        setTasks(tasksResult.data);
      }

      setSelectedFolder(null, 'Inbox');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function setupNotifications() {
    // Check per task scadute ogni minuto
    const interval = setInterval(() => {
      checkDueTasks();
    }, 60000);

    return () => clearInterval(interval);
  }

  function checkDueTasks() {
    const { tasks } = useAppStore.getState();
    const now = new Date();

    tasks.forEach((task) => {
      if (!task.completed && task.due_date) {
        const dueDate = new Date(task.due_date);
        const oneDayBefore = new Date(dueDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        if (now >= oneDayBefore && now < dueDate && !globalThis.localStorage.getItem(`notified-${task.id}`)) {
          showNotification(task.title, `Task scade il ${task.due_date}`);
          globalThis.localStorage.setItem(`notified-${task.id}`, 'true');
        }
      }
    });
  }

  function showNotification(title: string, body: string) {
    if ('Notification' in globalThis && (globalThis as any).Notification.permission === 'granted') {
      new (globalThis as any).Notification(title, { body, icon: '/icon.png' });
    } else if ('Notification' in globalThis && (globalThis as any).Notification.permission !== 'denied') {
      (globalThis as any).Notification.requestPermission().then((permission: string) => {
        if (permission === 'granted') {
          new (globalThis as any).Notification(title, { body, icon: '/icon.png' });
        }
      });
    }
  }

  if (loading) {
    return (
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Header onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container">
        <Sidebar />
        <TaskList />
      </div>
    </div>
  );
}

export default App;
