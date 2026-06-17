import { useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable/LeaderboardTable';
import './LeaderboardPage.css';

const podiumData = [
  { rank: 2, horse: 'Lightning Bolt', owner: 'Trần B', points: 2180, color: '#C0C0C0' },
  { rank: 1, horse: 'Thunder Storm', owner: 'Nguyễn A', points: 2450, color: '#FFD700' },
  { rank: 3, horse: 'Golden Arrow', owner: 'Lê C', points: 1920, color: '#CD7F32' },
];

function LeaderboardPage() {
  const [period, setPeriod] = useState('all');
  const [raceType, setRaceType] = useState('all');

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
        <div className="podium">
          {podiumData.map((item) => (
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

        <LeaderboardTable />
      </div>
    </div>
  );
}

export default LeaderboardPage;
