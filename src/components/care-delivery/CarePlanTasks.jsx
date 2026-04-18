'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Target } from 'lucide-react';

export default function CarePlanTasks({ clientId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const fetchGoals = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/care-plans`);
        if (res.ok) {
          const data = await res.json();
          const allGoals = (data.carePlans || []).flatMap(cp =>
            (cp.goals || []).map(g => ({ ...g, carePlanName: cp.name }))
          );
          setGoals(allGoals);
        }
      } catch (err) {
        console.error('Error fetching care plan goals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [clientId]);

  const handleToggle = async (goalId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    try {
      await fetch(`/api/care-plan-goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}><div className="loading-spinner" /></div>;
  }

  if (goals.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <Target size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <p style={{ fontSize: '14px', margin: 0 }}>No care plan goals found for this client</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>Create a care plan to add goals</p>
      </div>
    );
  }

  const grouped = goals.reduce((acc, g) => {
    const key = g.carePlanName || 'Unnamed Plan';
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  return (
    <div style={{ padding: '16px' }}>
      {Object.entries(grouped).map(([planName, planGoals]) => (
        <div key={planName} style={{ marginBottom: '20px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {planName}
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {planGoals.map(goal => (
              <div
                key={goal.id}
                onClick={() => handleToggle(goal.id, goal.status)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  backgroundColor: goal.status === 'COMPLETED' ? '#F0FDF4' : 'white',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {goal.status === 'COMPLETED' ? (
                  <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} />
                ) : (
                  <Circle size={18} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 500,
                    textDecoration: goal.status === 'COMPLETED' ? 'line-through' : 'none',
                    color: goal.status === 'COMPLETED' ? 'var(--color-text-secondary)' : 'var(--color-text)',
                  }}>
                    {goal.title || goal.description}
                  </div>
                  {goal.targetDate && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {goal.priority === 'HIGH' && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 600 }}>
                    HIGH
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
