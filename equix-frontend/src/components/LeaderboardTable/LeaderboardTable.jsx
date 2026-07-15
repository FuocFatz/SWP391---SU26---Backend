import './LeaderboardTable.css';

const rankMedals = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderboardTable({ data = [], compact = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded shadow-sm border border-gray-100">
        <p>No leaderboard data available.</p>
      </div>
    );
  }

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
              {!compact && <th>Wins</th>}
              {!compact && <th>Top 3</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rank = index + 1;
              return (
                <tr key={row.horseId || index} className={rank <= 3 ? `rank-${rank}` : ''}>
                  <td>
                    <span className={`leaderboard-rank ${rank <= 3 ? 'top' : ''}`}>
                      {rankMedals[rank] || rank}
                    </span>
                  </td>
                  <td>
                    <span className="leaderboard-horse-name">{row.horseName || row.horse}</span>
                  </td>
                  <td>{row.ownerName || row.owner || 'N/A'}</td>
                  <td>
                    <span className="leaderboard-points">{(row.totalPoints || row.points || 0).toLocaleString()}</span>
                  </td>
                  {!compact && <td>{row.totalWins || row.wins || 0}</td>}
                  {!compact && <td>{row.totalTop3 || row.thirds || 0}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardTable;
