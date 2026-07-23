import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiUsers, FiFlag, FiTrendingUp } from 'react-icons/fi';
import { GiHorseHead, GiTrophy } from 'react-icons/gi';
import RaceCard from '../components/RaceCard/RaceCard';
import LeaderboardTable from '../components/LeaderboardTable/LeaderboardTable';
import { getStartedDestination as resolveGetStartedDestination } from '../contexts/authRoles';
import { useAuth } from '../contexts/useAuth';
import { api } from '../services/api';
import './HomePage.css';

const steps = [
  { icon: <FiUsers />, title: 'Đăng ký', desc: 'Tạo tài khoản Chủ ngựa, Nài ngựa hoặc Khán giả' },
  { icon: <GiHorseHead />, title: 'Xây dựng chuồng ngựa', desc: 'Thêm ngựa và ghép với các nài ngựa đang sẵn sàng' },
  { icon: <FiFlag />, title: 'Tham gia cuộc đua', desc: 'Đăng ký cặp ngựa và nài ngựa đủ điều kiện vào cuộc đua đang mở' },
  { icon: <GiTrophy />, title: 'Chinh phục vinh quang', desc: 'Hoàn tất quy trình chính thức và vươn lên bảng xếp hạng' },
];

function HomePage() {
  const { isAuthenticated, sessionLoading } = useAuth();
  const [data, setData] = useState({ races: [], horses: [], horseLeaders: [], jockeyLeaders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getRaces(), api.getHorses(), api.getHorseLeaderboard(), api.getJockeyLeaderboard()])
      .then(([races, horses, horseLeaders, jockeyLeaders]) => setData({
        races: Array.isArray(races) ? races : [],
        horses: Array.isArray(horses) ? horses : [],
        horseLeaders: Array.isArray(horseLeaders) ? horseLeaders : [],
        jockeyLeaders: Array.isArray(jockeyLeaders) ? jockeyLeaders : [],
      }))
      .catch((err) => setError(err.message || 'Không thể tải dữ liệu EquiX'))
      .finally(() => setLoading(false));
  }, []);

  const liveRace = data.races.find((race) => race.status === 'IN_PROGRESS');
  const featuredRaces = useMemo(() => [...data.races]
    .sort((a, b) => `${a.raceDate || ''}${a.raceTime || ''}`.localeCompare(`${b.raceDate || ''}${b.raceTime || ''}`))
    .slice(0, 4), [data.races]);
  const officialRaces = data.races.filter((race) => race.status === 'OFFICIAL').length;
  const totalPrize = data.races.reduce((sum, race) => sum + Number(race.prizePool || 0), 0);
  const stats = [
    { icon: <GiHorseHead />, value: data.horses.length, label: 'Ngựa đã đăng ký' },
    { icon: <FiUsers />, value: data.jockeyLeaders.length, label: 'Nài ngựa được xếp hạng' },
    { icon: <FiFlag />, value: officialRaces, label: 'Cuộc đua chính thức' },
    { icon: <FiTrendingUp />, value: `${totalPrize.toLocaleString()} point`, label: 'Tổng điểm thưởng' },
  ];
  const getStartedDestination = resolveGetStartedDestination({ sessionLoading, isAuthenticated });

  return (
    <div className="home-page" id="home-page">
      <section className="hero-section" id="hero-section">
        <div className="hero-bg-effects"><div className="hero-glow hero-glow-1" /><div className="hero-glow hero-glow-2" /></div>
        <div className="container hero-content">
          <div className="hero-badge animate-fadeIn"><span className={`status-dot ${liveRace ? 'status-dot-live' : 'status-dot-active'}`} />{liveRace ? 'Đang có cuộc đua trực tiếp' : 'Hệ thống quản lý đang hoạt động'}</div>
          <h1 className="hero-title animate-fadeInUp delay-1">Trải nghiệm sự hấp dẫn của<span className="hero-title-accent"> đua ngựa</span></h1>
          <p className="hero-subtitle animate-fadeInUp delay-2">Quản lý ngựa, ghép nài ngựa, thực hiện quy trình cuộc đua và theo dõi kết quả chính thức trong EquiX.</p>
          <div className="hero-actions animate-fadeInUp delay-3">
            {getStartedDestination ? (
              <Link to={getStartedDestination} className="btn btn-primary btn-lg">Bắt đầu <FiArrowRight /></Link>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" disabled aria-busy="true">
                <span className="spinner" /> Đang khôi phục phiên
              </button>
            )}
            <Link to="/races" className="btn btn-outline btn-lg"><FiPlay /> Xem cuộc đua</Link>
          </div>
          <div className="hero-stats animate-fadeInUp delay-4">
            {stats.map((stat) => <div key={stat.label} className="hero-stat"><span className="hero-stat-icon">{stat.icon}</span><span className="hero-stat-value">{stat.value}</span><span className="hero-stat-label">{stat.label}</span></div>)}
          </div>
        </div>
        <div className="hero-horse-silhouette"><span className="hero-horse-emoji">♞</span></div>
      </section>

      {liveRace && <section className="live-banner" id="live-banner"><div className="container"><div className="live-banner-content"><div className="live-banner-left"><span className="live-banner-dot status-dot status-dot-live" /><span className="live-banner-label">Cuộc đua đang diễn ra</span><span className="live-banner-name">{liveRace.name} — {liveRace.type} {liveRace.distanceM}m</span></div><Link to={`/races/${liveRace.id}`} className="btn btn-primary btn-sm">Xem trực tiếp <FiArrowRight /></Link></div></div></section>}

      <section className="section" id="featured-races">
        <div className="container">
          <h2 className="section-title">Cuộc đua nổi bật</h2>
          <p className="section-subtitle">Các cuộc đua hiện có được tải từ cơ sở dữ liệu SQL Server của EquiX</p>
          {loading && <div className="page-state">Đang tải cuộc đua...</div>}
          {error && <div className="page-state error">{error}</div>}
          {!loading && !error && <div className="races-grid">{featuredRaces.map((race) => <RaceCard key={race.id} race={race} />)}</div>}
          {!loading && !error && !featuredRaces.length && <div className="page-state">Chưa có cuộc đua nào được lên lịch.</div>}
          <div className="text-center" style={{ marginTop: 'var(--space-10)' }}><Link to="/races" className="btn btn-outline btn-lg">Xem tất cả cuộc đua <FiArrowRight /></Link></div>
        </div>
      </section>

      <section className="section how-it-works" id="how-it-works"><div className="container"><h2 className="section-title">Cách hoạt động</h2><p className="section-subtitle">Bốn bước theo vai trò, từ đăng ký đến kết quả chính thức</p><div className="steps-grid">{steps.map((step, index) => <div key={step.title} className="step-card"><div className="step-number">{index + 1}</div><div className="step-icon">{step.icon}</div><h3 className="step-title">{step.title}</h3><p className="step-desc">{step.desc}</p></div>)}</div></div></section>

      <section className="section" id="leaderboard-preview"><div className="container"><h2 className="section-title">Thành tích nổi bật</h2><p className="section-subtitle">Điểm chính thức từ các cuộc đua đã hoàn thành</p><LeaderboardTable data={data.horseLeaders.slice(0, 5)} compact /><div className="text-center" style={{ marginTop: 'var(--space-8)' }}><Link to="/leaderboard" className="btn btn-outline">Xem toàn bộ bảng xếp hạng <FiArrowRight /></Link></div></div></section>

      <section className="cta-section" id="cta-section"><div className="container"><div className="cta-card"><div className="cta-glow" /><h2 className="cta-title">Sẵn sàng đua?</h2><p className="cta-desc">{isAuthenticated ? 'Tiếp tục quy trình của vai trò từ bảng điều khiển EquiX.' : 'Tạo tài khoản và bắt đầu quy trình dành cho vai trò của bạn.'}</p><div className="cta-actions">{getStartedDestination ? <Link to={getStartedDestination} className="btn btn-primary btn-lg">{isAuthenticated ? 'Mở bảng điều khiển' : 'Tạo tài khoản'} <FiArrowRight /></Link> : <button type="button" className="btn btn-primary btn-lg" disabled aria-busy="true"><span className="spinner" /> Đang khôi phục phiên</button>}<Link to="/faq" className="btn btn-ghost btn-lg">Đọc hỏi đáp</Link></div></div></div></section>
    </div>
  );
}

export default HomePage;
