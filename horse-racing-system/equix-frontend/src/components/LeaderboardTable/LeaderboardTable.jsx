import './LeaderboardTable.css';
import { resolveAssetUrl } from '../../services/api';

const rankMedals = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderboardTable({ data = [], compact = false }) {
  return (
    <div className="leaderboard-wrapper" id="leaderboard-table">
      <div className="table-container">
        <table className="data-table leaderboard-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Ngựa</th>
              <th>Chủ ngựa</th>
              <th>Điểm</th>
              {!compact && <th>Cuộc đua</th>}
              {!compact && <th>Số trận thắng</th>}
              {!compact && <th>Ba hạng đầu</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rank = row.rank || index + 1;
              return (
                <tr key={row.horseId || rank} className={rank <= 3 ? `rank-${rank}` : ''}>
                  <td><span className={`leaderboard-rank ${rank <= 3 ? 'top' : ''}`}>{rankMedals[rank] || rank}</span></td>
                  <td>{row.horseImageUrl && <img className="leaderboard-horse-portrait" src={resolveAssetUrl(row.horseImageUrl)} alt="" />}<span className="leaderboard-horse-name">{row.horseName || 'Không rõ ngựa'}</span></td>
                  <td>{row.ownerName || 'Không rõ chủ ngựa'}</td>
                  <td><span className="leaderboard-points">{Number(row.totalPoints || 0).toLocaleString()}</span></td>
                  {!compact && <td>{row.totalRaces || 0}</td>}
                  {!compact && <td>{row.totalWins || 0}</td>}
                  {!compact && <td>{row.totalTop3 || 0}</td>}
                </tr>
              );
            })}
            {!data.length && <tr><td colSpan={compact ? 4 : 7}>Chưa có dữ liệu bảng xếp hạng chính thức.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardTable;
