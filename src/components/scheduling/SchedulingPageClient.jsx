'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Plus, Calendar as CalendarIcon, Clock, List } from 'lucide-react';

import SchedulingCalendar from '@/components/scheduling/SchedulingCalendar';
import VisitCreateForm from '@/components/scheduling/VisitCreateForm';
import VisitDetailsDialog from '@/components/scheduling/VisitDetailsDialog';
import VisitEditDialog from '@/components/scheduling/VisitEditDialog';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/useToast';
import {
  ALL_SCHEDULING_STATUSES,
  STATUS_COLORS,
  buildVisitCreateFormState,
  buildSchedulingStatusPillSections,
  buildSchedulingRange,
  buildSchedulingSearchParams,
  formatSchedulingDateParam,
  getVisitStatusLabel,
  hasEventTimingChanged,
  normalizeSchedulingViewSlug,
  normalizeVisitPayload,
  parseSchedulingDateParam,
} from '@/lib/scheduling';

const VIEW_OPTIONS = [
  { value: 'month', label: 'Month', icon: CalendarIcon },
  { value: 'week', label: 'Week', icon: Clock },
  { value: 'day', label: 'Day', icon: List },
];

function getDisplayName(record) {
  if (!record) {
    return '';
  }

  return record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim();
}

function buildSchedulingUrl(viewSlug, params) {
  const query = params.toString();
  return query ? `/scheduling/${viewSlug}?${query}` : `/scheduling/${viewSlug}`;
}

