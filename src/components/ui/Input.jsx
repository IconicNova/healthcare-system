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
          <Icon
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
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
