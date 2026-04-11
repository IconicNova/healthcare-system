export default function KPICard({ icon: Icon, title, value, change, changeType = 'neutral' }) {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-error',
    neutral: 'text-secondary',
  };

  return (
    <div className="card card-hover kpi-card">
      <div className="card-body">
        <div className="kpi-card-inner">
          <div className="kpi-card-left">
            {Icon && (
              <div className="kpi-card-icon">
                <Icon size={24} color="white" />
              </div>
            )}
            <div className="kpi-card-text">
              <p className="kpi-card-title">{title}</p>
              <h3 className="kpi-card-value">{value}</h3>
            </div>
          </div>
          {change !== undefined && (
            <div className="kpi-card-change">
              <p className={`text-sm ${changeColors[changeType]}`} style={{ margin: 0 }}>
                {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
              </p>
              <p className="kpi-card-change-label">vs last month</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
