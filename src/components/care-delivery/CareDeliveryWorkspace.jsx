'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackToTop from '@/components/ui/BackToTop';
import StatusBadge from '@/components/ui/StatusBadge';
import CareDeliveryLayout from '@/components/care-delivery/CareDeliveryLayout';
import EditVisitDialog from '@/components/care-delivery/EditVisitDialog';
import FormsReviewQueue from '@/components/care-delivery/FormsReviewQueue';
import ProgressNotesTab from '@/components/care-delivery/ProgressNotesTab';
import TasksView from '@/components/care-delivery/TasksView';
import VisitReportsTab from '@/components/care-delivery/VisitReportsTab';
import VitalsTab from '@/components/care-delivery/VitalsTab';
import {
  buildCareDeliveryClientPath,
  buildCareDeliveryVisitPath,
  resolveCareDeliveryTab,
  resolveCareDeliveryVisitContext,
  resolveCareDeliveryVisitTab,
  formatInitials,
} from '@/components/care-delivery/care-delivery.helpers';

export default function CareDeliveryWorkspace({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientId } = params;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editVisit, setEditVisit] = useState(null);
  const [editVisitTab, setEditVisitTab] = useState('info');
  const closingVisitIdRef = useRef('');

  const activeTab = resolveCareDeliveryTab(searchParams.get('tab'));
  const visitContext = resolveCareDeliveryVisitContext(searchParams);
  const visitTabQuery = visitContext.visitTab;

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          setClient(await response.json());
        } else {
          setClient(null);
        }
      } catch (error) {
        console.error('Error fetching care delivery client:', error);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  useEffect(() => {
    if (!visitContext.visitId) {
      closingVisitIdRef.current = '';
      if (editVisit) {
        setEditVisit(null);
        setEditVisitTab('info');
      }
      return;
    }

    if (closingVisitIdRef.current === visitContext.visitId) {
      return;
    }

    const safeTab = resolveCareDeliveryVisitTab(visitTabQuery);
    setEditVisitTab(safeTab);

    if (editVisit?.id === visitContext.visitId) {
      return;
    }

    let cancelled = false;

    const fetchVisit = async () => {
      try {
        const response = await fetch(`/api/visits/${visitContext.visitId}`);
        if (!response.ok) {
          if (!cancelled) {
            router.replace(buildCareDeliveryClientPath(clientId), { scroll: false });
            setEditVisit(null);
            setEditVisitTab('info');
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setEditVisit(data);
        }
      } catch (error) {
        console.error('Error fetching visit for modal:', error);
        if (!cancelled) {
          router.replace(buildCareDeliveryClientPath(clientId), { scroll: false });
          setEditVisit(null);
          setEditVisitTab('info');
        }
      }
    };

    fetchVisit();

    return () => {
      cancelled = true;
    };
  }, [clientId, editVisit, router, visitContext.visitId, visitTabQuery]);

  const handleTabChange = (nextTab) => {
    router.replace(buildCareDeliveryClientPath(clientId, nextTab), { scroll: false });
  };

  const handleEditVisit = (visit) => {
    setEditVisit(visit);
    setEditVisitTab('info');
    router.replace(buildCareDeliveryVisitPath(client.id, visit.id, 'info'), { scroll: false });
  };

  const handleVisitSave = (updatedVisit) => {
    setEditVisit(updatedVisit);
  };

  const handleVisitTabChange = (nextTab) => {
    const safeTab = resolveCareDeliveryVisitTab(nextTab);
    setEditVisitTab(safeTab);

    if (editVisit?.id) {
      router.replace(buildCareDeliveryVisitPath(client.id, editVisit.id, safeTab), { scroll: false });
    }
  };

  const handleCloseVisit = () => {
    closingVisitIdRef.current = editVisit?.id || visitContext.visitId || '';
    setEditVisit(null);
    setEditVisitTab('info');
    router.replace(buildCareDeliveryClientPath(client.id), { scroll: false });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Client not found</h2>
        <Button onClick={() => router.push('/care-delivery')}>
          <ArrowLeft size={16} />
          Back to Care Delivery
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/care-delivery')}
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
          Back to Care Delivery
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* BUG-17 FIX: Show avatar if available */}
            {client.avatar ? (
              <Image
                src={client.avatar}
                alt={`${client.firstName} ${client.lastName}`}
                width={64}
                height={64}
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--color-border)',
                }}
              />
            ) : (
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
                  color: 'white',
                  border: '3px solid var(--color-border)',
                  flexShrink: 0,
                }}
              >
                {formatInitials(client)}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {client.firstName} {client.lastName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={client.status} />
                {client.phone && <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{client.phone}</span>}
                {client.email && <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{client.email}</span>}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                {[client.address, client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => router.push('/care-delivery/forms/review')}>
              <ClipboardCheck size={16} />
              Global Forms Review
            </Button>
            <Button variant="secondary" onClick={() => router.push(`/clients/${client.id}`)}>
              View Client Profile
            </Button>
          </div>
        </div>
      </div>

      <CareDeliveryLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === 'tasks' && (
          <TasksView clientId={client.id} onEditVisit={handleEditVisit} />
        )}
        {activeTab === 'forms-review' && (
          <FormsReviewQueue
            clientId={client.id}
            embedded
            returnToBase={buildCareDeliveryClientPath(client.id, 'forms-review')}
          />
        )}
        {activeTab === 'progress' && <ProgressNotesTab clientId={client.id} />}
        {activeTab === 'reports' && <VisitReportsTab clientId={client.id} />}
        {activeTab === 'vitals' && <VitalsTab clientId={client.id} />}
      </CareDeliveryLayout>

      <EditVisitDialog
        isOpen={Boolean(editVisit)}
        onClose={handleCloseVisit}
        visit={editVisit}
        onSave={handleVisitSave}
        initialTab={editVisitTab}
        onTabChange={handleVisitTabChange}
      />
      <BackToTop />

    </div>
  );
}
