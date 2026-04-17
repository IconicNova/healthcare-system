export default function Input({
  label,
  error,
  helperText,
  required = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const inputClasses = `input ${error ? 'input-error' : ''} ${className}`;

  return (
    <div className="form-group">
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            color: 'var(--color-text-muted)',
            zIndex: 1,
          }}>
            <Icon size={18} />
          </div>
        )}
        <input
          className={inputClasses}
          style={Icon ? { paddingLeft: '40px' } : {}}
          {...props}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && <p className="form-helper">{helperText}</p>}
    </div>
  );
}
