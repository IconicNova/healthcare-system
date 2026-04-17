'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';
import ClientOverviewTab from './ClientOverviewTab';
import ClientMedicalTab from './ClientMedicalTab';
import ClientCarePlansTab from './ClientCarePlansTab';
import ClientVisitsTab from './ClientVisitsTab';
import ClientDocumentsTab from './ClientDocumentsTab';
import ClientFormsTab from './ClientFormsTab';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft, Edit, Upload, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ClientForm from './ClientForm';

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
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [client, setClient] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
        setAvatarPreview(data.avatar || null);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setShowEditModal(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAvatarError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError('Image size must be less than 5MB');
        return;
      }
      setAvatarError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        // Auto-upload after preview is set
        handleAvatarUpload();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarPreview || !client?.id) return;
    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: avatarPreview }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }
      const result = await response.json();
      setClient(prev => ({ ...prev, avatar: result.avatar }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError(error.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!client?.id) return;
    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/avatar`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove avatar');
      }
      setAvatarPreview(null);
      setClient(prev => ({ ...prev, avatar: null }));
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const displayAvatar = avatarPreview || client?.avatar;

  const handleOpenEditModal = () => {
    router.replace(`/clients/${id}?edit=true`);
  };

  const handleCloseEditModal = () => {
    router.replace(`/clients/${id}`);
  };

  const handleEditSuccess = async () => {
    await fetchClient();
    handleCloseEditModal();
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
            <div style={{ position: 'relative' }}>
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt={`${client.firstName} ${client.lastName}`}
                  unoptimized
                  width={64}
                  height={64}
                  style={{
                    width: '64px',
                    height: '64px',
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
                  }}
                >
                  {getInitials(client.firstName, client.lastName)}
                </div>
              )}

              {/* Upload button overlay */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change photo"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                <Upload size={10} />
              </button>

              {/* Remove button */}
              {displayAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  title="Remove photo"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                    opacity: avatarUploading ? 0.5 : 1,
                    fontSize: '10px',
                  }}
                >
                  <X size={10} />
                </button>
              )}
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
              {avatarError && (
                <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0 0' }}>{avatarError}</p>
              )}
            </div>
          </div>
          <Button variant="secondary" onClick={handleOpenEditModal}>
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

      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="Edit Client" size="xl">
        <ClientForm client={client} onSuccess={handleEditSuccess} onCancel={handleCloseEditModal} />
      </Modal>
    </div>
  );
}
