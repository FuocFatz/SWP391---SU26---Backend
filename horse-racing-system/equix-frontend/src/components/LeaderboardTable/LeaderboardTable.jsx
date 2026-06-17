import './LeaderboardTable.css';

const defaultData = [
  { rank: 1, horse: 'Thunder Storm', owner: 'Nguyễn A', points: 2450, wins: 8, seconds: 5, thirds: 3, prize: 125000 },
  { rank: 2, horse: 'Lightning Bolt', owner: 'Trần B', points: 2180, wins: 7, seconds: 4, thirds: 5, prize: 98000 },
  { rank: 3, horse: 'Golden Arrow', owner: 'Lê C', points: 1920, wins: 6, seconds: 6, thirds: 2, prize: 87500 },
  { rank: 4, horse: 'Silver Wind', owner: 'Phạm D', points: 1750, wins: 5, seconds: 4, thirds: 4, prize: 72000 },
  { rank: 5, horse: 'Dark Phoenix', owner: 'Hoàng E', points: 1580, wins: 4, seconds: 5, thirds: 3, prize: 63000 },
];

const rankMedals = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderboardTable({ data = defaultData, compact = false }) {
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
              {!compact && <th>2nd</th>}
              {!compact && <th>3rd</th>}
              <th>Prize</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.rank} className={row.rank <= 3 ? `rank-${row.rank}` : ''}>
                <td>
                  <span className={`leaderboard-rank ${row.rank <= 3 ? 'top' : ''}`}>
                    {rankMedals[row.rank] || row.rank}
                  </span>
                </td>
                <td>
                  <span className="leaderboard-horse-name">{row.horse}</span>
                </td>
                <td>{row.owner}</td>
                <td>
                  <span className="leaderboard-points">{row.points.toLocaleString()}</span>
                </td>
                {!compact && <td>{row.wins}</td>}
                {!compact && <td>{row.seconds}</td>}
                {!compact && <td>{row.thirds}</td>}
                <td>
                  <span className="leaderboard-prize">${row.prize.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardTable;
