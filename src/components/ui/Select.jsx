export default function Select({
  label,
  error,
  helperText,
  required = false,
  options = [],
  className = '',
  onChange,
  ...props
}) {
  const selectClasses = `select ${error ? 'input-error' : ''} ${className}`;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <select className={selectClasses} onChange={handleChange} {...props}>
        {options.length > 0 && options[0].value === '' ? null : <option value="">Select an option</option>}
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
