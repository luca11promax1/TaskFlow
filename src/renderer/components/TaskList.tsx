import React, { useEffect, useState } from 'react';
import { Trash2, Plus, CheckCircle2, Circle, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import TaskForm from './TaskForm';

export default function TaskList() {
  const {
    tasks,
    selectedFolderId,
    selectedFolderName,
    setTasks,
    addTask,
    removeTask,
    updateTask,
  } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [selectedFolderId]);

  async function loadTasks() {
    try {
      const result = await (window as any).electron.listTasks(selectedFolderId);
      if (result.success) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  async function handleSaveTask(formData: any) {
    try {
      let result;
      
      if (editingTask) {
        // Aggiorna task esistente
        result = await (window as any).electron.updateTask(editingTask.id, formData);
        if (result.success) {
          updateTask(result.data);
        }
      } else {
        // Crea nuova task
        const newTask = {
          folder_id: selectedFolderId,
          ...formData,
        };
        result = await (window as any).electron.createTask(newTask);
        if (result.success) {
          addTask(result.data);
        }
      }

      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  async function handleToggleComplete(id: number, completed: boolean) {
    try {
      const result = await (window as any).electron.updateTask(id, { completed: !completed });
      if (result.success) {
        updateTask(result.data);
      } else {
        alert('Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  async function handleDeleteTask(id: number) {
    if (!confirm('Eliminare la task?')) return;

    try {
      const result = await (window as any).electron.deleteTask(id);
      if (result.success) {
        removeTask(id);
      } else {
        alert('Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Errore durante l\'eliminazione della task');
    }
  }

  async function handleMoveUp(taskId: number) {
    try {
      const result = await (window as any).electron.moveTaskUp(taskId, selectedFolderId);
      if (result.success) {
        setTasks(result.data);
      } else {
        alert('Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Error moving task up:', error);
    }
  }

  async function handleMoveDown(taskId: number) {
    try {
      const result = await (window as any).electron.moveTaskDown(taskId, selectedFolderId);
      if (result.success) {
        setTasks(result.data);
      } else {
        alert('Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Error moving task down:', error);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return '🔴 Alta';
      case 'media':
        return '🟡 Media';
      case 'bassa':
        return '🟢 Bassa';
      default:
        return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return '#ef4444';
      case 'media':
        return '#f59e0b';
      case 'bassa':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isDueSoon = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 3);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= tomorrow;
  };

  return (
    <main className="task-list-container">
      <div className="task-header">
        <h2>📝 {selectedFolderName}</h2>
        <div className="filter-buttons">
          <button
            className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutto
          </button>
          <button
            className={`btn-filter ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Attive
          </button>
          <button
            className={`btn-filter ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completate
          </button>
        </div>
      </div>

      <div className="tasks">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            {filter === 'all' && 'Nessuna task. Creane una!'}
            {filter === 'active' && 'Nessuna task attiva.'}
            {filter === 'completed' && 'Nessuna task completata.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.due_date) && !task.completed ? 'overdue' : ''}`}>
              <button
                className="btn-toggle"
                onClick={() => handleToggleComplete(task.id, task.completed)}
                title={task.completed ? 'Segna come incompleta' : 'Segna come completata'}
              >
                {task.completed ? (
                  <CheckCircle2 size={22} color="green" />
                ) : (
                  <Circle size={22} />
                )}
              </button>

              <div className="task-content">
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-description">{task.description}</div>}
                <div className="task-meta">
                  {task.priority && (
                    <span
                      className="task-priority"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`task-due-date ${isOverdue(task.due_date) && !task.completed ? 'overdue' : isDueSoon(task.due_date) ? 'soon' : ''}`}>
                      📅 {new Date(task.due_date).toLocaleDateString('it-IT')}
                    </span>
                  )}
                </div>
              </div>

              <div className="task-actions">
                <button
                  className="btn-move"
                  onClick={() => handleMoveUp(task.id)}
                  title="Sposta in su"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  className="btn-move"
                  onClick={() => handleMoveDown(task.id)}
                  title="Sposta in giù"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  className="btn-edit"
                  onClick={() => {
                    setEditingTask(task);
                    setIsFormOpen(true);
                  }}
                  title="Modifica"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Elimina"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        className="btn-new-task"
        onClick={() => {
          setEditingTask(null);
          setIsFormOpen(true);
        }}
      >
        <Plus size={20} />
        Nuova task
      </button>

      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </main>
  );
}
