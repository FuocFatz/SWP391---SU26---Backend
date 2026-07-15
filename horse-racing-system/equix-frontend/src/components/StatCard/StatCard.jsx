import './StatCard.css';

function StatCard({ icon, label, value, trend, trendValue, color = 'default' }) {
  return (
    <div className={`stat-card stat-card-${color}`} id={`stat-${label?.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-info">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
      {trend && (
        <span className={`stat-card-trend ${trend === 'up' ? 'up' : 'down'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </span>
      )}
    </div>
  );
}

export default StatCard;
