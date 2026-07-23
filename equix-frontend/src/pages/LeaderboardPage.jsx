import { useEffect, useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable/LeaderboardTable';
import { api, resolveAssetUrl } from '../services/api';
import './LeaderboardPage.css';

const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [scope, setScope] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTournaments()
      .then((rows) => setTournaments(Array.isArray(rows) ? rows : []))
      .catch(() => setTournaments([]));
  }, []);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      const request = scope === 'overall'
        ? api.getHorseLeaderboard()
        : api.getTournamentStandings(scope);
      request
        .then((rows) => { if (active) setLeaders(Array.isArray(rows) ? rows : []); })
        .catch((err) => { if (active) setError(err.message || 'Không thể tải bảng xếp hạng'); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [scope]);

  const podium = leaders.slice(0, 3).map((item, index) => ({ ...item, rank: index + 1 }));

  return (
    <div className="leaderboard-page" id="leaderboard-page">
      <div className="container">
        <div className="leaderboard-page-header">
          <h1 className="leaderboard-page-title">Bảng xếp hạng</h1>
          <p className="leaderboard-page-subtitle">Thành tích chính thức của ngựa trên toàn hệ thống hoặc trong một giải đấu</p>
        </div>

        <div className="leaderboard-scope-panel">
          <label className="form-field">
            <span className="form-field-label">Phạm vi bảng xếp hạng</span>
            <select className="form-select" value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="overall">Bảng xếp hạng tổng thể EquiX</option>
              {tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
            </select>
          </label>
          <p>{scope === 'overall'
            ? 'Bao gồm toàn bộ kết quả đua chính thức.'
            : 'Điểm giải đấu được tính theo mức 10–6–4–2–1; số trận thắng và số lần lên bục dùng để phân hạng khi bằng điểm.'}</p>
        </div>

        {loading && <div className="page-state">Đang tải bảng xếp hạng...</div>}
        {error && <div className="page-state error">{error}</div>}
        {!loading && !error && (
          <>
            {podium.length > 0 && (
              <div className="podium">
                {podium.map((item) => (
                  <div key={item.horseId} className={`podium-place podium-${item.rank}`}>
                    <div className="podium-avatar" style={{ borderColor: podiumColors[item.rank - 1] }}>{item.horseImageUrl ? <img src={resolveAssetUrl(item.horseImageUrl)} alt={`Ảnh ngựa ${item.horseName}`} /> : '♞'}</div>
                    <span className="podium-medal">{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}</span>
                    <h3 className="podium-horse">{item.horseName}</h3>
                    <span className="podium-owner">{item.ownerName}</span>
                    <span className="podium-points">{Number(item.totalPoints || 0).toLocaleString()} point</span>
                    <div className="podium-bar" style={{ backgroundColor: `${podiumColors[item.rank - 1]}30`, borderColor: podiumColors[item.rank - 1] }} />
                  </div>
                ))}
              </div>
            )}
            <LeaderboardTable data={leaders} />
            {scope !== 'overall' && leaders.length > 0 && (
              <div className="tournament-standing-summary">
                <strong>{leaders.length} ngựa được xếp hạng</strong>
                <span>Tổng điểm thưởng đã ghi nhận: {leaders.reduce((total, row) => total + Number(row.prizeMoney || 0), 0).toLocaleString()} point</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
