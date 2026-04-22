'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar as CalendarIcon, Clock, List } from 'lucide-react';
import SchedulingCalendar from '@/components/scheduling/SchedulingCalendar';
import VisitForm from '@/components/scheduling/VisitForm';
import VisitDetailPopup from '@/components/scheduling/VisitDetailPopup';
import VisitEditForm from '@/components/scheduling/VisitEditForm';
import Select from '@/components/ui/Select';

const VIEW_OPTIONS = [
  { value: 'dayGridMonth', label: 'Month', icon: CalendarIcon },
  { value: 'timeGridWeek', label: 'Week', icon: Clock },
  { value: 'timeGridDay', label: 'Day', icon: List },
];

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', color: '#3B82F6' },
  VACANT: { label: 'Vacant', color: '#8B5CF6' },
  OFFERED: { label: 'Offered', color: '#6366F1' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B' },
  CLOCKED_IN: { label: 'Clocked In', color: '#0EA5E9' },
  COMPLETED: { label: 'Completed', color: '#16A34A' },
  APPROVED: { label: 'Approved', color: '#059669' },
  CANCELLED: { label: 'Cancelled', color: '#9CA3AF' },
  ON_HOLD: { label: 'On Hold', color: '#D97706' },
  NO_SHOW: { label: 'No Show', color: '#EF4444' },
  MISSED: { label: 'Missed', color: '#DC2626' },
  LATE: { label: 'Late', color: '#EA580C' },
};

export default function SchedulingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/scheduling/month');
  }, [router]);

  return null;

  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('dayGridMonth');
  const [loading, setLoading] = useState(true);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [filters, setFilters] = useState({
    staffId: '',
    clientId: '',
    status: '',
    branchId: '',
  });

  // Fetch reference data (clients, staff, services, branches, care plans) once on mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [clientsRes, staffRes, servicesRes, branchesRes, carePlansRes] = await Promise.all([
          fetch('/api/clients?limit=100'),
          fetch('/api/staff?limit=100'),
          fetch('/api/services'),
          fetch('/api/branches'),
          fetch('/api/care-plans?limit=100'),
        ]);

        if (clientsRes.ok) setClients((await clientsRes.json()).clients || []);
        if (staffRes.ok) setStaff((await staffRes.json()).staff || []);
        if (servicesRes.ok) setServices(await servicesRes.json());
        if (branchesRes.ok) setBranches((await branchesRes.json()).branches || []);
        const carePlansData = await carePlansRes.json();
        if (carePlansRes.ok) setCarePlans(carePlansData.carePlans || []);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    fetchReferenceData();
  }, []);

  // Fetch visits for current view
  useEffect(() => {
    const fetchVisits = async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const params = new URLSearchParams({
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      });

      if (filters.staffId) params.append('staffId', filters.staffId);
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.status) params.append('status', filters.status);
      if (filters.branchId) params.append('branchId', filters.branchId);

      try {
        setLoading(true);
        const response = await fetch(`/api/visits?${params}`);
        if (response.ok) {
          const data = await response.json();
          setVisits(data);
        }
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [currentDate, view, filters]);

  // Fetch status counts
  useEffect(() => {
    const fetchStatusCounts = async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      try {
        const response = await fetch(
          `/api/visits/status-counts?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
        );
        if (response.ok) {
          setStatusCounts(await response.json());
        }
      } catch (error) {
        console.error('Error fetching status counts:', error);
      }
    };

    fetchStatusCounts();
  }, [currentDate]);

  const handleCreateVisit = async (data) => {
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newVisit = await response.json();
        setVisits(prev => [...prev, newVisit]);
      }
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('Failed to create visit');
    }
  };

  const handleEventDrop = async (data) => {
    try {
      const response = await fetch(`/api/visits/${data.visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: data.newStart.toISOString(),
          endTime: data.newEnd.toISOString(),
        }),
      });

      if (response.ok) {
        const updatedVisit = await response.json();
        setVisits(prev => prev.map(v => v.id === data.visitId ? updatedVisit : v));
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      alert('Failed to update visit. Reverting...');
      // Calendar will automatically revert
    }
  };

  const handleEventClick = (visit) => {
    setSelectedVisit(visit);
  };

  const handleEditVisit = () => {
    setShowEditForm(true);
    setSelectedVisit(prev => { /* keep data but close popup via edit form taking over */ return prev; });
  };

  const handleDeleteVisit = async () => {
    if (!window.confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVisits(prev => prev.filter(v => v.id !== selectedVisit.id));
        setSelectedVisit(null);
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to delete visit');
    }
  };

  const handleUpdateVisit = async (data) => {
    try {
      const response = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedVisit = await response.json();
        setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
        setSelectedVisit(updatedVisit);
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      alert('Failed to update visit');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const staffOptions = [
    { value: '', label: 'All Staff' },
    ...staff.map(s => ({ value: s.id, label: s.fullName })),
  ];

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(c => ({ value: c.id, label: c.fullName })),
  ];

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map(b => ({ value: b.id, label: b.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label })),
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Scheduling
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage and schedule client visits
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {VIEW_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setView(option.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: view === option.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: view === option.value ? 'var(--color-primary)' : 'white',
                color: view === option.value ? 'white' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <option.icon size={14} />
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowVisitForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <Plus size={16} />
          Create Visit
        </button>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: filters.status === status ? `2px solid ${STATUS_CONFIG[status]?.color || '#6B7280'}` : '1px solid transparent',
              backgroundColor: (STATUS_CONFIG[status]?.color || '#6B7280') + '15',
              color: STATUS_CONFIG[status]?.color || '#6B7280',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_CONFIG[status]?.color || '#6B7280' }} />
            {STATUS_CONFIG[status]?.label || status}: {count}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>Filters:</span>
        <Select
          value={filters.staffId}
          onChange={(e) => handleFilterChange('staffId', e.target.value)}
          options={staffOptions}
          style={{ width: '180px' }}
        />
        <Select
          value={filters.clientId}
          onChange={(e) => handleFilterChange('clientId', e.target.value)}
          options={clientOptions}
          style={{ width: '180px' }}
        />
        <Select
          value={filters.branchId}
          onChange={(e) => handleFilterChange('branchId', e.target.value)}
          options={branchOptions}
          style={{ width: '160px' }}
        />
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          options={statusOptions}
          style={{ width: '150px' }}
        />
        {(filters.staffId || filters.clientId || filters.branchId || filters.status) && (
          <button
            onClick={() => setFilters({ staffId: '', clientId: '', status: '', branchId: '' })}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Calendar */}
      <SchedulingCalendar
        visits={visits}
        view={view}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
        loading={loading}
      />

      {/* Create Visit Modal */}
      <VisitForm
        isOpen={showVisitForm}
        onClose={() => setShowVisitForm(false)}
        onSubmit={handleCreateVisit}
        clients={clients}
        staff={staff}
        services={services}
        branches={branches}
        carePlans={carePlans}
      />

      {/* Visit Detail Popup */}
      {selectedVisit && !showEditForm && (
        <VisitDetailPopup
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onEdit={handleEditVisit}
          onDelete={handleDeleteVisit}
        />
      )}

      {/* Edit Visit Modal */}
      <VisitEditForm
        isOpen={showEditForm}
        onClose={() => { setShowEditForm(false); setSelectedVisit(null); }}
        onSubmit={handleUpdateVisit}
        visit={selectedVisit}
        clients={clients}
        staff={staff}
        services={services}
        branches={branches}
        carePlans={carePlans}
      />
    </div>
  );
}
