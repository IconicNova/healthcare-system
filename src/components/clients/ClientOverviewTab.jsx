import { format } from 'date-fns';
import { Phone, Mail, MapPin, Calendar, FileText, Clock } from 'lucide-react';
import { getClientTotalVisits } from '@/lib/clients-staff-review.mjs';

export default function ClientOverviewTab({ client }) {
  const stats = [
    {
      label: 'Care Plans',
      value: client.carePlans?.length || 0,
      icon: FileText,
      color: 'var(--color-primary)',
    },
    {
      label: 'Total Visits',
      value: getClientTotalVisits(client),
      icon: Calendar,
      color: 'var(--color-success)',
    },
    {
      label: 'Medications',
      value: client.medications?.length || 0,
      icon: Clock,
      color: 'var(--color-warning)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      {/* Left Column */}
      <div>
        {/* Contact Information */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#0284c7" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Phone</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{client.phone}</div>
                </div>
              </div>
              {client.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Email</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{client.email}</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Address</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                    {client.address}<br />
                    {client.city}, {client.state} {client.zipCode}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Visits */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
              Recent Visits
            </h3>
            {client.visits?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {client.visits.slice(0, 5).map((visit) => (
                  <div
                    key={visit.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-background-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                        {visit.title || 'Scheduled Visit'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {format(visit.startTime, 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {visit.staff?.firstName} {visit.staff?.lastName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No visits recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div>
        {/* Stats Cards */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
              Quick Stats
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: `${stat.color}15`,
                  }}
                >
                  <div style={{ color: stat.color }}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
              Personal Details
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Date of Birth</div>
                <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                  {client.dateOfBirth ? format(new Date(client.dateOfBirth), 'MMM d, yyyy') : 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Gender</div>
                <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{client.gender || 'Not provided'}</div>
              </div>
              {client.insuranceType && (
                <>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Insurance Type</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{client.insuranceType}</div>
                  </div>
                  {client.insuranceId && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Insurance ID</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{client.insuranceId}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        {client.emergencyContacts?.length > 0 && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
                Emergency Contacts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {client.emergencyContacts.map((contact) => (
                  <div key={contact.id} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-background-secondary)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{contact.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{contact.relation}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '4px' }}>{contact.phone}</div>
                    {contact.email && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{contact.email}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