function extractFirstDetailMessage(details) {
  if (!details || typeof details !== 'object') {
    return null;
  }

  for (const value of Object.values(details)) {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }

    if (value && typeof value === 'object') {
      const nested = extractFirstDetailMessage(value);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

async function parseApiPayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  const detailMessage = extractFirstDetailMessage(payload.details);
  if (detailMessage) {
    return detailMessage;
  }

  if (payload.error === 'Time slot conflict detected' && Array.isArray(payload.conflicts)) {
    const count = payload.conflicts.length;
    return `${payload.error}. ${count} conflicting visit${count === 1 ? '' : 's'} found.`;
  }

  return payload.error || payload.message || fallbackMessage;
}

export default function SchedulingPageClient({ viewSlug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitFormInitialValues, setVisitFormInitialValues] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [updatingVisit, setUpdatingVisit] = useState(false);
  const [showMoreStatuses, setShowMoreStatuses] = useState(false);
  const moreStatusesRef = useRef(null);

  const currentView = normalizeSchedulingViewSlug(viewSlug);
  const currentDate = parseSchedulingDateParam(searchParams.get('date'));
  const currentDateParam = formatSchedulingDateParam(currentDate);
  const filters = {
    staffId: searchParams.get('staffId') || '',
    clientId: searchParams.get('clientId') || '',
    status: searchParams.get('status') || '',
    branchId: searchParams.get('branchId') || '',
  };
  const fromCarePlanId = searchParams.get('fromCarePlan') || '';
  const visibleRange = buildSchedulingRange(currentView, currentDate);
  const visibleRangeStart = visibleRange.start.toISOString();
  const visibleRangeEnd = visibleRange.end.toISOString();
  const statusPillSections = buildSchedulingStatusPillSections(statusCounts, filters.status);
  const activeSecondaryStatusLabel = statusPillSections.activeSecondaryStatus
    ? getVisitStatusLabel(statusPillSections.activeSecondaryStatus)
    : '';

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

        if (clientsRes.ok) {
          setClients((await clientsRes.json()).clients || []);
        }
        if (staffRes.ok) {
          setStaff((await staffRes.json()).staff || []);
        }
        if (servicesRes.ok) {
          setServices(await servicesRes.json());
        }
        if (branchesRes.ok) {
          setBranches((await branchesRes.json()).branches || []);
        }
        if (carePlansRes.ok) {
          setCarePlans((await carePlansRes.json()).carePlans || []);
        }
      } catch (error) {
        console.error('Error fetching scheduling reference data:', error);
        toast('error', 'Scheduling unavailable', 'Reference data could not be loaded.');
      }
    };

    fetchReferenceData();
  }, [toast]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!moreStatusesRef.current?.contains(event.target)) {
        setShowMoreStatuses(false);
      }
    };

    if (showMoreStatuses) {
      document.addEventListener('mousedown', handleDocumentClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [showMoreStatuses]);

  useEffect(() => {
    const fetchSchedulingData = async () => {
      const visitParams = new URLSearchParams({
        start: visibleRangeStart,
        end: visibleRangeEnd,
      });
      const countParams = new URLSearchParams({
        startDate: visibleRangeStart,
        endDate: visibleRangeEnd,
      });

      if (filters.staffId) {
        visitParams.set('staffId', filters.staffId);
        countParams.set('staffId', filters.staffId);
      }
      if (filters.clientId) {
        visitParams.set('clientId', filters.clientId);
        countParams.set('clientId', filters.clientId);
      }
      if (filters.status) {
        visitParams.set('status', filters.status);
        countParams.set('status', filters.status);
      }
      if (filters.branchId) {
        visitParams.set('branchId', filters.branchId);
        countParams.set('branchId', filters.branchId);
      }

      try {
        setLoading(true);
        const [visitsRes, countsRes] = await Promise.all([
          fetch(`/api/visits?${visitParams.toString()}`),
          fetch(`/api/visits/status-counts?${countParams.toString()}`),
        ]);

        if (visitsRes.ok) {
          setVisits(await visitsRes.json());
        } else {
          const payload = await parseApiPayload(visitsRes);
          toast('error', 'Visits unavailable', getApiErrorMessage(payload, 'Could not load visits.'));
        }

        if (countsRes.ok) {
          setStatusCounts(await countsRes.json());
        } else {
          const payload = await parseApiPayload(countsRes);
          toast('error', 'Status totals unavailable', getApiErrorMessage(payload, 'Could not load scheduling totals.'));
        }
      } catch (error) {
        console.error('Error fetching scheduling data:', error);
        toast('error', 'Scheduling unavailable', 'Could not refresh the calendar data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedulingData();
  }, [
    currentView,
    currentDateParam,
    filters.staffId,
    filters.clientId,
    filters.status,
    filters.branchId,
    refreshKey,
    toast,
    visibleRangeEnd,
    visibleRangeStart,
  ]);

  const replaceSchedulingRoute = (nextView, nextDate, nextFilters) => {
    const normalizedView = normalizeSchedulingViewSlug(nextView);
    const nextParams = buildSchedulingSearchParams({
      date: nextDate,
      filters: nextFilters,
    });
    const nextUrl = buildSchedulingUrl(normalizedView, nextParams);
    const currentUrl = buildSchedulingUrl(
      currentView,
      buildSchedulingSearchParams({
        date: currentDate,
        filters,
      })
    );

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  };

  const refreshSchedulingData = () => {
    setRefreshKey((currentValue) => currentValue + 1);
  };

  const openCreateVisitForm = (initialValues = null) => {
    const initialValuesWithCarePlan = fromCarePlanId && !initialValues?.carePlanId
      ? { ...initialValues, carePlanId: fromCarePlanId }
      : initialValues;
    setVisitFormInitialValues(initialValuesWithCarePlan);
    setShowVisitForm(true);
  };

  const closeCreateVisitForm = () => {
    setShowVisitForm(false);
    setVisitFormInitialValues(null);
  };

  const handleFilterChange = (key, value) => {
    if (key === 'status') {
      setShowMoreStatuses(false);
    }

    replaceSchedulingRoute(currentView, currentDate, {
      ...filters,
      [key]: value,
    });
  };

  const handleCreateVisit = async (formData) => {
    setCreatingVisit(true);

    try {
      const payload = normalizeVisitPayload(formData);
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseBody = await parseApiPayload(response);

      if (!response.ok) {
        const message = getApiErrorMessage(responseBody, 'Visit could not be created.');
        toast('error', 'Visit not created', message);
        throw new Error(message);
      }

      refreshSchedulingData();

      if (responseBody?.skippedDates?.length) {
        toast(
          'warning',
          'Visit created with skips',
          `${responseBody.skippedDates.length} recurring occurrence${responseBody.skippedDates.length === 1 ? ' was' : 's were'} skipped because of conflicts.`
        );
      }

      if (responseBody?.warnings?.length) {
        toast('warning', 'Visit created with warnings', responseBody.warnings[0]);
      }

      toast('success', 'Visit created', 'The visit was added to the schedule.');

      return responseBody;
    } finally {
      setCreatingVisit(false);
    }
  };

  const handleCalendarDateClick = ({ date }) => {
    openCreateVisitForm(
      buildVisitCreateFormState({
        date,
      })
    );
  };

  const handleEventDrop = async (eventChange) => {
    if (
      !hasEventTimingChanged({
        previousStart: eventChange.oldStart,
        previousEnd: eventChange.oldEnd,
        nextStart: eventChange.newStart,
        nextEnd: eventChange.newEnd,
        previousAllDay: eventChange.oldAllDay,
        nextAllDay: eventChange.newAllDay,
      })
    ) {
      eventChange.revert?.();
      return;
    }

    const response = await fetch(`/api/visits/${eventChange.visitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime: eventChange.newStart.toISOString(),
        endTime: eventChange.newEnd.toISOString(),
      }),
    });
    const responseBody = await parseApiPayload(response);

    if (!response.ok) {
      const message = getApiErrorMessage(responseBody, 'The visit could not be moved.');
      eventChange.revert();
      toast('error', 'Visit not moved', message);
      return;
    }

    refreshSchedulingData();
    if (responseBody?.warnings?.length) {
      toast('warning', 'Visit updated with warnings', responseBody.warnings[0]);
    }
    toast('success', 'Visit updated', 'The visit timing was updated.');
  };

  const handleDeleteVisit = async () => {
    if (!selectedVisit) {
      return;
    }

    if (!window.confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      return;
    }

    const response = await fetch(`/api/visits/${selectedVisit.id}`, {
      method: 'DELETE',
    });
    const responseBody = await parseApiPayload(response);

    if (!response.ok) {
      toast('error', 'Visit not deleted', getApiErrorMessage(responseBody, 'The visit could not be deleted.'));
      return;
    }

    setSelectedVisit(null);
    refreshSchedulingData();
    toast('success', 'Visit deleted', 'The visit was removed from the schedule.');
  };

  const handleUpdateVisit = async (formData) => {
    if (!selectedVisit) {
      throw new Error('No visit selected.');
    }

    setUpdatingVisit(true);

    try {
      const payload = normalizeVisitPayload(formData);
      const response = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseBody = await parseApiPayload(response);

      if (!response.ok) {
        const message = getApiErrorMessage(responseBody, 'The visit could not be updated.');
        toast('error', 'Visit not updated', message);
        throw new Error(message);
      }

      refreshSchedulingData();
      setSelectedVisit(responseBody);
      if (responseBody?.warnings?.length) {
        toast('warning', 'Visit updated with warnings', responseBody.warnings[0]);
      }
      toast('success', 'Visit updated', 'The visit details were saved.');
      return responseBody;
    } finally {
      setUpdatingVisit(false);
    }
  };

  const staffOptions = [
    { value: '', label: 'All Staff' },
    ...staff.map((member) => ({ value: member.id, label: getDisplayName(member) })),
  ];

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map((client) => ({ value: client.id, label: getDisplayName(client) })),
  ];

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...ALL_SCHEDULING_STATUSES.map((status) => ({
      value: status,
      label: getVisitStatusLabel(status),
    })),
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Scheduling
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage and schedule client visits
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => replaceSchedulingRoute(option.value, currentDate, filters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: currentView === option.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: currentView === option.value ? 'var(--color-primary)' : 'white',
                color: currentView === option.value ? 'white' : 'var(--color-text)',
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
          onClick={() => openCreateVisitForm()}
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {statusPillSections.coreStatuses.map(({ status, count, isActive }) => (
          <button
            key={status}
            onClick={() => handleFilterChange('status', filters.status === status ? '' : status)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: isActive ? `2px solid ${STATUS_COLORS[status] || '#6B7280'}` : '1px solid transparent',
              backgroundColor: `${STATUS_COLORS[status] || '#6B7280'}15`,
              color: STATUS_COLORS[status] || '#6B7280',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[status] || '#6B7280' }} />
            {getVisitStatusLabel(status)}: {count}
          </button>
        ))}

        {statusPillSections.hasSecondaryStatuses && (
          <div ref={moreStatusesRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMoreStatuses((currentValue) => !currentValue)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: statusPillSections.activeSecondaryStatus
                  ? `2px solid ${STATUS_COLORS[statusPillSections.activeSecondaryStatus] || '#6B7280'}`
                  : '1px solid var(--color-border)',
                backgroundColor: statusPillSections.activeSecondaryStatus
                  ? `${STATUS_COLORS[statusPillSections.activeSecondaryStatus] || '#6B7280'}15`
                  : 'white',
                color: statusPillSections.activeSecondaryStatus
                  ? STATUS_COLORS[statusPillSections.activeSecondaryStatus] || '#6B7280'
                  : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {activeSecondaryStatusLabel ? `More: ${activeSecondaryStatusLabel}` : 'More'}
              <ChevronDown size={14} />
            </button>

            {showMoreStatuses && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '200px',
                  padding: '8px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 20,
                }}
              >
                {statusPillSections.secondaryStatuses.length > 0 ? (
                  statusPillSections.secondaryStatuses.map(({ status, count, isActive }) => (
                    <button
                      key={status}
                      onClick={() => handleFilterChange('status', isActive ? '' : status)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: isActive ? `${STATUS_COLORS[status] || '#6B7280'}15` : 'transparent',
                        color: isActive ? STATUS_COLORS[status] || '#6B7280' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: STATUS_COLORS[status] || '#6B7280',
                          }}
                        />
                        {getVisitStatusLabel(status)}
                      </span>
                      <span>{count}</span>
                    </button>
                  ))
                ) : (
                  <p style={{ margin: 0, padding: '10px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    No secondary statuses in this view.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '40px' }}>Filters:</span>
        <Select
          inline
          value={filters.staffId}
          onChange={(event) => handleFilterChange('staffId', event.target.value)}
          options={staffOptions}
          style={{ width: '180px' }}
        />
        <Select
          inline
          value={filters.clientId}
          onChange={(event) => handleFilterChange('clientId', event.target.value)}
          options={clientOptions}
          style={{ width: '180px' }}
        />
        <Select
          inline
          value={filters.branchId}
          onChange={(event) => handleFilterChange('branchId', event.target.value)}
          options={branchOptions}
          style={{ width: '160px' }}
        />
        <Select
          inline
          value={filters.status}
          onChange={(event) => handleFilterChange('status', event.target.value)}
          options={statusOptions}
          style={{ width: '150px' }}
        />
        {(filters.staffId || filters.clientId || filters.branchId || filters.status) && (
          <button
            onClick={() => replaceSchedulingRoute(currentView, currentDate, {
              staffId: '',
              clientId: '',
              status: '',
              branchId: '',
            })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
              padding: '0 16px',
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

      <SchedulingCalendar
        visits={visits}
        viewSlug={currentView}
        currentDate={currentDate}
        onCalendarStateChange={({ view, date }) => replaceSchedulingRoute(view, date, filters)}
        onDateClick={handleCalendarDateClick}
        onEventClick={setSelectedVisit}
        onEventDrop={handleEventDrop}
        loading={loading}
      />

      <VisitCreateForm
        isOpen={showVisitForm}
        onClose={closeCreateVisitForm}
        onSubmit={handleCreateVisit}
        initialValues={visitFormInitialValues}
        clients={clients}
        staff={staff}
        services={services}
        branches={branches}
        carePlans={carePlans}
        loading={creatingVisit}
      />

      {selectedVisit && !showEditForm && (
        <VisitDetailsDialog
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onEdit={() => setShowEditForm(true)}
          onDelete={handleDeleteVisit}
        />
      )}

      <VisitEditDialog
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedVisit(null);
        }}
        onSubmit={handleUpdateVisit}
        visit={selectedVisit}
        clients={clients}
        staff={staff}
        services={services}
        branches={branches}
        carePlans={carePlans}
        loading={updatingVisit}
      />
    </div>
  );
}
