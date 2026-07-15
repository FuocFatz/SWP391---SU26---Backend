import { useState, useEffect } from 'react';
import LeaderboardTable from '../components/LeaderboardTable/LeaderboardTable';
import { api } from '../services/api';
import './LeaderboardPage.css';

const PODIUM_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function LeaderboardPage() {
  const [period, setPeriod] = useState('all');
  const [raceType, setRaceType] = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await api.getHorseLeaderboard();
        setLeaderboard(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period, raceType]); // Re-fetch if backend supports filtering, otherwise it's just mock filtering for now, but we removed mock data so we just re-fetch.

  // Extract top 3 for the podium
  const top3 = leaderboard.slice(0, 3).map((item, index) => {
    const rank = index + 1;
    return {
      rank,
      horse: item.horseName || 'Unknown Horse',
      owner: item.ownerName || 'Unknown Owner',
      points: item.totalPoints || 0,
      color: PODIUM_COLORS[rank],
    };
  });

  // Reorder for display: 2nd, 1st, 3rd
  const podiumDisplay = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="leaderboard-page" id="leaderboard-page">
      <div className="container">
        <div className="leaderboard-page-header">
          <h1 className="leaderboard-page-title">Leaderboard</h1>
          <p className="leaderboard-page-subtitle">
            Top performing horses and their owners across all competitions
          </p>
        </div>

        {/* Podium */}
        {!loading && podiumDisplay.length > 0 && (
          <div className="podium">
            {podiumDisplay.map((item) => (
              <div key={item.rank} className={`podium-place podium-${item.rank}`}>
                <div className="podium-avatar" style={{ borderColor: item.color }}>
                  🐎
                </div>
                <span className="podium-medal">
                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                </span>
                <h3 className="podium-horse">{item.horse}</h3>
                <span className="podium-owner">{item.owner}</span>
                <span className="podium-points">{item.points.toLocaleString()} pts</span>
                <div className="podium-bar" style={{ backgroundColor: item.color + '30', borderColor: item.color }} />
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="leaderboard-filters">
          <div className="leaderboard-filter-tabs">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'season', label: 'This Season' },
              { key: 'month', label: 'This Month' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`leaderboard-tab ${period === tab.key ? 'active' : ''}`}
                onClick={() => setPeriod(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="leaderboard-filter-tabs">
            {[
              { key: 'all', label: 'All Types' },
              { key: 'sprint', label: 'Sprint' },
              { key: 'mile', label: 'Mile' },
              { key: 'medium', label: 'Medium' },
              { key: 'long', label: 'Long' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`leaderboard-tab ${raceType === tab.key ? 'active' : ''}`}
                onClick={() => setRaceType(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>
        ) : (
          <LeaderboardTable data={leaderboard} />
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
