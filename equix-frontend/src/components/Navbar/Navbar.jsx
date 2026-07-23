import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { FiBell, FiMenu, FiX, FiChevronDown, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { GiHorseshoe } from 'react-icons/gi';
import UserAvatar from '../UserAvatar/UserAvatar';
import './Navbar.css';

const publicLinks = [
  { path: '/', label: 'Trang chủ' },
  { path: '/races', label: 'Cuộc đua' },
  { path: '/leaderboard', label: 'Bảng xếp hạng' },
  { path: '/about', label: 'Giới thiệu' },
  { path: '/faq', label: 'Hỏi đáp' },
];

const roleLinks = {
  HORSE_OWNER: [
    ['/dashboard/horses', 'Ngựa của tôi'], ['/dashboard/jockeys', 'Thuê nài ngựa'],
    ['/dashboard/pairings', 'Ghép cặp'], ['/dashboard/races', 'Cuộc đua'], ['/dashboard/leaderboard', 'Bảng xếp hạng'],
  ],
  JOCKEY: [
    ['/dashboard/invitations', 'Lời mời'], ['/dashboard/horse', 'Ngựa của tôi'],
    ['/dashboard/races', 'Cuộc đua'], ['/dashboard/achievements', 'Thành tích'],
  ],
  REFEREE: [
    ['/dashboard/assigned-races', 'Cuộc đua được phân công'], ['/dashboard/monitor', 'Điều hành cuộc đua'], ['/dashboard/reports', 'Báo cáo'],
  ],
  SPECTATOR: [
    ['/dashboard/races', 'Xem cuộc đua'], ['/dashboard/guesses', 'Dự đoán của tôi'], ['/dashboard/rewards', 'Phần thưởng của tôi'], ['/dashboard/leaderboard', 'Bảng xếp hạng'],
  ],
  ADMIN: [
    ['/dashboard/accounts', 'Tài khoản'], ['/dashboard/tournaments', 'Giải đấu'], ['/dashboard/horses', 'Ngựa'],
    ['/dashboard/jockeys', 'Nài ngựa'], ['/dashboard/referees', 'Trọng tài'], ['/dashboard/results', 'Kết quả'], ['/dashboard/guesses', 'Dự đoán'], ['/dashboard/rewards', 'Xử lý phần thưởng'],
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
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary" id="btn-register">
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="navbar-user-wrap">
              <Link to="/notifications" className="navbar-notification-button"
                aria-label={`${unreadCount} thông báo chưa đọc`} title="Thông báo">
                <FiBell />
                {unreadCount > 0 && <span className="navbar-notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
              <div className="navbar-user">
              <button
                className="navbar-user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="btn-user-menu"
              >
                <UserAvatar user={user} className="navbar-avatar" />
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
                    <FiSettings /> Bảng điều khiển
                  </Link>
                  <Link
                    to="/profile"
                    className="navbar-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser /> Hồ sơ
                  </Link>
                  <div className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item logout"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    <FiLogOut /> Đăng xuất
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
            aria-label={mobileOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
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
              <Link to="/dashboard" className={`navbar-mobile-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Bảng điều khiển</Link>
              {(roleLinks[user?.role] || []).map(([path, label]) => <Link key={path} to={path} className={`navbar-mobile-link ${isActive(path) ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>{label}</Link>)}
              <Link to="/notifications" className={`navbar-mobile-link ${isActive('/notifications') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Thông báo {unreadCount > 0 ? `(${unreadCount})` : ''}</Link>
              <Link to="/profile" className={`navbar-mobile-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Hồ sơ</Link>
              <button className="navbar-mobile-link navbar-mobile-logout" onClick={() => { logout(); setMobileOpen(false); }}>Đăng xuất</button>
            </>
          )}
          {!isAuthenticated && (
            <div className="navbar-mobile-auth">
              <Link to="/login" className="btn btn-outline" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
