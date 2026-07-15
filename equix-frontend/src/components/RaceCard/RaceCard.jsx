import { Link } from 'react-router-dom';
import { FiClock, FiUsers, FiAward } from 'react-icons/fi';
import './RaceCard.css';

const typeColors = {
  Sprint: 'sprint',
  Mile: 'mile',
  Medium: 'medium',
  Long: 'long',
};

const statusConfig = {
  'Registration Open': { className: 'status-open', label: 'Registration Open' },
  REGISTRATION_OPEN: { className: 'status-open', label: 'Registration Open' },
  'Registration Closed': { className: 'status-closed', label: 'Closed' },
  Standby: { className: 'status-standby', label: 'Standby' },
  'In Progress': { className: 'status-live', label: 'LIVE' },
  IN_PROGRESS: { className: 'status-live', label: 'LIVE' },
  Completed: { className: 'status-completed', label: 'Completed' },
  'Report Ready': { className: 'status-report', label: 'Report Ready' },
  Official: { className: 'status-official', label: 'Official' },
  OFFICIAL: { className: 'status-official', label: 'Official' },
};

function RaceCard({ race }) {
  const {
    id = 1,
    name = 'Spring Cup',
    type = 'Sprint',
    distance = race?.distanceM || 1200,
    date = race?.raceDate || '2026-07-15',
    time = race?.raceTime || '14:00',
    participants = 8,
    maxParticipants = race?.maxParticipants || 12,
    prizePool = 50000,
    status = 'Registration Open',
  } = race || {};

  const typeClass = typeColors[type] || 'sprint';
  const statusCfg = statusConfig[status] || statusConfig['Registration Open'];

  return (
    <Link to={`/races/${id}`} className="race-card" id={`race-card-${id}`}>
      <div className={`race-card-type-strip type-${typeClass}`} />

      <div className="race-card-header">
        <span className={`race-card-type-badge type-${typeClass}`}>{type}</span>
        <span className={`race-card-status ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
      </div>

      <h3 className="race-card-name">{name}</h3>

      <div className="race-card-details">
        <div className="race-card-detail">
          <FiClock />
          <span>{date} - {String(time).slice(0, 5)}</span>
        </div>
        <div className="race-card-detail">
          <FiUsers />
          <span>{participants}/{maxParticipants} pairs</span>
        </div>
        <div className="race-card-detail">
          <FiAward />
          <span>{distance}m</span>
        </div>
      </div>

      <div className="race-card-footer">
        <div className="race-card-prize">
          <span className="race-card-prize-label">Prize Pool</span>
          <span className="race-card-prize-value">
            {prizePool > 0 ? `${Number(prizePool).toLocaleString()} Points` : 'TBD'}
          </span>
        </div>
        <span className="race-card-arrow">View</span>
      </div>
    </Link>
  );
}

export default RaceCard;
