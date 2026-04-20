'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Check } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

// UX-7: WYSIWYG Toolbar component
function EditorToolbar({ editor }) {
  if (!editor) return null;

  const btnStyle = (isActive) => ({
    padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 600,
    border: '1px solid var(--color-border)', cursor: 'pointer',
    background: isActive ? 'var(--color-primary-light)' : 'var(--color-bg)',
    color: isActive ? 'white' : 'var(--color-text)',
  });

  return (
    <div style={{
      display: 'flex', gap: '4px', padding: '6px 8px', flexWrap: 'wrap',
      borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
      borderRadius: '8px 8px 0 0',
    }}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
        style={btnStyle(editor.isActive('bold'))} title="Bold (Ctrl+B)">B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
        style={btnStyle(editor.isActive('italic'))} title="Italic (Ctrl+I)"><em>I</em></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
        style={btnStyle(editor.isActive('strike'))} title="Strikethrough"><s>S</s></button>
      <span style={{ width: '1px', background: 'var(--color-border)', margin: '0 4px' }} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={btnStyle(editor.isActive('bulletList'))} title="Bullet List">• List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={btnStyle(editor.isActive('orderedList'))} title="Numbered List">1. List</button>
      <span style={{ width: '1px', background: 'var(--color-border)', margin: '0 4px' }} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={btnStyle(editor.isActive('heading', { level: 3 }))} title="Heading">H</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={btnStyle(editor.isActive('blockquote'))} title="Quote">&ldquo;</button>
    </div>
  );
}

// Reusable WYSIWYG editor
function RichEditor({ content, onUpdate, placeholder, readOnly }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || 'Write something...' }),
    ],
    content: content || '',
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {!readOnly && <EditorToolbar editor={editor} />}
      <div style={{ padding: '10px 12px', minHeight: '80px', fontSize: '14px' }}
        className="tiptap-editor-content"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default function VisitNotesTab({ visitId, onCountChange }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!visitId) return;
    fetchNotes();
  }, [visitId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/visits/${visitId}/notes`);
      if (res.ok) {
        const data = await res.json();
        const notesList = data.notes || [];
        setNotes(notesList);
        onCountChange?.(notesList.length);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const stripped = newContent.replace(/<[^>]*>/g, '').trim();
    if (!stripped) return;

    try {
      const res = await fetch(`/api/visits/${visitId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        setNewContent('');
        setShowAdd(false);
        fetchNotes();
      }
    } catch {}
  };

  // LOGIC-6: Edit note
  const handleEdit = async (noteId) => {
    const stripped = editContent.replace(/<[^>]*>/g, '').trim();
    if (!stripped) return;

    try {
      const res = await fetch(`/api/visit-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditContent('');
        fetchNotes();
      }
    } catch {}
  };

  // LOGIC-6: Delete note
  const handleDelete = async (noteId) => {
    try {
      const res = await fetch(`/api/visit-notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotes();
      }
    } catch {}
    setDeleteConfirm(null);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><div className="loading-spinner" /></div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {/* UX-14: Renamed from "View Notes" */}
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Visit Notes</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: 'none',
            background: 'var(--color-primary)', color: 'white',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500,
          }}
        >
          <Plus size={14} /> Add Note
        </button>
      </div>

      {/* Add note form — UX-7: Full WYSIWYG */}
      {showAdd && (
        <div style={{
          border: '1px solid var(--color-border)', borderRadius: '10px',
          padding: '16px', marginBottom: '16px', background: 'var(--color-bg-secondary)',
        }}>
          <RichEditor
            content={newContent}
            onUpdate={setNewContent}
            placeholder="Write your visit note here... (supports bold, lists, headings)"
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button onClick={() => { setShowAdd(false); setNewContent(''); }} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
              border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleAdd} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
              border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer',
            }}>Save Note</button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 && !showAdd ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
          No visit notes yet. Click &ldquo;Add Note&rdquo; to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notes.map(note => (
            <div key={note.id} style={{
              border: '1px solid var(--color-border)', borderRadius: '10px',
              padding: '14px', background: 'var(--color-bg)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <span>📅 {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>🕐 {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <span style={{ fontStyle: 'italic' }}>(edited)</span>
                  )}
                </div>
                {/* LOGIC-6: Edit & Delete buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {editingId === note.id ? (
                    <>
                      <button onClick={() => handleEdit(note.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', padding: '4px',
                      }} title="Save"><Check size={14} /></button>
                      <button onClick={() => { setEditingId(null); setEditContent(''); }} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: '4px',
                      }} title="Cancel"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(note.id); setEditContent(note.content); }} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: '4px',
                      }} title="Edit note"><Edit3 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(note.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: '4px',
                      }} title="Delete note"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              {editingId === note.id ? (
                <RichEditor
                  content={editContent}
                  onUpdate={setEditContent}
                  placeholder="Edit your note..."
                />
              ) : (
                <div
                  style={{ fontSize: '14px', lineHeight: 1.6 }}
                  className="tiptap-render"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
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
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Delete Note?</h3>
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
