import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiFlag, FiAward, FiUsers, FiSettings,
  FiUser, FiMail, FiEye, FiStar, FiGrid,
  FiFileText, FiCheckCircle, FiShield, FiActivity
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import './Sidebar.css';

const menuConfig = {
  HORSE_OWNER: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/my-horses', icon: <GiHorseHead />, label: 'My Horses' },
    { path: '/browse-races', icon: <FiFlag />, label: 'Races' },
    { path: '/pairing-contracts', icon: <FiUsers />, label: 'Pairings' },
    { path: '/notifications', icon: <FiMail />, label: 'Notifications' },
    { path: '/rewards', icon: <FiAward />, label: 'Rewards' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  JOCKEY: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/pairing-contracts', icon: <FiUsers />, label: 'Pairings' },
    { path: '/browse-races', icon: <FiFlag />, label: 'Browse Races' },
    { path: '/achievements', icon: <FiStar />, label: 'Achievements' },
    { path: '/notifications', icon: <FiMail />, label: 'Notifications' },
    { path: '/rewards', icon: <FiAward />, label: 'Rewards' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  REFEREE: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/browse-races', icon: <FiFlag />, label: 'Browse Races' },
    { path: '/notifications', icon: <FiMail />, label: 'Notifications' },
    { path: '/rewards', icon: <FiAward />, label: 'Rewards' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  SPECTATOR: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/browse-races', icon: <FiFlag />, label: 'Browse Races' },
    { path: '/notifications', icon: <FiMail />, label: 'Notifications' },
    { path: '/rewards', icon: <FiAward />, label: 'Rewards' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  ADMIN: [
    { path: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
    { path: '/users-management', icon: <FiUsers />, label: 'Users' },
    { path: '/browse-races', icon: <FiFlag />, label: 'Browse Races' },
    { path: '/pairing-contracts', icon: <FiUsers />, label: 'Pairings' },
    { path: '/achievements', icon: <FiStar />, label: 'Achievements' },
    { path: '/system-settings', icon: <FiSettings />, label: 'Settings' },
    { path: '/audit-logs', icon: <FiFileText />, label: 'Audit Logs' },
    { path: '/notifications', icon: <FiMail />, label: 'Notifications' },
    { path: '/rewards', icon: <FiAward />, label: 'Rewards' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
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
        <div className="sidebar-avatar">
          {user.name.charAt(0)}
        </div>
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
