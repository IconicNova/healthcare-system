'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Edit2, Calendar, Clock, User, CheckCircle, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CarePlanForm from '@/components/care-plans/CarePlanForm';
import { getDisplayText } from '@/lib/display-text';
import { useBreadcrumbLabel } from '@/components/layout/BreadcrumbLabelsContext';

export default function CarePlanDetailPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [carePlan, setCarePlan] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  useBreadcrumbLabel(`/care-plans/${params.id}`, carePlan?.name);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    setShowEditModal(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [carePlanRes, clientsRes, staffRes, servicesRes] = await Promise.all([
        fetch(`/api/care-plans/${params.id}`),
        fetch('/api/clients?limit=100'),
        fetch('/api/staff?limit=100'),
        fetch('/api/services'),
      ]);

      if (carePlanRes.ok) setCarePlan(await carePlanRes.json());
      if (clientsRes.ok) setClients((await clientsRes.json()).clients || []);
      if (staffRes.ok) setStaff((await staffRes.json()).staff || []);
      if (servicesRes.ok) setServices(await servicesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.replace(`/care-plans/${params.id}?edit=true`);
  };

  const handleCloseEditModal = () => {
    router.replace(`/care-plans/${params.id}`);
  };

  const handleUpdate = async (data) => {
    try {
      const response = await fetch(`/api/care-plans/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchData();
        handleCloseEditModal();
      }
    } catch (error) {
      console.error('Error updating care plan:', error);
      alert('Failed to update care plan');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this care plan?')) return;

    try {
      const response = await fetch(`/api/care-plans/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/care-plans');
      }
    } catch (error) {
      console.error('Error deleting care plan:', error);
      alert('Failed to delete care plan');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!carePlan) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Care Plan Not Found</h1>
        <Button onClick={() => router.push('/care-plans')}>Back to Care Plans</Button>
      </div>
    );
  }

  const upcomingVisits = carePlan.visits?.filter(v => v.status === 'SCHEDULED') || [];
  const completedVisits = carePlan.visits?.filter(v => v.status === 'COMPLETED') || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {carePlan.name}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Care Plan Details
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={handleEdit}>
              <Edit2 size={16} />
              Edit Care Plan
            </Button>
            <Button onClick={handleDelete} style={{ backgroundColor: 'var(--color-error)' }}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 500,
          backgroundColor: carePlan.status ? 'var(--color-success-light)' : 'var(--color-gray-100)',
          color: carePlan.status ? 'var(--color-success)' : 'var(--color-text-secondary)',
        }}>
          {carePlan.status ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <User size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Client</h3>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>
            {carePlan.client?.firstName} {carePlan.client?.lastName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {carePlan.client?.phone}
          </div>
        </div>

        <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <User size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Primary Staff</h3>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>
            {carePlan.staff ? `${carePlan.staff.firstName} ${carePlan.staff.lastName}` : 'Not Assigned'}
          </div>
          {carePlan.staff && (
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {carePlan.staff.role}
            </div>
          )}
        </div>

        <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calendar size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Duration</h3>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
            {new Date(carePlan.startDate).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {carePlan.endDate ? new Date(carePlan.endDate).toLocaleDateString() : 'Ongoing'}
          </div>
        </div>

        <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Visits</h3>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>
            {upcomingVisits.length} Upcoming
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {completedVisits.length} Completed
          </div>
        </div>
      </div>

      {/* Description */}
      {getDisplayText(carePlan.description, '') && (
        <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Description</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>{getDisplayText(carePlan.description)}</p>
        </div>
      )}

      {/* Services */}
      <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Scheduled Services</h3>
        {carePlan.services && carePlan.services.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {carePlan.services.map((service, index) => (
              <div
                key={service.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {service.service?.name}
                  </div>
                  {service.service?.duration && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Duration: {service.service.duration} minutes
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {service.frequency.replace('_', ' ')}
                  </div>
                  {getDisplayText(service.instructions, '') && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {getDisplayText(service.instructions)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
            No services scheduled for this care plan
          </div>
        )}
      </div>

      {/* Recent Visits */}
      <div style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Visits</h3>
          <Button variant="secondary" size="sm" onClick={() => router.push(`/scheduling?carePlanId=${carePlan.id}`)}>
            <Plus size={14} />
            Schedule Visit
          </Button>
        </div>
        {carePlan.visits && carePlan.visits.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {carePlan.visits.map(visit => (
              <div
                key={visit.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: getStatusColor(visit.status) + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock size={20} color={getStatusColor(visit.status)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {new Date(visit.startTime).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {new Date(visit.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(visit.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: getStatusColor(visit.status) + '20',
                  color: getStatusColor(visit.status),
                }}>
                  {visit.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
            No visits scheduled yet
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="Edit Care Plan" size="lg">
        <CarePlanForm
          isOpen={showEditModal}
          carePlan={carePlan}
          onSubmit={handleUpdate}
          onClose={handleCloseEditModal}
          clients={clients}
          staff={staff}
          services={services}
        />
      </Modal>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    SCHEDULED: '#3B82F6',
    IN_PROGRESS: '#F59E0B',
    COMPLETED: '#16A34A',
    CANCELLED: '#9CA3AF',
    NO_SHOW: '#EF4444',
    MISSED: '#EF4444',
  };
  return colors[status] || '#6B7280';
}
