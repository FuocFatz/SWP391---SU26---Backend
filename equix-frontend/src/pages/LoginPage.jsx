import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { api } from '../services/api';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import './LoginPage.css';

const QUICK_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_QUICK_LOGIN === 'true';

const QUICK_ROLES = [
  { role: 'ADMIN', label: 'Quản trị viên', icon: <FiShield /> },
  { role: 'HORSE_OWNER', label: 'Chủ ngựa', icon: <GiHorseHead /> },
  { role: 'JOCKEY', label: 'Nài ngựa', icon: <GiHorseshoe /> },
  { role: 'REFEREE', label: 'Trọng tài', icon: <FiCheckCircle /> },
  { role: 'SPECTATOR', label: 'Khán giả', icon: <FiUsers /> },
];

function LoginPage() {
  const { login, quickLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState(null);
  const [quickLoadingAccountId, setQuickLoadingAccountId] = useState(null);
  const [selectedQuickRole, setSelectedQuickRole] = useState(null);
  const [databaseAccounts, setDatabaseAccounts] = useState([]);
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'session-expired';

  const completeLogin = async (authenticate) => {
    const authenticatedUser = await authenticate();
    navigate(location.state?.from || '/dashboard', { replace: true, state: { loginRole: authenticatedUser.role } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await completeLogin(() => login({ email: email.trim(), password }));
    } catch (err) {
      setError(err.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (account) => {
    if (quickLoadingRole) return;
    setError('');
    setQuickLoadingRole(account.role);
    try {
      const accounts = await api.getQuickLoginAccounts(account.role);
      setSelectedQuickRole(account);
      setDatabaseAccounts(Array.isArray(accounts) ? accounts : []);
      if (!accounts?.length) setError(`Không có tài khoản ${account.label} đang hoạt động trong cơ sở dữ liệu.`);
    } catch (err) {
      setError(err.message || `Không thể tải danh sách tài khoản ${account.label}.`);
    } finally {
      setQuickLoadingRole(null);
    }
  };

  const handleQuickAccountLogin = async (account) => {
    if (quickLoadingAccountId) return;
    setError('');
    setQuickLoadingAccountId(account.id);
    try {
      await completeLogin(() => quickLogin(account.id));
    } catch (err) {
      setError(err.message || `Không thể đăng nhập bằng tài khoản ${account.fullName || account.email}.`);
    } finally {
      setQuickLoadingAccountId(null);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-glow" />
        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo">
            <GiHorseshoe className="auth-brand-logo-icon" />
            <span>Equi<span className="auth-brand-logo-accent">X</span></span>
          </Link>
          <h1 className="auth-brand-title">
            Chào mừng trở lại <span className="text-primary-color">đường đua</span>
          </h1>
          <p className="auth-brand-desc">
            Đăng nhập an toàn để quản lý ngựa, phân công, kết quả và dự đoán.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Đăng nhập</h2>
            <p className="auth-form-subtitle">Sử dụng tài khoản EquiX của bạn.</p>
          </div>

          {(location.state?.message || sessionExpired) && (
            <div className="auth-notice">
              {location.state?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'}
            </div>
          )}
          {error && <div className="auth-error" id="login-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Địa chỉ email</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input id="login-email" type="email" className="form-input auth-input"
                  placeholder="you@equix.com" autoComplete="email" value={email}
                  onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Mật khẩu</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input id="login-password" type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input" placeholder="Nhập mật khẩu"
                  autoComplete="current-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="auth-input-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading || Boolean(quickLoadingRole)} id="btn-login-submit">
              {loading ? <><span className="spinner" /> Đang đăng nhập...</> : <>Đăng nhập <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-switch">Bạn chưa có tài khoản? <Link to="/register" className="auth-switch-link">Tạo tài khoản</Link></p>
          <p className="auth-switch">Quên mật khẩu? <Link to="/reset-password" className="auth-switch-link">Đặt lại</Link></p>

          {QUICK_LOGIN_ENABLED && (
            <section className="auth-dev-panel" aria-labelledby="quick-login-title">
              <div className="quick-login-heading">
                <span className="auth-dev-label" id="quick-login-title">Đăng nhập nhanh</span>
                <span className="badge badge-neutral">Đăng nhập an toàn</span>
              </div>
              <div className="auth-dev-buttons">
                {QUICK_ROLES.map((account) => {
                  const isLoading = quickLoadingRole === account.role;
                  return (
                    <button key={account.role} type="button" className={`quick-login-button ${selectedQuickRole?.role === account.role ? 'selected' : ''}`}
                      onClick={() => handleQuickRole(account)} disabled={Boolean(quickLoadingRole) || Boolean(quickLoadingAccountId) || loading}
                      aria-expanded={selectedQuickRole?.role === account.role}
                      aria-label={`Hiển thị tài khoản ${account.label}`}>
                      <span className="quick-login-icon">{account.icon}</span>
                      <span>{account.label}</span>
                      {isLoading && <span className="spinner" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              {selectedQuickRole && databaseAccounts.length > 0 && (
                <div className="quick-account-panel" aria-live="polite">
                  <div className="quick-account-panel-heading">
                    <div><strong>Tài khoản {selectedQuickRole.label}</strong><span>Chọn một tài khoản đang hoạt động trên SQL Server</span></div>
                    <button type="button" onClick={() => { setSelectedQuickRole(null); setDatabaseAccounts([]); }} aria-label="Đóng danh sách tài khoản"><FiX /></button>
                  </div>
                  <div className="quick-account-list">
                    {databaseAccounts.map((account) => (
                      <button type="button" className="quick-account-item" key={account.id}
                        onClick={() => handleQuickAccountLogin(account)} disabled={Boolean(quickLoadingAccountId)}>
                        <span className="quick-account-avatar">{String(account.fullName || account.username || account.email).charAt(0).toUpperCase()}</span>
                        <span className="quick-account-identity"><strong>{account.fullName || account.username}</strong><small>{account.email}</small></span>
                        {account.role === 'SPECTATOR' && <span className="quick-account-points">{Number(account.rewardPoints || 0).toLocaleString()} point</span>}
                        {quickLoadingAccountId === account.id ? <span className="spinner" /> : <FiArrowRight />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
