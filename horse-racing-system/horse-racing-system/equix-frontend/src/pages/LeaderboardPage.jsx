import { useEffect, useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable/LeaderboardTable';
import { api } from '../services/api';
import './LeaderboardPage.css';

const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getHorseLeaderboard()
      .then((rows) => setLeaders(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(err.message || 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  const podium = leaders.slice(0, 3).map((item, index) => ({ ...item, rank: index + 1 }));

  return (
    <div className="leaderboard-page" id="leaderboard-page">
      <div className="container">
        <div className="leaderboard-page-header">
          <h1 className="leaderboard-page-title">Leaderboard</h1>
          <p className="leaderboard-page-subtitle">Official horse performance from the current EquiX database</p>
        </div>

        {loading && <div className="page-state">Loading leaderboard...</div>}
        {error && <div className="page-state error">{error}</div>}
        {!loading && !error && (
          <>
            {podium.length > 0 && (
              <div className="podium">
                {podium.map((item) => (
                  <div key={item.horseId} className={`podium-place podium-${item.rank}`}>
                    <div className="podium-avatar" style={{ borderColor: podiumColors[item.rank - 1] }}>♞</div>
                    <span className="podium-medal">{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}</span>
                    <h3 className="podium-horse">{item.horseName}</h3>
                    <span className="podium-owner">{item.ownerName}</span>
                    <span className="podium-points">{Number(item.totalPoints || 0).toLocaleString()} pts</span>
                    <div className="podium-bar" style={{ backgroundColor: `${podiumColors[item.rank - 1]}30`, borderColor: podiumColors[item.rank - 1] }} />
                  </div>
                ))}
              </div>
            )}
            <LeaderboardTable data={leaders} />
          </>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
