'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityGrid({ staffId }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/availability`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [staffId]);

  const handleToggleAvailability = (dayOfWeek) => {
    setAvailability(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, isAvailable: !day.isAvailable }
          : day
      )
    );
    setSaved(false);
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setAvailability(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, [field]: value }
          : day
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability: availability.map(a => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isAvailable: a.isAvailable,
          })),
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalHours = () => {
    return availability.reduce((total, day) => {
      if (!day.isAvailable) return total;
      const [startHour, startMin] = day.startTime.split(':').map(Number);
      const [endHour, endMin] = day.endTime.split(':').map(Number);
      const start = startHour + startMin / 60;
      const end = endHour + endMin / 60;
      return total + (end - start);
    }, 0);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Weekly Availability</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: saved ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
            {saved ? 'Saved!' : ''}
          </span>
          <Button onClick={handleSave} loading={saving}>
            <Save size={14} /> Save Availability
          </Button>
        </div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Available Hours per Week:</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>{calculateTotalHours().toFixed(1)} hours</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Day</th>
                  <th style={{ width: '120px' }}>Available</th>
                  <th style={{ width: '140px' }}>Start Time</th>
                  <th style={{ width: '140px' }}>End Time</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((day) => (
                  <tr key={day.dayOfWeek} style={{ backgroundColor: day.isAvailable ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                    <td style={{ fontSize: '14px', fontWeight: 500 }}>{DAYS[day.dayOfWeek]}</td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={day.isAvailable}
                          onChange={() => handleToggleAvailability(day.dayOfWeek)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-success)' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>Available</span>
                      </label>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                        disabled={!day.isAvailable}
                        className="input"
                        style={{ width: '120px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                        disabled={!day.isAvailable}
                        className="input"
                        style={{ width: '120px', fontSize: '13px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
