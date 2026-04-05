'use client';

import { useState, useEffect } from 'react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';

export default function ClientCarePlansTab({ clientId }) {
  const [loading, setLoading] = useState(true);
  const [carePlans, setCarePlans] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    async function fetchCarePlans() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setCarePlans(data.carePlans || []);
        }
      } catch (error) {
        console.error('Error fetching care plans:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCarePlans();
  }, [clientId]);

  const getStatusBadge = (carePlan) => {
    if (!carePlan.status) return { label: 'Inactive', variant: 'default' };

    const now = new Date();
    if (carePlan.endDate && new Date(carePlan.endDate) < now) {
      return { label: 'Expired', variant: 'error' };
    }
    return { label: 'Active', variant: 'success' };
  };

  const getNextVisit = (carePlan) => {
    // This would typically come from the care plan's scheduled visits
    // For now, we'll show a placeholder
    return null;
  };

  if (loading) {
    return <div>Loading care plans...</div>;
  }

  if (carePlans.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Calendar size={48} color="var(--color-border)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
              No Care Plans
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Create a care plan to schedule visits and track care activities
            </p>
            <Button>
              <Calendar size={16} />
              Create Care Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {carePlans.map((plan) => {
        const statusBadge = getStatusBadge(plan);
        const isExpanded = expandedPlan === plan.id;

        return (
          <div key={plan.id} className="card">
            <div className="card-body">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: statusBadge.variant === 'success' ? '#dcfce7' : '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={24} color={statusBadge.variant === 'success' ? '#16a34a' : '#6b7280'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                        {plan.name}
                      </h3>
                      <StatusBadge status={statusBadge.label} variant={statusBadge.variant} />
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {plan.description || 'No description provided'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  style={{
                    padding: '8px',
                    border: 'none',
                    background: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                  <ChevronRight size={16} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              {/* Quick Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Duration</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {format(new Date(plan.startDate), 'MMM d, yyyy')} - {plan.endDate ? format(new Date(plan.endDate), 'MMM d, yyyy') : 'Ongoing'}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Assigned Staff</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {plan.staff?.firstName} {plan.staff?.lastName}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Service</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {plan.service?.name || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{ padding: '16px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px', marginTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
                    Upcoming Visits
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Placeholder - in full implementation, this would show scheduled visits */}
                    <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px dashed var(--color-border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        No visits scheduled for this care plan
                      </div>
                    </div>
                    <Button variant="secondary" size="small" style={{ width: 'fit-content' }}>
                      <Calendar size={14} />
                      Schedule Visit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
