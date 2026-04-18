'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';

export default function VisitNotesTab({ visitId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visitId) return;

    const fetchNotes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/visits/${visitId}/notes`);
        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes || []);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [visitId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/visits/${visitId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });

      if (response.ok) {
        const note = await response.json();
        setNotes(prev => [note, ...prev]);
        setNewNote('');
        setShowAddNote(false);
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  if (!visitId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Select a visit to view notes</p>
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
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Visit Notes</h4>
        <button
          onClick={() => setShowAddNote(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
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
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No notes yet. Add your first note to document this visit.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notes.map(note => (
            <div
              key={note.id}
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <Calendar size={12} />
                  {formatDateTime(note.createdAt).date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <Clock size={12} />
                  {formatDateTime(note.createdAt).time}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {note.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 500,
        }} onClick={() => setShowAddNote(false)}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Add Visit Note</h4>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Document your observations, assessments, and interventions..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                resize: 'vertical',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddNote(false)}
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
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: newNote.trim() ? 'var(--color-primary)' : 'var(--color-gray-200)',
                  color: newNote.trim() ? 'white' : 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
