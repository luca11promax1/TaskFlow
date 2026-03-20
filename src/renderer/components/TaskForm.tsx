import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Task } from '../stores/useAppStore';

interface TaskFormProps {
  task?: Task | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function TaskForm({ task, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<'alta' | 'media' | 'bassa' | null>(
    (task?.priority as any) || null
  );
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
      };

      await onSave(formData);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Modifica task' : 'Nuova task'}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Titolo *</label>
            <input
              id="title"
              type="text"
              placeholder="Titolo della task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrizione</label>
            <textarea
              id="description"
              placeholder="Descrizione dettagliata (opzionale)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priorità (opzionale)</label>
              <select
                id="priority"
                value={priority || ''}
                onChange={(e) => setPriority(e.target.value as any || null)}
                disabled={loading}
              >
                <option value="">— Nessuna priorità —</option>
                <option value="bassa">🟢 Bassa</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🔴 Alta</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Data di scadenza</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvataggio...' : task ? 'Aggiorna' : 'Crea'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
