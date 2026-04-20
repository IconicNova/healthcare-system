'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormFieldRenderer({ field, value, onChange, error }) {
  const [isFocused, setIsFocused] = useState(false);

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'password':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={field.placeholder}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
            }}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
            }}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
            }}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={field.required}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            <option value="">Select {field.label}</option>
            {(field.options || []).map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => onChange(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--color-primary)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(field.options || []).map((option, index) => (
              <label key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
            }}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: error ? '12px' : 0 }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--color-text)',
        marginBottom: '8px',
      }}>
        {field.label}
        {field.required && (
          <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
        )}
      </label>
      {renderField()}
      {error && (
        <div style={{
          fontSize: '12px',
          color: 'var(--color-error)',
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </div>
      )}
      {field.helperText && !error && (
        <div style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          marginTop: '6px',
        }}>
          {field.helperText}
        </div>
      )}
    </div>
  );
}
