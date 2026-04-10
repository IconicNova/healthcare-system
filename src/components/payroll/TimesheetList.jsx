'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Select from '@/components/ui/Select';
import { Eye, Calendar as CalendarIcon } from 'lucide-react';
import { formatDate, hasRoleAccess } from '@/lib/utils';
import { useSession } from '@/lib/auth';

const COLUMNS = [
  { key: 'staffName', label: 'Staff', sortable: true, width: '200px' },
  { key: 'employeeId', label: 'Employee ID', sortable: true, width: '120px' },
  { key: 'weekPeriod', label: 'Week Period', sortable: true, width: '180px' },
  { key: 'totalHours', label: 'Total Hours', sortable: true, width: '100px' },
  { key: 'status', label: 'Status', sortable: true, width: '100px' },
  { key: 'actions', label: '', sortable: false, width: '80px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PAID', label: 'Paid' },
];

const STATUS_VARIANTS = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  APPROVED: 'success',
  REJECTED: 'error',
  PAID: 'success',
};

export default function TimesheetList({ onTimesheetClick }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const canViewAll = hasRoleAccess(session?.user?.role, ['ADMIN', 'MANAGER', 'SUPERVISOR']);

  useEffect(() => {
    if (canViewAll) {
      fetchStaff();
    }
  }, [canViewAll]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, statusFilter, staffFilter, dateFilter]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff?limit=100');
      if (response.ok) {
        const data = await response.json();
        setStaffOptions([
          { value: '', label: 'All Staff' },
          ...data.staff.map(s => ({
            value: s.id,
            label: `${s.firstName} ${s.lastName}`,
          })),
        ]);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (staffFilter) params.append('staffId', staffFilter);
      if (dateFilter) params.append('startDate', dateFilter);

      const response = await fetch(`/api/payroll/timesheets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data.timesheets);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCell = (timesheet, key) => {
    if (key === 'staffName') {
      return (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
            {timesheet.staffName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {timesheet.employeeId || 'N/A'}
          </div>
        </div>
      );
    }

    if (key === 'employeeId') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {timesheet.employeeId || 'N/A'}
        </div>
      );
    }

    if (key === 'weekPeriod') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={12} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
            {formatDate(timesheet.startDate)} - {formatDate(timesheet.endDate)}
          </span>
        </div>
      );
    }

    if (key === 'totalHours') {
      const hours = timesheet.totalHours || 0;
      const overtime = hours > 40 ? hours - 40 : 0;
      return (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
            {hours.toFixed(2)} hrs
          </div>
          {overtime > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
              +{overtime.toFixed(2)} OT
            </div>
          )}
        </div>
      );
    }

    if (key === 'status') {
      return <StatusBadge status={timesheet.status} variant={STATUS_VARIANTS[timesheet.status]} />;
    }

    if (key === 'actions') {
      return (
        <button
          onClick={() => onTimesheetClick(timesheet)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--color-primary-lighter)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
          title="View Timesheet"
        >
          <Eye size={14} />
        </button>
      );
    }

    return timesheet[key];
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="input"
          style={{ width: '160px' }}
          placeholder="Week Start"
        />
        {canViewAll && (
          <>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              options={STATUS_OPTIONS}
              style={{ width: '150px' }}
            />
            {!loadingStaff && (
              <Select
                value={staffFilter}
                onChange={(value) => {
                  setStaffFilter(value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                options={staffOptions}
                style={{ width: '200px' }}
              />
            )}
          </>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={timesheets}
        renderCell={renderCell}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        total={pagination.total}
      />
    </div>
  );
}
