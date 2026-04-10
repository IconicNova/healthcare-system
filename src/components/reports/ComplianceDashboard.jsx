'use client';

import { useEffect, useState } from 'react';
import { Shield, FileText, Calendar, MapPin } from 'lucide-react';

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    expiringCerts: true,
    overdueForms: false,
    missedVisits: false,
    gpsCompliance: false,
  });

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/compliance');
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ height: '200px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Compliance Grid */}
      <div className="compliance-grid">
        {/* Expiring Certifications */}
        <div className={`compliance-card ${expandedSections.expiringCerts ? 'expanded' : ''}`}>
          <div
            className="compliance-card-header"
            onClick={() => toggleSection('expiringCerts')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#ef4444" />
              <span className="compliance-card-title">Expiring Certifications</span>
            </div>
            <span className="compliance-card-count">
              {data?.expiringCertifications?.length || 0}
            </span>
          </div>
          <div className="compliance-card-body">
            {data?.expiringCertifications?.length > 0 ? (
              <div className="table-container">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Certification</th>
                      <th>Expires</th>
                      <th>Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expiringCertifications.map(cert => (
                      <tr key={cert.id}>
                        <td>
                          <div>{cert.staffName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{cert.staffRole}</div>
                        </td>
                        <td>{cert.certificationName}</td>
                        <td>{cert.expiryDate}</td>
                        <td>
                          <span
                            style={{
                              color: cert.daysUntilExpiry <= 7 ? '#ef4444' : '#f59e0b',
                              fontWeight: 'bold',
                            }}
                          >
                            {cert.daysUntilExpiry}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                No certifications expiring in the next 30 days
              </div>
            )}
          </div>
        </div>

        {/* Overdue Forms */}
        <div className={`compliance-card ${expandedSections.overdueForms ? 'expanded' : ''}`}>
          <div
            className="compliance-card-header"
            onClick={() => toggleSection('overdueForms')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#f59e0b" />
              <span className="compliance-card-title">Overdue Forms</span>
            </div>
            <span className="compliance-card-count">
              {data?.overdueForms?.length || 0}
            </span>
          </div>
          <div className="compliance-card-body">
            {data?.overdueForms?.length > 0 ? (
              <div className="table-container">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Form</th>
                      <th>Client</th>
                      <th>Created</th>
                      <th>Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.overdueForms.map(form => (
                      <tr key={form.id}>
                        <td>{form.formName}</td>
                        <td>{form.clientName}</td>
                        <td>{form.createdAt}</td>
                        <td>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            {form.daysOverdue}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                No overdue forms
              </div>
            )}
          </div>
        </div>

        {/* Missed Visits */}
        <div className={`compliance-card ${expandedSections.missedVisits ? 'expanded' : ''}`}>
          <div
            className="compliance-card-header"
            onClick={() => toggleSection('missedVisits')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#ef4444" />
              <span className="compliance-card-title">Missed Visits (This Month)</span>
            </div>
            <span className="compliance-card-count">
              {data?.missedVisits?.length || 0}
            </span>
          </div>
          <div className="compliance-card-body">
            {data?.missedVisits?.length > 0 ? (
              <div className="table-container">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Staff</th>
                      <th>Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.missedVisits.map(visit => (
                      <tr key={visit.id}>
                        <td>{visit.clientName}</td>
                        <td>{visit.staffName}</td>
                        <td>
                          <div>{visit.scheduledDate}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {visit.scheduledTime}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                No missed visits this month
              </div>
            )}
          </div>
        </div>

        {/* GPS Compliance */}
        <div className={`compliance-card ${expandedSections.gpsCompliance ? 'expanded' : ''}`}>
          <div
            className="compliance-card-header"
            onClick={() => toggleSection('gpsCompliance')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#10b981" />
              <span className="compliance-card-title">GPS Compliance Rate</span>
            </div>
            <span className="compliance-card-count" style={{ backgroundColor: '#10b981' }}>
              {data?.gpsCompliance?.rate || 0}%
            </span>
          </div>
          <div className="compliance-card-body">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>
                {data?.gpsCompliance?.rate || 0}%
              </div>
              <div style={{ color: '#64748b', marginBottom: '16px' }}>
                {data?.gpsCompliance?.verified || 0} of {data?.gpsCompliance?.total || 0} visits verified this month
              </div>
              <div className="progress-bar" style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${data?.gpsCompliance?.rate || 0}%`,
                    height: '100%',
                    background: '#10b981',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EVV Map Placeholder */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">EVV Map View</h3>
        </div>
        <div className="card-body">
          <div className="compliance-map-placeholder">
            <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>
              GPS map visualization requires Google Maps API key
            </p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Configure API key in Settings to enable map view
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
