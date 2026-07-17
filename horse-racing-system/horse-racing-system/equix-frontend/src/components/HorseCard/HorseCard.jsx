import './HorseCard.css';

const statusStyles = {
  Available: 'badge-green',
  Training: 'badge-yellow',
  Paired: 'badge-neutral',
  Registered: 'badge-red',
  Unavailable: 'badge-neutral',
};

const positionEmojis = {
  Front: '🏃',
  Pace: '⚡',
  Late: '🔥',
  End: '💨',
};

function HorseCard({ horse, onClick }) {
  const {
    id = 1,
    name = 'Thunder Bolt',
    breed = 'Thoroughbred',
    age = 4,
    weight = 480,
    position = 'Front',
    status = 'Available',
    portrait = null,
  } = horse || {};

  return (
    <div className="horse-card" id={`horse-card-${id}`} onClick={onClick}>
      <div className="horse-card-portrait">
        {portrait ? (
          <img src={portrait} alt={name} className="horse-card-img" />
        ) : (
          <div className="horse-card-placeholder">
            <span>🐎</span>
          </div>
        )}
        <span className={`horse-card-status badge ${statusStyles[status] || 'badge-neutral'}`}>
          {status}
        </span>
      </div>

      <div className="horse-card-body">
        <h4 className="horse-card-name">{name}</h4>
        <p className="horse-card-breed">{breed}</p>

        <div className="horse-card-stats">
          <div className="horse-card-stat">
            <span className="horse-card-stat-label">Age</span>
            <span className="horse-card-stat-value">{age}y</span>
          </div>
          <div className="horse-card-stat">
            <span className="horse-card-stat-label">Weight</span>
            <span className="horse-card-stat-value">{weight}kg</span>
          </div>
          <div className="horse-card-stat">
            <span className="horse-card-stat-label">Position</span>
            <span className="horse-card-stat-value">{positionEmojis[position]} {position}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorseCard;
