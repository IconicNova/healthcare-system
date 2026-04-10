'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CarePlanForm from '@/components/care-plans/CarePlanForm';

export default function CarePlanEditPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [carePlan, setCarePlan] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [showEditModal, setShowEditModal] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // Small delay to allow modal to render
    setTimeout(() => setShowEditModal(true), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/care-plans/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push(`/care-plans/${params.id}`);
      }
    } catch (error) {
      console.error('Error updating care plan:', error);
      alert('Failed to update care plan');
    } finally {
      setSubmitting(false);
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

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Edit Care Plan
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Update care plan details and services
        </p>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => router.push(`/care-plans/${params.id}`)}
        title="Edit Care Plan"
        size="lg"
      >
        <CarePlanForm
          isOpen={showEditModal}
          carePlan={carePlan}
          onSubmit={handleUpdate}
          onClose={() => router.push(`/care-plans/${params.id}`)}
          clients={clients}
          staff={staff}
          services={services}
          loading={submitting}
        />
      </Modal>
    </div>
  );
}
