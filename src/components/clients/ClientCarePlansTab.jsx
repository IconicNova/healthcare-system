'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/useToast';
import { Calendar, ChevronRight, Plus } from 'lucide-react';

export default function ClientCarePlansTab({ clientId }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [carePlans, setCarePlans] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

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

  const handleCreateCarePlan = async () => {
    if (!createForm.name.trim()) {
      toast('warning', 'Missing Name', 'Please enter a care plan name');
      return;
    }
    if (!createForm.startDate) {
      toast('warning', 'Missing Start Date', 'Please select a start date');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/care-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || null,
          startDate: createForm.startDate,
          endDate: createForm.endDate || null,
          clientId,
        }),
      });

      if (response.ok) {
        const newCarePlan = await response.json();
        setCarePlans(prev => [...prev, newCarePlan]);
        setShowCreateForm(false);
        setCreateForm({ name: '', description: '', startDate: '', endDate: '' });
        toast('success', 'Created', 'Care plan saved successfully');
      } else {
        const error = await response.json();
        toast('error', 'Creation Failed', error.error || 'Failed to create care plan');
      }
    } catch (error) {
      console.error('Error creating care plan:', error);
      toast('error', 'Creation Failed', 'Failed to create care plan');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleVisit = (carePlanId) => {
    const params = new URLSearchParams({
      fromCarePlan: carePlanId,
    });
    router.push(`/scheduling/month?${params.toString()}`);
  };

  const getStatusBadge = (carePlan) => {
    if (!carePlan.status) return { label: 'Inactive', variant: 'default' };

    const now = new Date();
    if (carePlan.endDate && new Date(carePlan.endDate) < now) {
      return { label: 'Expired', variant: 'error' };
    }
    return { label: 'Active', variant: 'success' };
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
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={16} />
              Create Care Plan
            </Button>

            {showCreateForm && (
              <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
                  Create New Care Plan
                </h4>
                <Input
                  label="Care Plan Name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ marginBottom: '12px' }}
                />
                <Input
                  label="Description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  style={{ marginBottom: '12px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <Input
                    label="Start Date"
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <Input
                    label="End Date (optional)"
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="small" onClick={handleCreateCarePlan} disabled={saving}>
                    Create
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
          Care Plans ({carePlans.length})
        </h3>
        <Button onClick={() => setShowCreateForm(true)} variant="secondary" size="small">
          <Plus size={14} />
          Add Care Plan
        </Button>
      </div>
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
                        Schedule the first visit for this care plan to start building the care timeline here.
                      </div>
                    </div>
                    <Button variant="secondary" size="small" style={{ width: 'fit-content' }} onClick={() => handleScheduleVisit(plan.id)}>
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

      {/* Create Care Plan Form - shown when there are existing care plans */}
      {showCreateForm && (
        <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
            Create New Care Plan
          </h4>
          <Input
            label="Care Plan Name"
            value={createForm.name}
            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
            style={{ marginBottom: '12px' }}
          />
          <Input
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
            multiline
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <Input
              label="Start Date"
              type="date"
              value={createForm.startDate}
              onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <Input
              label="End Date (optional)"
              type="date"
              value={createForm.endDate}
              onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="small" onClick={handleCreateCarePlan} disabled={saving}>
              Create
            </Button>
            <Button variant="secondary" size="small" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
