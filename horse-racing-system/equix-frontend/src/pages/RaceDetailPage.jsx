import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiUsers, FiAward, FiMapPin } from 'react-icons/fi';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import './RaceDetailPage.css';

const mockRace = {
  id: 1,
  name: 'Summer Thunder Cup',
  type: 'Sprint',
  distance: 1200,
  surface: 'Turf',
  date: '2026-07-20',
  time: '14:00',
  status: 'In Progress',
  prizePool: 75000,
  participants: [
    { id: 1, horse: 'Thunder Storm', jockey: 'Rider A', owner: 'Nguyễn A', color: '#E74C3C' },
    { id: 2, horse: 'Lightning Bolt', jockey: 'Rider B', owner: 'Trần B', color: '#3498DB' },
    { id: 3, horse: 'Golden Arrow', jockey: 'Rider C', owner: 'Lê C', color: '#F39C12' },
    { id: 4, horse: 'Silver Wind', jockey: 'Rider D', owner: 'Phạm D', color: '#2ECC71' },
    { id: 5, horse: 'Dark Phoenix', jockey: 'Rider E', owner: 'Hoàng E', color: '#9B59B6' },
    { id: 6, horse: 'Midnight Run', jockey: 'Rider F', owner: 'Vũ F', color: '#1ABC9C' },
  ],
};

function RaceDetailPage() {
  const { id } = useParams();
  const race = mockRace;

  return (
    <div className="race-detail-page" id="race-detail-page">
      <div className="container">
        <Link to="/races" className="race-detail-back">
          <FiArrowLeft /> Back to Races
        </Link>

        <div className="race-detail-header">
          <div className="race-detail-header-left">
            <span className={`race-card-type-badge type-${race.type.toLowerCase()}`}>
              {race.type}
            </span>
            <h1 className="race-detail-name">{race.name}</h1>
            <div className="race-detail-meta">
              <span><FiClock /> {race.date} · {race.time}</span>
              <span><FiMapPin /> {race.distance}m · {race.surface}</span>
              <span><FiUsers /> {race.participants.length} Participants</span>
            </div>
          </div>
          <div className="race-detail-prize-box">
            <span className="race-detail-prize-label">Prize Pool</span>
            <span className="race-detail-prize-value">${race.prizePool.toLocaleString()}</span>
            <div className="race-detail-prize-split">
              <span>🥇 60% · 🥈 30% · 🥉 10%</span>
            </div>
          </div>
        </div>

        {/* Live Race Track */}
        {race.status === 'In Progress' && (
          <div className="race-detail-live-section">
            <RaceTrack
              horses={race.participants.map(p => ({
                id: p.id,
                name: p.horse,
                jockey: p.jockey,
                color: p.color,
              }))}
              duration={67}
              isLive={true}
            />
          </div>
        )}

        {/* Participants */}
        <div className="race-detail-participants">
          <h2 className="race-detail-section-title">Participants</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Horse</th>
                  <th>Jockey</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {race.participants.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span className="race-detail-color-dot" style={{ backgroundColor: p.color }} />
                      {i + 1}
                    </td>
                    <td><span className="leaderboard-horse-name">{p.horse}</span></td>
                    <td>{p.jockey}</td>
                    <td>{p.owner}</td>
                    <td><span className="badge badge-green">Racing</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RaceDetailPage;
