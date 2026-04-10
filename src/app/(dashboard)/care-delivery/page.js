'use client';

import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import CareDeliveryLayout from '@/components/care-delivery/CareDeliveryLayout';
import TasksView from '@/components/care-delivery/TasksView';
import EditVisitDialog from '@/components/care-delivery/EditVisitDialog';

export default function CareDeliveryPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [visits, setVisits] = useState([]);
  const [_staff, setStaff] = useState([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, visitsRes, staffRes] = await Promise.all([
          fetch('/api/clients?limit=100'),
          fetch('/api/visits'),
          fetch('/api/staff?limit=100'),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }
        if (visitsRes.ok) {
          const data = await visitsRes.json();
          setVisits(data);
        }
        if (staffRes.ok) {
          const data = await staffRes.json();
          setStaff(data.staff || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setShowClientSelector(false);
  };

  const handleEditVisit = (visit) => {
    setEditVisit(visit);
    setIsEditDialogOpen(true);
  };

  const handleVisitSave = (updatedVisit) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    setEditVisit(updatedVisit);
    // Refresh tasks view by re-triggering effect would happen automatically
  };

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(search) ||
      client.lastName.toLowerCase().includes(search) ||
      (client.address && client.address.toLowerCase().includes(search))
    );
  });

  const getClientVisits = (clientId) => {
    return visits.filter(v => v.clientId === clientId);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Care Delivery
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Document visits, complete tasks, and track client progress
        </p>
      </div>

      {/* Client Selector */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowClientSelector(!showClientSelector)}
            style={{
              width: '100%',
              padding: '16px 20px',
              backgroundColor: 'var(--color-white)',
              border: `1px solid ${selectedClient ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
            }}
          >
            <Users size={20} color={selectedClient ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
            {selectedClient ? (
              <>
                <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedClient.firstName} {selectedClient.lastName}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  • {getClientVisits(selectedClient.id).length} scheduled visit{getClientVisits(selectedClient.id).length !== 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)' }}>Select a client to begin</span>
            )}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{
                marginLeft: 'auto',
                color: 'var(--color-text-muted)',
                transform: showClientSelector ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showClientSelector && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              maxHeight: '400px',
              overflow: 'auto',
            }}>
              {/* Search Input */}
              <div style={{ padding: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {/* Client List */}
              {filteredClients.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontSize: '13px' }}>No clients found</p>
                </div>
              ) : (
                filteredClients.map(client => {
                  const clientVisits = getClientVisits(client.id);
                  const activeVisits = clientVisits.filter(v => v.status === 'SCHEDULED' || v.status === 'IN_PROGRESS');

                  return (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                            {client.firstName} {client.lastName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {client.address}, {client.city}
                          </div>
                        </div>
                        {activeVisits.length > 0 && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-primary-lighter)',
                            color: 'white',
                          }}>
                            {activeVisits.length} active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Care Delivery Layout */}
      {selectedClient ? (
        <CareDeliveryLayout client={selectedClient}>
          {({ activeTab }) => (
            <>
              {activeTab === 'tasks' && (
                <TasksView
                  clientId={selectedClient.id}
                  onEditVisit={handleEditVisit}
                />
              )}
              {activeTab === 'progress' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontSize: '14px' }}>Progress Notes view - Coming soon</p>
                </div>
              )}
              {activeTab === 'reports' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontSize: '14px' }}>Visit Reports view - Coming soon</p>
                </div>
              )}
              {activeTab === 'vitals' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontSize: '14px' }}>Vitals view - Coming soon</p>
                </div>
              )}
              {activeTab === 'medications' && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontSize: '14px' }}>Medications view - Coming soon</p>
                </div>
              )}
            </>
          )}
        </CareDeliveryLayout>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          backgroundColor: 'var(--color-white)',
          borderRadius: '16px',
          border: '1px dashed var(--color-border)',
        }}>
           <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Welcome to Care Delivery
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px', textAlign: 'center', maxWidth: '300px' }}>
            Select a client from the dropdown above to view their tasks and begin documentation
          </p>
        </div>
      )}

      {/* Edit Visit Dialog */}
      <EditVisitDialog
        isOpen={isEditDialogOpen}
        onClose={() => { setIsEditDialogOpen(false); setEditVisit(null); }}
        visit={editVisit}
        clients={clients}
        onSave={handleVisitSave}
      />
    </div>
  );
}
