'use client';

import { useState, useEffect } from 'react';
import { UserPlus, X, Search } from 'lucide-react';

export default function StaffAssignment({ visitId, currentStaff, onAssign }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/staff?limit=100')
      .then(r => r.json())
      .then(data => setStaff(data.staff || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = staff.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
  });

  const handleAssign = async (staffId) => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId }),
      });
      if (res.ok) {
        const updated = await res.json();
        onAssign?.(updated);
        setOpen(false);
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '8px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'white', fontSize: '12px', fontWeight: 500,
          cursor: 'pointer', color: 'var(--color-text)',
        }}
      >
        <UserPlus size={14} />
        {currentStaff ? 'Reassign' : 'Assign Staff'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
        }} onClick={() => setOpen(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '420px', maxHeight: '70vh', overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Assign Staff</h4>
              <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                  border: '1px solid var(--color-border)', fontSize: '14px',
                }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filtered.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleAssign(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '8px', border: 'none',
                      backgroundColor: currentStaff?.id === s.id ? 'var(--color-primary-light)' : 'white',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = currentStaff?.id === s.id ? 'var(--color-primary-light)' : 'white'}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                      fontWeight: 600, color: 'white', flexShrink: 0,
                    }}>
                      {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.role || 'Staff'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
