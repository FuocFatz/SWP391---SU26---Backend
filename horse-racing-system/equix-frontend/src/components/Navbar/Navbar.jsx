import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { FiBell, FiMenu, FiX, FiChevronDown, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { GiHorseshoe } from 'react-icons/gi';
import './Navbar.css';

const publicLinks = [
  { path: '/', label: 'Home' },
  { path: '/races', label: 'Races' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/about', label: 'About' },
  { path: '/faq', label: 'FAQ' },
];

const roleLinks = {
  HORSE_OWNER: [
    ['/dashboard/horses', 'My Horses'], ['/dashboard/jockeys', 'Hire Jockey'],
    ['/dashboard/pairings', 'Pairings'], ['/dashboard/races', 'Races'], ['/dashboard/leaderboard', 'Leaderboard'],
  ],
  JOCKEY: [
    ['/dashboard/invitations', 'Invitations'], ['/dashboard/horse', 'My Horse'],
    ['/dashboard/races', 'Races'], ['/dashboard/achievements', 'Achievements'],
  ],
  REFEREE: [
    ['/dashboard/assigned-races', 'Assigned Races'], ['/dashboard/monitor', 'Race Monitor'], ['/dashboard/reports', 'Reports'],
  ],
  SPECTATOR: [
    ['/dashboard/races', 'Browse Races'], ['/dashboard/guesses', 'My Guesses'], ['/dashboard/leaderboard', 'Leaderboard'],
  ],
  ADMIN: [
    ['/dashboard/accounts', 'Accounts'], ['/dashboard/tournaments', 'Tournaments'], ['/dashboard/horses', 'Horses'],
    ['/dashboard/jockeys', 'Jockeys'], ['/dashboard/referees', 'Referees'], ['/dashboard/results', 'Results'], ['/dashboard/guesses', 'Guesses'],
  ],
};

function Navbar() {
  const { user, isAuthenticated, logout, unreadCount } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" id="navbar-logo">
          <GiHorseshoe className="navbar-logo-icon" />
          <span className="navbar-logo-text">Equi<span className="navbar-logo-accent">X</span></span>
        </Link>

        <ul className="navbar-links" id="navbar-links">
          {publicLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {!isAuthenticated ? (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="btn btn-ghost" id="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" id="btn-register">
                Register
              </Link>
            </div>
          ) : (
            <div className="navbar-user-wrap">
              <Link to="/notifications" className="navbar-notification-button"
                aria-label={`${unreadCount} unread notifications`} title="Notifications">
                <FiBell />
                {unreadCount > 0 && <span className="navbar-notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
              <div className="navbar-user">
              <button
                className="navbar-user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="btn-user-menu"
              >
                <div className="navbar-avatar">
                  {(user.name || user.email || 'U').charAt(0)}
                </div>
                <span className="navbar-user-name">{user.name}</span>
                <FiChevronDown className={`navbar-chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown" id="user-dropdown">
                  <div className="navbar-dropdown-header">
                    <span className="navbar-dropdown-name">{user.name}</span>
                    <span className="navbar-dropdown-role badge badge-green">{user.role}</span>
                  </div>
                  <div className="navbar-dropdown-divider" />
                  <Link
                    to="/dashboard"
                    className="navbar-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiSettings /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="navbar-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser /> Profile
                  </Link>
                  <div className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item logout"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
              </div>
            </div>
          )}

          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="btn-mobile-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile" id="mobile-menu">
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-mobile-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <div className="navbar-mobile-divider" />
              <Link to="/dashboard" className={`navbar-mobile-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              {(roleLinks[user?.role] || []).map(([path, label]) => <Link key={path} to={path} className={`navbar-mobile-link ${isActive(path) ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>{label}</Link>)}
              <Link to="/notifications" className={`navbar-mobile-link ${isActive('/notifications') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</Link>
              <Link to="/profile" className={`navbar-mobile-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Profile</Link>
              <button className="navbar-mobile-link navbar-mobile-logout" onClick={() => { logout(); setMobileOpen(false); }}>Logout</button>
            </>
          )}
          {!isAuthenticated && (
            <div className="navbar-mobile-auth">
              <Link to="/login" className="btn btn-outline" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
