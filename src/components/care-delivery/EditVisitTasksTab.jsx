'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

const TERMINAL_STATUSES = ['COMPLETED', 'APPROVED', 'CANCELLED'];
const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High', color: '#EF4444', bg: '#FEE2E2' },
  { value: 'MEDIUM', label: 'Medium', color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'LOW', label: 'Low', color: '#6B7280', bg: '#F3F4F6' },
];
const CATEGORY_OPTIONS = ['General', 'Assessment', 'Medication', 'Personal Care', 'Nutrition', 'Documentation', 'Other'];

export default function EditVisitTasksTab({ visitId, visitStatus, onCountChange }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [newTask, setNewTask] = useState({ title: '', category: 'General', priority: 'MEDIUM', notes: '' });
  const [addError, setAddError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const onCountChangeRef = useRef(onCountChange);

  const isReadOnly = TERMINAL_STATUSES.includes(visitStatus);

  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  const fetchTasks = useCallback(async () => {
    if (!visitId) return;
    try {
      setLoadError('');
      setLoading(true);
      const res = await fetch(`/api/visits/${visitId}/tasks`);
      if (!res.ok) {
        throw new Error('Failed to load service tasks');
      }
      const data = await res.json();
      const taskList = data.tasks || [];
      setTasks(taskList);
      const completed = taskList.filter(t => t.completed).length;
      onCountChangeRef.current?.(`${completed}/${taskList.length}`);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
      setLoadError('Unable to load service tasks right now.');
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    if (!visitId) return;
    fetchTasks();
  }, [fetchTasks, visitId]);

  const syncTaskCount = (taskList) => {
    const completed = taskList.filter((task) => task.completed).length;
    onCountChangeRef.current?.(`${completed}/${taskList.length}`);
  };

  const handleAddTask = async () => {
    setAddError('');
    const trimmed = newTask.title.trim();

    // LOGIC-5: Title validation
    if (!trimmed) {
      setAddError('Task title is required');
      return;
    }
    if (trimmed.length < 3) {
      setAddError('Title must be at least 3 characters');
      return;
    }
    if (trimmed.length > 200) {
      setAddError('Title must be under 200 characters');
      return;
    }

    // BUG-3: Frontend duplicate check
    const duplicate = tasks.find(
      t => t.title.toLowerCase() === trimmed.toLowerCase() &&
        (t.category || 'General') === newTask.category
    );
    if (duplicate) {
      setAddError('A task with this title already exists in this category');
      return;
    }

    try {
      const res = await fetch(`/api/visits/${visitId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          category: newTask.category,
          priority: newTask.priority,
          notes: newTask.notes || null,
        }),
      });

      if (res.status === 409) {
        setAddError('A task with this title already exists in this category');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setAddError(data.error || 'Failed to create task');
        return;
      }

      const task = await res.json();
      const updated = [...tasks, task];
      setTasks(updated);
      const completed = updated.filter(t => t.completed).length;
      onCountChange?.(`${completed}/${updated.length}`);
      setNewTask({ title: '', category: 'General', priority: 'MEDIUM', notes: '' });
      setShowAddTask(false);
    } catch {
      setAddError('Failed to create task');
    }
  };

  const handleToggle = async (task) => {
    if (isReadOnly) return;
    setMutationError('');
    const newCompleted = !task.completed;
    const previousTasks = tasks;

    // Optimistic update
    const updated = tasks.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t);
    setTasks(updated);
    syncTaskCount(updated);

    try {
      const res = await fetch(`/api/visit-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update task');
      }
    } catch {
      // Revert on error
      setTasks(previousTasks);
      syncTaskCount(previousTasks);
      setMutationError('Unable to save that task change.');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const res = await fetch(`/api/visit-tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = tasks.filter(t => t.id !== taskId);
        setTasks(updated);
        syncTaskCount(updated);
      } else {
        const data = await res.json().catch(() => ({}));
        setMutationError(data.error || 'Unable to delete task.');
      }
    } catch {
      console.error('Failed to delete task');
      setMutationError('Unable to delete task.');
    }
    setDeleteConfirm(null);
  };

  // UX-5: Update task notes inline
  const handleUpdateNotes = async (taskId, notes) => {
    setMutationError('');
    const previousTasks = tasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, notes } : t);
    setTasks(updated);

    try {
      const res = await fetch(`/api/visit-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update task notes');
      }
    } catch {
      setTasks(previousTasks);
      setMutationError('Unable to save task notes.');
    }
  };

  // UX-4: Update priority
  const handlePriorityChange = async (taskId, priority) => {
    setMutationError('');
    const previousTasks = tasks;
    const updated = tasks.map(t => t.id === taskId ? { ...t, priority } : t);
    setTasks(updated);

    try {
      const res = await fetch(`/api/visit-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update task priority');
      }
    } catch {
      setTasks(previousTasks);
      setMutationError('Unable to save task priority.');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  // Group by category and sort by priority within groups
  const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const grouped = tasks.reduce((acc, task) => {
    const cat = task.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {});

  // Sort each group by priority
  Object.values(grouped).forEach(group => {
    group.sort((a, b) => (PRIORITY_ORDER[a.priority] || 1) - (PRIORITY_ORDER[b.priority] || 1));
  });

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><div className="loading-spinner" /></div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
          borderRadius: '8px', background: '#FEF2F2', color: '#B91C1C', marginBottom: '12px',
        }}>
          <AlertTriangle size={16} />
          <span>{loadError}</span>
        </div>
        <button
          onClick={fetchTasks}
          style={{
            padding: '8px 14px', borderRadius: '8px', border: 'none',
            background: 'var(--color-primary)', color: 'white', cursor: 'pointer',
            fontSize: '13px', fontWeight: 500,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Task Progress</h3>
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {completedCount} of {tasks.length} completed
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: progress === 100 ? '#10B981' : '#3B82F6',
          borderRadius: '3px', transition: 'width 0.3s ease',
        }} />
      </div>

      {/* LOGIC-7: Read-only notice */}
      {isReadOnly && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
          background: '#FEF3C7', borderRadius: '8px', marginBottom: '16px',
          fontSize: '13px', color: '#B45309',
        }}>
          <AlertTriangle size={16} />
          Tasks are view-only for {visitStatus?.toLowerCase()} visits.
        </div>
      )}

      {mutationError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
          background: '#FEE2E2', borderRadius: '8px', marginBottom: '16px',
          fontSize: '13px', color: '#991B1B',
        }}>
          <AlertTriangle size={16} />
          {mutationError}
        </div>
      )}

      {/* Add Task button */}
      {!isReadOnly && (
        <button
          onClick={() => setShowAddTask(!showAddTask)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
            padding: '10px 14px', borderRadius: '8px',
            border: '1px dashed var(--color-border)', background: 'var(--color-bg)',
            cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-secondary)',
            marginBottom: '16px',
          }}
        >
          <Plus size={16} /> Add Task
        </button>
      )}

      {/* Add Task form */}
      {showAddTask && (
        <div style={{
          border: '1px solid var(--color-border)', borderRadius: '10px',
          padding: '16px', marginBottom: '16px', background: 'var(--color-bg-secondary)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                Task Title *
              </label>
              <input
                type="text"
                value={newTask.title}
                maxLength={200}
                placeholder="e.g., Check blood pressure"
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', fontSize: '14px',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                {newTask.title.length}/200 (min 3)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    border: '1px solid var(--color-border)', fontSize: '13px',
                  }}
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    border: '1px solid var(--color-border)', fontSize: '13px',
                  }}
                >
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Notes (optional)</label>
              <textarea
                value={newTask.notes}
                onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional details..."
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', fontSize: '13px', resize: 'vertical',
                }}
              />
            </div>
            {addError && (
              <span style={{ color: '#EF4444', fontSize: '13px' }}>{addError}</span>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddTask(false); setAddError(''); }}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleAddTask}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                  border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer',
                }}
              >Add Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks grouped by category */}
      {Object.entries(grouped).map(([category, categoryTasks]) => {
        const catCompleted = categoryTasks.filter(t => t.completed).length;
        return (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '8px', padding: '0 4px',
            }}>
              {category} ({catCompleted}/{categoryTasks.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {categoryTasks.map(task => {
                const priorityConfig = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[1];
                const isExpanded = expandedNotes[task.id];

                return (
                  <div key={task.id} style={{
                    border: '1px solid var(--color-border)', borderRadius: '8px',
                    padding: '10px 14px', background: task.completed ? 'var(--color-bg-secondary)' : 'var(--color-bg)',
                    opacity: task.completed ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggle(task)}
                        disabled={isReadOnly}
                        style={{ width: '18px', height: '18px', cursor: isReadOnly ? 'not-allowed' : 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{
                        flex: 1, fontSize: '14px',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'var(--color-text-secondary)' : 'var(--color-text)',
                      }}>
                        {task.title}
                      </span>

                      {/* UX-4: Priority badge */}
                      {!isReadOnly ? (
                        <select
                          value={task.priority || 'MEDIUM'}
                          onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                          style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                            border: 'none', background: priorityConfig.bg, color: priorityConfig.color,
                            cursor: 'pointer',
                          }}
                        >
                          {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      ) : (
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                          background: priorityConfig.bg, color: priorityConfig.color,
                        }}>
                          {priorityConfig.label}
                        </span>
                      )}

                      {/* UX-5: Expand notes toggle */}
                      <button
                        onClick={() => setExpandedNotes(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: task.notes ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                          padding: '2px',
                        }}
                        title={task.notes ? 'View notes' : 'Add notes'}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {!isReadOnly && (
                        <button
                          onClick={() => setDeleteConfirm(task.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-tertiary)', padding: '2px',
                          }}
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* UX-5: Inline notes */}
                    {isExpanded && (
                      <div style={{ marginTop: '8px', paddingLeft: '28px' }}>
                        <textarea
                          value={task.notes || ''}
                          onChange={(e) => {
                            setTasks(prev => prev.map(t =>
                              t.id === task.id ? { ...t, notes: e.target.value } : t
                            ));
                          }}
                          onBlur={(e) => handleUpdateNotes(task.id, e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Task notes (e.g., applied 2x2 gauze, wound improving)..."
                          rows={2}
                          style={{
                            width: '100%', padding: '6px 8px', borderRadius: '6px',
                            border: '1px solid var(--color-border)', fontSize: '12px',
                            resize: 'vertical', background: isReadOnly ? 'var(--color-bg-secondary)' : 'var(--color-bg)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && !showAddTask && (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
          No tasks assigned to this visit yet.
        </div>
      )}

      {/* UX-9: Styled delete confirmation */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            background: 'var(--color-bg)', borderRadius: '12px',
            padding: '24px', maxWidth: '360px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Delete Task?</h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', cursor: 'pointer', fontSize: '14px',
              }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
