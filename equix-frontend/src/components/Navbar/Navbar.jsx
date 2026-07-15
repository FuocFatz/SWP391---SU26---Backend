import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiChevronDown, FiLogOut, FiUser, FiSettings, FiZap } from 'react-icons/fi';
import { GiHorseshoe } from 'react-icons/gi';
import { api } from '../../services/api';
import './Navbar.css';

function DemoModeBadge() {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    api.getSystemSetting('isDemoMode')
      .then((res) => {
        // API may return { key, value } or { settingValue } or plain boolean/string
        const raw = res?.value ?? res?.settingValue ?? res;
        setIsDemoMode(raw === true || raw === 'true' || raw === 1);
      })
      .catch(() => setIsDemoMode(false));
  }, []);

  if (!isDemoMode) return null;

  return (
    <div className="demo-mode-badge" id="demo-mode-badge" title="Time is compressed in Demo Mode">
      <FiZap className="demo-mode-badge-icon" />
      <span>DEMO MODE</span>
    </div>
  );
}

const publicLinks = [
  { path: '/', label: 'Home' },
  { path: '/races', label: 'Races' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/about', label: 'About' },
];

function Navbar() {
  const { user, isAuthenticated, logout, switchRole, ROLES } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [devPanelOpen, setDevPanelOpen] = useState(false);

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

        <DemoModeBadge />

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
          <div className="dev-switcher">
            <button
              className="btn btn-ghost dev-switcher-btn"
              onClick={() => setDevPanelOpen(!devPanelOpen)}
              title="Dev: Switch Role"
            >
              <FiSettings />
            </button>
            {devPanelOpen && (
              <div className="dev-switcher-panel">
                <span className="dev-switcher-label">Switch Role (Dev)</span>
                {Object.keys(ROLES).filter((role) => role !== 'GUEST').map((role) => (
                  <button
                    key={role}
                    className={`dev-switcher-role ${user?.role === role ? 'active' : ''}`}
                    onClick={() => { switchRole(role); setDevPanelOpen(false); }}
                  >
                    {role}
                  </button>
                ))}
                {isAuthenticated && (
                  <button
                    className="dev-switcher-role logout"
                    onClick={() => { logout(); setDevPanelOpen(false); }}
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>

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
            <div className="navbar-user">
              <button
                className="navbar-user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="btn-user-menu"
              >
                <div className="navbar-avatar">
                  {user.name.charAt(0)}
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
          )}

          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="btn-mobile-menu"
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
