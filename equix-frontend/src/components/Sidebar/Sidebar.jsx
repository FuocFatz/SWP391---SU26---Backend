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
  OWNER: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/dashboard/horses', icon: <GiHorseHead />, label: 'My Horses' },
    { path: '/dashboard/jockeys', icon: <GiHorseshoe />, label: 'Hire Jockey' },
    { path: '/dashboard/pairings', icon: <FiUsers />, label: 'Pairings' },
    { path: '/dashboard/races', icon: <FiFlag />, label: 'Races' },
    { path: '/dashboard/leaderboard', icon: <FiAward />, label: 'Leaderboard' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  JOCKEY: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/dashboard/invitations', icon: <FiMail />, label: 'Invitations' },
    { path: '/dashboard/horse', icon: <GiHorseHead />, label: 'My Horse' },
    { path: '/dashboard/races', icon: <FiFlag />, label: 'Races' },
    { path: '/dashboard/achievements', icon: <FiStar />, label: 'Achievements' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  REFEREE: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/dashboard/assigned-races', icon: <FiFlag />, label: 'Assigned Races' },
    { path: '/dashboard/monitor', icon: <FiActivity />, label: 'Race Monitor' },
    { path: '/dashboard/reports', icon: <FiFileText />, label: 'Reports' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  SPECTATOR: [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { path: '/dashboard/races', icon: <FiFlag />, label: 'Browse Races' },
    { path: '/dashboard/guesses', icon: <FiEye />, label: 'My Guesses' },
    { path: '/dashboard/leaderboard', icon: <FiAward />, label: 'Leaderboard' },
    { path: '/profile', icon: <FiUser />, label: 'Profile' },
  ],
  ADMIN: [
    { path: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
    { path: '/dashboard/accounts', icon: <FiUsers />, label: 'Accounts' },
    { path: '/dashboard/tournaments', icon: <FiFlag />, label: 'Tournaments' },
    { path: '/dashboard/horses', icon: <GiHorseHead />, label: 'Horses' },
    { path: '/dashboard/jockeys', icon: <GiHorseshoe />, label: 'Jockeys' },
    { path: '/dashboard/referees', icon: <FiShield />, label: 'Referees' },
    { path: '/dashboard/results', icon: <FiCheckCircle />, label: 'Results' },
    { path: '/dashboard/guesses', icon: <FiEye />, label: 'Guesses' },
    { path: '/profile', icon: <FiSettings />, label: 'Settings' },
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
