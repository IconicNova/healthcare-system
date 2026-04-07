'use client';

import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
const STATUS_COLORS = {
  SCHEDULED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#16A34A',
  CANCELLED: '#9CA3AF',
  NO_SHOW: '#EF4444',
  MISSSED: '#EF4444',
};

export default function SchedulingCalendar({
  visits = [],
  view = 'dayGridMonth',
  currentDate,
  onDateChange,
  onViewChange,
  onEventClick,
  onEventDrop,
  loading = false,
}) {
  const calendarRef = useRef(null);

  const getEvents = () => {
    if (!visits || !Array.isArray(visits)) return [];
    return visits.map(visit => ({
      id: visit.id,
      title: `${visit.client?.firstName?.charAt(0) || '?'} ${visit.client?.lastName || ''}`,
      start: visit.startTime,
      end: visit.endTime,
      backgroundColor: STATUS_COLORS[visit.status] || '#6B7280',
      borderColor: STATUS_COLORS[visit.status] || '#6B7280',
      extendedProps: {
        visit: visit,
        clientName: `${visit.client?.firstName || ''} ${visit.client?.lastName || ''}`,
        staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned',
        status: visit.status,
        address: `${visit.client?.address || ''}, ${visit.client?.city || ''} ${visit.client?.state || ''}`,
      },
    }));
  };

  const handleDateClick = (info) => {
    // Handle date click - could open create visit modal
    console.log('Date clicked:', info.dateStr);
  };

  const handleEventDrop = (info) => {
    if (onEventDrop) {
      onEventDrop({
        visitId: info.event.id,
        newStart: info.event.start,
        newEnd: info.event.end,
        newAllDay: info.event.allDay,
      });
    }
  };

  const handleEventClick = (info) => {
    if (onEventClick) {
      onEventClick(info.event.extendedProps.visit);
    }
  };

  useEffect(() => {
    if (currentDate && calendarRef.current) {
      calendarRef.current.gotoDate(currentDate);
    }
  }, [currentDate]);

  return (
    <div className="scheduling-calendar" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading calendar...</p>
        </div>
      ) : (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: view === 'dayGridMonth' ? 'dayGridMonth,timeGridWeek,timeGridDay' : '',
          }}
          events={getEvents()}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          height="auto"
          contentHeight="auto"
          eventDisplay="block"
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          views={{
            dayGridMonth: {
              dayHeaderFormat: { weekday: 'short' },
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' },
            },
            timeGridDay: {
              dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' },
            },
          }}
          eventContent={(eventInfo) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>
                {eventInfo.timeText}
              </span>
              <span style={{ fontSize: '11px' }}>
                {eventInfo.event.extendedProps.clientName}
              </span>
            </div>
          )}
          height="auto"
          scrollTime="08:00:00"
          allDaySlot={false}
        />
      )}
    </div>
  );
}
