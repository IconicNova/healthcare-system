'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';
import ClientOverviewTab from './ClientOverviewTab';
import ClientMedicalTab from './ClientMedicalTab';
import ClientCarePlansTab from './ClientCarePlansTab';
import ClientVisitsTab from './ClientVisitsTab';
import ClientDocumentsTab from './ClientDocumentsTab';
import ClientFormsTab from './ClientFormsTab';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft, Edit } from 'lucide-react';
import Button from '@/components/ui/Button';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'medical', label: 'Medical' },
  { id: 'careplans', label: 'Care Plans' },
  { id: 'visits', label: 'Visits' },
  { id: 'documents', label: 'Documents' },
  { id: 'forms', label: 'Forms' },
];

const STATUS_VARIANTS = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  PENDING: 'warning',
  ON_HOLD: 'error',
  DISCHARGED: 'default',
};

export default function ClientProfilePage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [client, setClient] = useState(null);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${id}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [id]);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p>Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <h2>Client not found</h2>
        <Button onClick={() => router.push('/clients')} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} />
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/clients')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Clients
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}
            >
              {getInitials(client.firstName, client.lastName)}
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {client.firstName} {client.lastName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <StatusBadge status={client.status} variant={STATUS_VARIANTS[client.status]} />
                {client.email && <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{client.email}</span>}
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{client.phone}</span>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push(`/clients/${id}/edit`)}>
            <Edit size={16} />
            Edit Client
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div style={{ marginTop: '24px' }}>
        {activeTab === 'overview' && <ClientOverviewTab client={client} />}
        {activeTab === 'medical' && <ClientMedicalTab client={client} />}
        {activeTab === 'careplans' && <ClientCarePlansTab clientId={id} />}
        {activeTab === 'visits' && <ClientVisitsTab clientId={id} />}
        {activeTab === 'documents' && <ClientDocumentsTab clientId={id} />}
        {activeTab === 'forms' && <ClientFormsTab clientId={id} />}
      </div>
    </div>
  );
}
