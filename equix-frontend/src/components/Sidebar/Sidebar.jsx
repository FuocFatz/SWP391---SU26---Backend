import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import {
  FiHome, FiFlag, FiAward, FiUsers, FiSettings,
  FiUser, FiMail, FiEye, FiStar, FiGrid,
  FiFileText, FiCheckCircle, FiShield, FiActivity, FiGift, FiBarChart2
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import UserAvatar from '../UserAvatar/UserAvatar';
import './Sidebar.css';

const menuConfig = {
  HORSE_OWNER: [
    { path: '/dashboard', icon: <FiHome />, label: 'Bảng điều khiển' },
    { path: '/dashboard/horses', icon: <GiHorseHead />, label: 'Ngựa của tôi' },
    { path: '/dashboard/jockeys', icon: <GiHorseshoe />, label: 'Thuê nài ngựa' },
    { path: '/dashboard/pairings', icon: <FiUsers />, label: 'Ghép cặp' },
    { path: '/dashboard/races', icon: <FiFlag />, label: 'Cuộc đua' },
    { path: '/dashboard/leaderboard', icon: <FiAward />, label: 'Bảng xếp hạng' },
    { path: '/profile', icon: <FiUser />, label: 'Hồ sơ' },
  ],
  JOCKEY: [
    { path: '/dashboard', icon: <FiHome />, label: 'Bảng điều khiển' },
    { path: '/dashboard/invitations', icon: <FiMail />, label: 'Lời mời' },
    { path: '/dashboard/horse', icon: <GiHorseHead />, label: 'Ngựa của tôi' },
    { path: '/dashboard/races', icon: <FiFlag />, label: 'Cuộc đua' },
    { path: '/dashboard/achievements', icon: <FiStar />, label: 'Thành tích' },
    { path: '/profile', icon: <FiUser />, label: 'Hồ sơ' },
  ],
  REFEREE: [
    { path: '/dashboard', icon: <FiHome />, label: 'Bảng điều khiển' },
    { path: '/dashboard/assigned-races', icon: <FiFlag />, label: 'Cuộc đua được phân công' },
    { path: '/dashboard/monitor', icon: <FiActivity />, label: 'Điều hành cuộc đua' },
    { path: '/dashboard/reports', icon: <FiFileText />, label: 'Báo cáo' },
    { path: '/profile', icon: <FiUser />, label: 'Hồ sơ' },
  ],
  SPECTATOR: [
    { path: '/dashboard', icon: <FiHome />, label: 'Bảng điều khiển' },
    { path: '/dashboard/races', icon: <FiFlag />, label: 'Xem cuộc đua' },
    { path: '/dashboard/guesses', icon: <FiEye />, label: 'Dự đoán của tôi' },
    { path: '/dashboard/rewards', icon: <FiGift />, label: 'Phần thưởng của tôi' },
    { path: '/dashboard/leaderboard', icon: <FiAward />, label: 'Bảng xếp hạng' },
    { path: '/profile', icon: <FiUser />, label: 'Hồ sơ' },
  ],
  ADMIN: [
    { path: '/dashboard', icon: <FiGrid />, label: 'Bảng điều khiển' },
    { path: '/dashboard/accounts', icon: <FiUsers />, label: 'Tài khoản' },
    { path: '/dashboard/tournaments', icon: <FiFlag />, label: 'Giải đấu' },
    { path: '/dashboard/horses', icon: <GiHorseHead />, label: 'Ngựa' },
    { path: '/dashboard/jockeys', icon: <GiHorseshoe />, label: 'Nài ngựa' },
    { path: '/dashboard/referees', icon: <FiShield />, label: 'Trọng tài' },
    { path: '/dashboard/results', icon: <FiCheckCircle />, label: 'Kết quả' },
    { path: '/dashboard/guesses', icon: <FiEye />, label: 'Dự đoán' },
    { path: '/dashboard/rewards', icon: <FiGift />, label: 'Xử lý phần thưởng' },
    { path: '/dashboard/analytics', icon: <FiBarChart2 />, label: 'Thống kê' },
    { path: '/profile', icon: <FiSettings />, label: 'Cài đặt' },
  ],
};

function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = menuConfig[user.role] || [];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar" id="dashboard-sidebar">
      <div className="sidebar-header">
        <UserAvatar user={user} className="sidebar-avatar" />
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user.name}</span>
          <span className="badge badge-green">{user.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {items.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
