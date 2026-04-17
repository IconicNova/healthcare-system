'use client';

import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
const STATUS_COLORS = {
  SCHEDULED: '#3B82F6',
  VACANT: '#8B5CF6',
  OFFERED: '#6366F1',
  IN_PROGRESS: '#F59E0B',
  CLOCKED_IN: '#0EA5E9',
  COMPLETED: '#16A34A',
  APPROVED: '#059669',
  CANCELLED: '#9CA3AF',
  ON_HOLD: '#D97706',
  NO_SHOW: '#EF4444',
  MISSED: '#DC2626',
  LATE: '#EA580C',
};

export default function SchedulingCalendar({
  visits = [],
  view = 'dayGridMonth',
  currentDate,
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
    const api = calendarRef.current?.getApi();
    if (api && currentDate) {
      api.gotoDate(currentDate);
    }
  }, [currentDate]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api && view) {
      api.changeView(view);
    }
  }, [view]);

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
            right: '',
          }}
          events={getEvents()}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          eventMargin={0}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          scrollTime="08:00:00"
          height="auto"
          contentHeight="auto"
          eventDisplay="block"
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          slotLabelFormat={[
            { hour: 'numeric', minute: '2-digit', hour12: true },
          ]}
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
          eventContent={(eventInfo) => {
            // Format time to show full time (e.g., "9:00 AM" instead of "9a")
            const formatTime = (date) => {
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours % 12 || 12;
              const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
              return `${displayHours}:${displayMinutes} ${ampm}`;
            };

            const startTime = eventInfo.event.start ? formatTime(eventInfo.event.start) : '';
            const endTime = eventInfo.event.end ? formatTime(eventInfo.event.end) : '';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                  {startTime}{endTime ? ` - ${endTime}` : ''}
                </span>
                <span style={{ fontSize: '11px' }}>
                  {eventInfo.event.extendedProps.clientName}
                </span>
              </div>
            );
          }}
          allDaySlot={false}
        />
      )}
    </div>
  );
}
