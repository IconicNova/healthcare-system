export default function Select({
  label,
  error,
  helperText,
  required = false,
  options = [],
  className = '',
  ...props
}) {
  const selectClasses = `select ${error ? 'input-error' : ''} ${className}`;

  return (
    <div className="form-group">
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <select className={selectClasses} {...props}>
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && <p className="form-helper">{helperText}</p>}
    </div>
  );
}
