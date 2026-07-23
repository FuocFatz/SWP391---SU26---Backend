import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiBarChart2, FiCheckCircle, FiFlag, FiGift, FiRefreshCw, FiUsers } from 'react-icons/fi';
import StatCard from '../components/StatCard/StatCard';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { api } from '../services/api';
import { translateText } from '../utils/vietnameseLocalization';
import './DashboardPage.css';
import './AdminAnalyticsPage.css';

function readable(value) {
  const label = String(value || 'Không xác định').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
  return translateText(label);
}

function Distribution({ title, icon, data = {} }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(1, ...rows.map(([, count]) => Number(count)));
  return (
    <section className="workflow-panel analytics-distribution">
      <div className="workflow-panel-heading"><h3>{title}</h3>{icon}</div>
      <div className="analytics-bars">
        {rows.map(([label, count]) => (
          <div className="analytics-bar-row" key={label}>
            <div><span>{readable(label)}</span><strong>{Number(count).toLocaleString()}</strong></div>
            <div className="analytics-bar-track"><span style={{ width: `${Math.max(4, Number(count) / maximum * 100)}%` }} /></div>
          </div>
        ))}
        {!rows.length && <p className="workflow-muted">Chưa có dữ liệu.</p>}
      </div>
    </section>
  );
}

function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      setAnalytics(await api.getAdminAnalytics());
      setError('');
    } catch (requestError) {
      setError(translateText(requestError.message || 'Không thể tải dữ liệu thống kê.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(loadAnalytics, 0);
    return () => window.clearTimeout(timeout);
  }, [loadAnalytics]);

  const totals = analytics?.totals || {};
  const generatedAt = analytics?.generatedAt ? new Date(analytics.generatedAt).toLocaleString() : '—';

  return (
    <div className="dashboard-page admin-analytics-page">
      <div className="dash-header dash-header-row">
        <div><h1 className="dash-title">Trung tâm thống kê</h1><p className="dash-subtitle">Theo dõi tình trạng vận hành, mức độ tham gia và hiệu quả phần thưởng từ dữ liệu EquiX hiện tại.</p></div>
        <button className="btn btn-outline" onClick={loadAnalytics} disabled={loading}><FiRefreshCw /> Làm mới</button>
      </div>

      <ToastNotification message={error} type="error" onDismiss={() => setError('')} />
      {loading && !analytics ? <div className="analytics-loading"><span className="spinner spinner-lg" /> Đang tải thống kê...</div> : analytics && (
        <>
          <div className="dash-stats-grid">
            <StatCard icon={<FiUsers />} label="Người dùng đang hoạt động" value={totals.activeUsers || 0} color="green" />
            <StatCard icon={<FiFlag />} label="Cuộc đua đang hoạt động" value={totals.activeRaces || 0} color="red" />
            <StatCard icon={<FiActivity />} label="Lượt dự đoán" value={totals.predictions || 0} color="yellow" />
            <StatCard icon={<FiGift />} label="Phần thưởng đang xử lý" value={totals.openRewards || 0} />
          </div>

          <section className="analytics-kpi-strip" aria-label="Các chỉ số hiệu quả chính">
            <div><span>Tổng người dùng</span><strong>{Number(totals.users || 0).toLocaleString()}</strong></div>
            <div><span>Ngựa</span><strong>{Number(totals.horses || 0).toLocaleString()}</strong></div>
            <div><span>Lượt đăng ký</span><strong>{Number(totals.registrations || 0).toLocaleString()}</strong></div>
            <div><span>Tỷ lệ dự đoán đúng</span><strong>{totals.predictionSuccessRate || 0}%</strong></div>
            <div><span>Tổng phần thưởng</span><strong>{Number(totals.rewards || 0).toLocaleString()}</strong></div>
          </section>

          <div className="workflow-grid analytics-distribution-grid">
            <Distribution title="Người dùng theo vai trò" icon={<FiUsers />} data={analytics.usersByRole} />
            <Distribution title="Cuộc đua theo trạng thái" icon={<FiFlag />} data={analytics.racesByStatus} />
            <Distribution title="Phần thưởng theo trạng thái" icon={<FiGift />} data={analytics.rewardsByStatus} />
          </div>

          <div className="workflow-grid two analytics-bottom-grid">
            <section className="workflow-panel">
              <div className="workflow-panel-heading"><h3>Cảnh báo vận hành</h3><FiCheckCircle /></div>
              <div className="analytics-alert-list">
                {(analytics.alerts || []).map((alert) => (
                  <Link to={alert.path} className={`analytics-alert ${alert.tone}`} key={alert.label}>
                    <span>{translateText(alert.label)}</span><strong>{alert.count}</strong>
                  </Link>
                ))}
              </div>
            </section>

            <section className="workflow-panel">
              <div className="workflow-panel-heading"><h3>Ngựa dẫn đầu</h3><FiBarChart2 /></div>
              <div className="workflow-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Ngựa</th><th>Point</th><th>Trận thắng</th><th>Cuộc đua</th></tr></thead>
                  <tbody>
                    {(analytics.topHorses || []).map((horse) => <tr key={horse.horseId}><td><strong>{horse.horseName}</strong></td><td>{horse.points}</td><td>{horse.wins}</td><td>{horse.races}</td></tr>)}
                    {!analytics.topHorses?.length && <tr><td colSpan="4">Chưa có thống kê ngựa chính thức.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <p className="analytics-generated">Tính toán lần cuối: {generatedAt}</p>
        </>
      )}
    </div>
  );
}

export default AdminAnalyticsPage;
