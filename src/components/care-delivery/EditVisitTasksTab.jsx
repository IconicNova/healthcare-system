'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Edit } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function VisitTasksTab({ visitId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'General' });
  const [editingTask, setEditingTask] = useState(null);

  const CATEGORIES = ['Assessment', 'Treatment', 'Documentation', 'Education', 'General'];

  useEffect(() => {
    if (!visitId) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/visits/${visitId}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [visitId]);

  const handleToggleTask = async (taskId, completed) => {
    try {
      const response = await fetch(`/api/visit-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch(`/api/visits/${visitId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          category: newTask.category,
        }),
      });

      if (response.ok) {
        const task = await response.json();
        setTasks(prev => [...prev, task]);
        setNewTask({ title: '', category: 'General' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/visit-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {});

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!visitId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Select a visit to view tasks</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Progress Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Task Progress</h4>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <div style={{ height: '8px', backgroundColor: 'var(--color-gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary)',
            borderRadius: '4px',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px dashed var(--color-border)',
          backgroundColor: 'var(--color-gray-50)',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        <Plus size={18} />
        Add Task
      </button>

      {/* Task Groups */}
      {Object.keys(groupedTasks).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: '14px' }}>No tasks yet. Add tasks to track your visit activities.</p>
        </div>
      ) : (
        Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <h5 style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {category} ({categoryTasks.filter(t => t.completed).length}/{categoryTasks.length})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoryTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--color-white)',
                    border: `1px solid ${task.completed ? 'var(--color-success)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--color-success)',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{
                    flex: 1,
                    fontSize: '14px',
                    color: task.completed ? 'var(--color-text-secondary)' : 'var(--color-text)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </span>
                  {task.notes && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      ✓ {task.notes}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-error)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Task"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              Task Title *
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Change surgical dressing"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              Category
            </label>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                backgroundColor: 'white',
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                color: 'var(--color-text)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              disabled={!newTask.title.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: newTask.title.trim() ? 'var(--color-primary)' : 'var(--color-gray-200)',
                color: newTask.title.trim() ? 'white' : 'var(--color-text-muted)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Add Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
