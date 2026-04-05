export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseClasses = `btn btn-${variant} btn-${size}`;
  const classes = `${baseClasses} ${loading ? 'loading' : ''} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {Icon && !loading && <Icon className="btn-icon" size={18} />}
      {children}
    </button>
  );
}
