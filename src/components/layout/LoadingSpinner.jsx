export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'sm',
    md: '',
    lg: 'lg',
  };

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
      }}>
        <div className={`loading-spinner${sizeClasses[size] || ''}`} />
      </div>
    );
  }

  return (
    <div className="loading-overlay">
      <div className={`loading-spinner${sizeClasses[size] || ''}`} />
    </div>
  );
}
