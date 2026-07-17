import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
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
} from 'react-icons/fi';
import './LoginPage.css';

const QUICK_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_QUICK_LOGIN === 'true';

const QUICK_ROLES = [
  { role: 'ADMIN', label: 'Administrator', icon: <FiShield />, emailKey: 'VITE_DEMO_ADMIN_EMAIL', passwordKey: 'VITE_DEMO_ADMIN_PASSWORD' },
  { role: 'HORSE_OWNER', label: 'Horse Owner', icon: <GiHorseHead />, emailKey: 'VITE_DEMO_OWNER_EMAIL', passwordKey: 'VITE_DEMO_OWNER_PASSWORD' },
  { role: 'JOCKEY', label: 'Jockey', icon: <GiHorseshoe />, emailKey: 'VITE_DEMO_JOCKEY_EMAIL', passwordKey: 'VITE_DEMO_JOCKEY_PASSWORD' },
  { role: 'REFEREE', label: 'Referee', icon: <FiCheckCircle />, emailKey: 'VITE_DEMO_REFEREE_EMAIL', passwordKey: 'VITE_DEMO_REFEREE_PASSWORD' },
  { role: 'SPECTATOR', label: 'Spectator', icon: <FiUsers />, emailKey: 'VITE_DEMO_SPECTATOR_EMAIL', passwordKey: 'VITE_DEMO_SPECTATOR_PASSWORD' },
];

const ENV = import.meta.env;

function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState(null);
  const sessionExpired = new URLSearchParams(location.search).get('reason') === 'session-expired';

  const quickAccounts = useMemo(() => QUICK_ROLES.map((item) => ({
    ...item,
    email: ENV[item.emailKey],
    password: ENV[item.passwordKey],
  })), []);

  const completeLogin = async (credentials) => {
    const authenticatedUser = await login(credentials);
    navigate('/dashboard', { replace: true, state: { loginRole: authenticatedUser.role } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await completeLogin({ email: email.trim(), password });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account) => {
    if (quickLoadingRole) return;
    setError('');
    if (!account.email || !account.password || account.email.startsWith('<') || account.password.startsWith('<')) {
      setError(`Demo credentials for ${account.label} are not configured in the local environment.`);
      return;
    }
    setQuickLoadingRole(account.role);
    try {
      await completeLogin({ email: account.email, password: account.password });
    } catch (err) {
      setError(err.message || `Unable to sign in as ${account.label}.`);
    } finally {
      setQuickLoadingRole(null);
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
            Welcome Back to the <span className="text-primary-color">Race</span>
          </h1>
          <p className="auth-brand-desc">
            Sign in securely to manage horses, assignments, results, and predictions.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign In</h2>
            <p className="auth-form-subtitle">Use your EquiX account credentials.</p>
          </div>

          {(location.state?.message || sessionExpired) && (
            <div className="auth-notice">
              {location.state?.message || 'Your session expired. Please sign in again.'}
            </div>
          )}
          {error && <div className="auth-error" id="login-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input id="login-email" type="email" className="form-input auth-input"
                  placeholder="you@equix.com" autoComplete="email" value={email}
                  onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input id="login-password" type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input" placeholder="Enter your password"
                  autoComplete="current-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="auth-input-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading || Boolean(quickLoadingRole)} id="btn-login-submit">
              {loading ? <><span className="spinner" /> Signing in...</> : <>Sign In <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-switch">Do not have an account? <Link to="/register" className="auth-switch-link">Create one</Link></p>
          <p className="auth-switch">Forgot password? <Link to="/reset-password" className="auth-switch-link">Reset it</Link></p>

          {QUICK_LOGIN_ENABLED && (
            <section className="auth-dev-panel" aria-labelledby="quick-login-title">
              <div className="quick-login-heading">
                <span className="auth-dev-label" id="quick-login-title">Demo Quick Login</span>
                <span className="badge badge-neutral">Secure login endpoint</span>
              </div>
              <div className="auth-dev-buttons">
                {quickAccounts.map((account) => {
                  const isLoading = quickLoadingRole === account.role;
                  return (
                    <button key={account.role} type="button" className="quick-login-button"
                      onClick={() => handleQuickLogin(account)} disabled={Boolean(quickLoadingRole) || loading}
                      aria-label={`Quick login as ${account.label}`}>
                      <span className="quick-login-icon">{account.icon}</span>
                      <span>{account.label}</span>
                      {isLoading && <span className="spinner" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
