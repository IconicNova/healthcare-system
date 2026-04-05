export default function Card({
  title,
  action,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || action) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
