'use client';

import { useEffect, useState } from 'react';
// date-fns not needed — dates come pre-formatted from API
import { Users, ClipboardList, Pill, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClientHistory() {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [data, setData] = useState(null);
  const [expandedVisits, setExpandedVisits] = useState({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100');
      if (response.ok) {
        const jsonData = await response.json();
        setClients(jsonData.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientHistory = async (clientId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/client-history/${clientId}`);
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
        setSelectedClient(clientId);
      }
    } catch (error) {
      console.error('Error fetching client history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisitExpansion = (visitId) => {
    setExpandedVisits(prev => ({
      ...prev,
      [visitId]: !prev[visitId],
    }));
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      COMPLETED: '#10b981',
      SCHEDULED: '#3b82f6',
      MISSED: '#ef4444',
      CANCELLED: '#6b7280',
      IN_PROGRESS: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div>
      {/* Client Selector */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <label className="form-label">Select Client</label>
          <div className="searchable-select">
            <select
              className="select"
              value={selectedClient || ''}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                if (e.target.value) {
                  fetchClientHistory(e.target.value);
                }
              }}
            >
              <option value="">-- Select a Client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="dashboard-kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <Users size={32} style={{ color: '#3b82f6', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {data.summary.totalVisits}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Visits</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <ClipboardList size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {data.summary.activeCarePlans}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Active Care Plans</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <Pill size={32} style={{ color: '#f59e0b', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {data.summary.medicationsCount}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Medications</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <FileText size={32} style={{ color: '#8b5cf6', marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {data.summary.formsSubmitted}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Forms Submitted</div>
              </div>
            </div>
          </div>

          {/* Visit History Timeline */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">Visit History</h3>
            </div>
            <div className="card-body">
              {data.visitHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.visitHistory.map(visit => (
                    <div key={visit.id} className="card" style={{ borderLeft: '4px solid #1e3a5f' }}>
                      <div
                        className="card-body"
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleVisitExpansion(visit.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {visit.date} at {visit.time}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              {visit.staffName} • {visit.serviceName}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: getStatusBadgeColor(visit.status) + '20',
                                color: getStatusBadgeColor(visit.status),
                              }}
                            >
                              {visit.status}
                            </span>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                              {visit.duration === 'N/A' ? '-' : `${visit.duration} hrs`}
                            </span>
                            {expandedVisits[visit.id] ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </div>

                        {expandedVisits[visit.id] && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                            {visit.notes && (
                              <div style={{ marginBottom: '8px' }}>
                                <strong>Notes:</strong>
                                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                  {visit.notes}
                                </p>
                              </div>
                            )}
                            {visit.tasks && visit.tasks.length > 0 && (
                              <div>
                                <strong>Tasks:</strong>
                                <ul style={{ fontSize: '13px', color: '#64748b', marginLeft: '20px', marginTop: '4px' }}>
                                  {visit.tasks.map((task, idx) => (
                                    <li key={idx}>
                                      {task.completed ? '✅' : '○'} {task.title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  No visit history available
                </div>
              )}
            </div>
          </div>

          {/* Medication History */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">Medication History</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Administered By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.medicationHistory.length > 0 ? (
                    data.medicationHistory.map(med => (
                      <tr key={med.id}>
                        <td>{med.date}</td>
                        <td>{med.medication}</td>
                        <td>{med.dosage}</td>
                        <td>{med.administeredBy}</td>
                        <td>
                          <span className="badge badge-info">{med.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                        No medication history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form History */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Form History</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Form Name</th>
                    <th>Status</th>
                    <th>Submitted By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.formHistory.length > 0 ? (
                    data.formHistory.map(form => (
                      <tr key={form.id}>
                        <td>{form.date}</td>
                        <td>{form.formName}</td>
                        <td>
                          <span className="badge badge-{form.status === 'APPROVED' ? 'success' : 'gray'}">
                            {form.status}
                          </span>
                        </td>
                        <td>{form.submittedBy}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                        No form history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !data && !selectedClient && (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">Select a Client</h3>
          <p className="empty-state-description">
            Choose a client from the dropdown above to view their history
          </p>
        </div>
      )}
    </div>
  );
}
