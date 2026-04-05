export default function KPICard({ icon: Icon, title, value, change, changeType = 'neutral' }) {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-error',
    neutral: 'text-secondary',
  };

  return (
    <div className="card card-hover" style={{ transition: 'box-shadow 0.2s ease' }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {Icon && (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-primary-lighter)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color="white" />
              </div>
            )}
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {title}
              </p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0 0' }}>
                {value}
              </h3>
            </div>
          </div>
          {change !== undefined && (
            <div style={{ textAlign: 'right' }}>
              <p className={`text-sm ${changeColors[changeType]}`} style={{ margin: 0 }}>
                {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                vs last month
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
