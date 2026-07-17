import { Link } from 'react-router-dom';
import { FiClock, FiUsers, FiAward } from 'react-icons/fi';
import './RaceCard.css';

const statusConfig = {
  DRAFT: { className: 'status-closed', label: 'Draft' },
  REGISTRATION_OPEN: { className: 'status-open', label: 'Registration Open' },
  REGISTRATION_CLOSED: { className: 'status-closed', label: 'Registration Closed' },
  STANDBY: { className: 'status-standby', label: 'Standby' },
  IN_PROGRESS: { className: 'status-live', label: 'Live' },
  COMPLETED: { className: 'status-completed', label: 'Completed' },
  REPORT_READY: { className: 'status-report', label: 'Report Ready' },
  OFFICIAL: { className: 'status-official', label: 'Official' },
  CANCELLED: { className: 'status-closed', label: 'Cancelled' },
};

function RaceCard({ race }) {
  if (!race?.id) return null;
  const type = String(race.type || 'Race').toUpperCase();
  const typeClass = ['SPRINT', 'MILE', 'MEDIUM', 'LONG'].includes(type) ? type.toLowerCase() : 'sprint';
  const status = String(race.status || 'DRAFT').toUpperCase().replaceAll(' ', '_');
  const statusCfg = statusConfig[status] || { className: 'status-closed', label: status.replaceAll('_', ' ') };

  return (
    <Link to={`/races/${race.id}`} className="race-card" id={`race-card-${race.id}`}>
      <div className={`race-card-type-strip type-${typeClass}`} />
      <div className="race-card-header">
        <span className={`race-card-type-badge type-${typeClass}`}>{type}</span>
        <span className={`race-card-status ${statusCfg.className}`}>{statusCfg.label}</span>
      </div>
      <h3 className="race-card-name">{race.name || `Race #${race.id}`}</h3>
      <div className="race-card-details">
        <div className="race-card-detail"><FiClock /><span>{race.raceDate || 'Date TBD'} - {race.raceTime ? String(race.raceTime).slice(0, 5) : 'Time TBD'}</span></div>
        <div className="race-card-detail"><FiUsers /><span>Up to {race.maxParticipants || 18} pairs</span></div>
        <div className="race-card-detail"><FiAward /><span>{race.distanceM ? `${race.distanceM}m` : 'Distance TBD'}</span></div>
      </div>
      <div className="race-card-footer">
        <div className="race-card-prize">
          <span className="race-card-prize-label">Prize Pool</span>
          <span className="race-card-prize-value">{Number(race.prizePool || 0).toLocaleString()} VND</span>
        </div>
        <span className="race-card-arrow">View</span>
      </div>
    </Link>
  );
}

export default RaceCard;
