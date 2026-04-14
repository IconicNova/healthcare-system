'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, FileText, Edit2, Trash2 } from 'lucide-react';
import AddProgressNoteModal from './AddProgressNoteModal';

const NOTE_TYPE_CONFIG = {
  SOAP: { label: 'SOAP Note', color: '#3B82F6' },
  DAP: { label: 'DAP Note', color: '#10B981' },
  NARRATIVE: { label: 'Narrative', color: '#8B5CF6' },
  INCIDENT: { label: 'Incident Report', color: '#EF4444' },
};

export default function ProgressNotesTab({ clientId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    if (!clientId) return;

    const fetchNotes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/progress-notes`);
        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes || []);
        }
      } catch (error) {
        console.error('Error fetching progress notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [clientId]);

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/progress-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  if (!clientId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Select a client to view progress notes</p>
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Progress Notes</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Document client progress with structured notes
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add Note
        </button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--color-gray-50)', borderRadius: '12px' }}>
          <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No progress notes yet. Add your first note to document client progress.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notes.map(note => {
            const noteConfig = NOTE_TYPE_CONFIG[note.type] || NOTE_TYPE_CONFIG.SOAP;
            const formatted = formatDateTime(note.createdAt);

            return (
              <div
                key={note.id}
                style={{
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: `${noteConfig.color}15`,
                      color: noteConfig.color,
                    }}>
                      {noteConfig.label}
                    </span>
                    {note.visitId && (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Linked to visit
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(note)}
                      style={{
                        padding: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title="Edit note"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      style={{
                        padding: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {note.subjective && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Subjective
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {note.subjective}
                    </div>
                  </div>
                )}

                {note.objective && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Objective
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {note.objective}
                    </div>
                  </div>
                )}

                {note.assessment && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Assessment
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {note.assessment}
                    </div>
                  </div>
                )}

                {note.plan && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Plan
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {note.plan}
                    </div>
                  </div>
                )}

                {note.narrative && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Note
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {note.narrative}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <Calendar size={12} />
                    {formatted.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <Clock size={12} />
                    {formatted.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddProgressNoteModal
          clientId={clientId}
          existingNote={editingNote}
          onClose={() => {
            setShowAddModal(false);
            setEditingNote(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingNote(null);
            // Refresh notes
            const fetchNotes = async () => {
              const response = await fetch(`/api/clients/${clientId}/progress-notes`);
              if (response.ok) {
                const data = await response.json();
                setNotes(data.notes || []);
              }
            };
            fetchNotes();
          }}
        />
      )}
    </div>
  );
}
