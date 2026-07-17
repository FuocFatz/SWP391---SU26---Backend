import './LeaderboardTable.css';

const rankMedals = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderboardTable({ data = [], compact = false }) {
  return (
    <div className="leaderboard-wrapper" id="leaderboard-table">
      <div className="table-container">
        <table className="data-table leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Horse</th>
              <th>Owner</th>
              <th>Points</th>
              {!compact && <th>Races</th>}
              {!compact && <th>Wins</th>}
              {!compact && <th>Top 3</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rank = row.rank || index + 1;
              return (
                <tr key={row.horseId || rank} className={rank <= 3 ? `rank-${rank}` : ''}>
                  <td><span className={`leaderboard-rank ${rank <= 3 ? 'top' : ''}`}>{rankMedals[rank] || rank}</span></td>
                  <td><span className="leaderboard-horse-name">{row.horseName || 'Unknown horse'}</span></td>
                  <td>{row.ownerName || 'Unknown owner'}</td>
                  <td><span className="leaderboard-points">{Number(row.totalPoints || 0).toLocaleString()}</span></td>
                  {!compact && <td>{row.totalRaces || 0}</td>}
                  {!compact && <td>{row.totalWins || 0}</td>}
                  {!compact && <td>{row.totalTop3 || 0}</td>}
                </tr>
              );
            })}
            {!data.length && <tr><td colSpan={compact ? 4 : 7}>No official leaderboard data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardTable;
