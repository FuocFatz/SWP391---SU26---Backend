import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GiHorseshoe } from 'react-icons/gi';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './LoginPage.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please enter your email and password');
        return;
      }
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
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
            Sign in to manage horses, race assignments, results, and predictions.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign In</h2>
            <p className="auth-form-subtitle">
              Demo password for seeded accounts is 123456
            </p>
          </div>

          {error && (
            <div className="auth-error" id="login-error">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input auth-input"
                  placeholder="owner@equix.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="123456"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
              id="btn-login-submit"
            >
              {loading ? <span className="spinner" /> : <>Sign In <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-switch">
            Do not have an account?{' '}
            <Link to="/register" className="auth-switch-link">Create one</Link>
          </p>

          <p className="auth-switch">
            Forgot password?{' '}
            <Link to="/reset-password" className="auth-switch-link">Reset it</Link>
          </p>

          <div className="auth-dev-panel">
            <span className="auth-dev-label">Quick Login</span>
            <div className="auth-dev-buttons">
              {['HORSE_OWNER', 'JOCKEY', 'SPECTATOR', 'REFEREE', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  className="btn btn-ghost btn-sm"
                  onClick={() => { login(role); navigate('/dashboard'); }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
