export default function Select({
  label,
  error,
  helperText,
  required = false,
  options = [],
  className = '',
  inline = false,
  onChange,
  value,
  defaultValue,
  disabled = false,
  name,
  id,
  ...restProps
}) {
  const selectClasses = `select ${error ? 'input-error' : ''} ${className}`;
  const wrapperClass = inline ? '' : 'form-group';

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  };

  const selectProps = {
    value,
    defaultValue,
    disabled,
    name,
    id,
    ...restProps,
  };

  return (
    <div className={wrapperClass}>
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <select className={selectClasses} onChange={handleChange} {...selectProps}>
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
