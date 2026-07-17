import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { GiHorseshoe } from 'react-icons/gi';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './LoginPage.css';

const roles = [
  { id: 'HORSE_OWNER', name: 'Horse Owner', desc: 'Manage horses and enter races' },
  { id: 'JOCKEY', name: 'Jockey', desc: 'Accept ride invitations' },
  { id: 'SPECTATOR', name: 'Spectator', desc: 'Watch races and predict winners' },
];

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('HORSE_OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username: email.split('@')[0],
        fullName,
        email,
        password,
        phone: '',
        role: selectedRole,
      });
      if (result.pending) {
        navigate('/login', { state: { message: 'Registration received. Your account is pending Admin confirmation.' } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-glow" />
        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo">
            <GiHorseshoe className="auth-brand-logo-icon" />
            <span>Equi<span className="auth-brand-logo-accent">X</span></span>
          </Link>
          <h1 className="auth-brand-title">
            Join the <span className="text-primary-color">EquiX</span> Race
          </h1>
          <p className="auth-brand-desc">
            Create an account for the role you want to demo in the racing workflow.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">
              Choose a role and enter your details
            </p>
          </div>

          {error && (
            <div className="auth-error" id="register-error">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} id="register-form">
            <div className="form-group">
              <label className="form-label">Select Your Role</label>
              <div className="role-cards">
                {roles.map((role) => (
                  <button
                    type="button"
                    key={role.id}
                    className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role.id)}
                    id={`role-${role.id.toLowerCase()}`}
                  >
                    <span className="role-card-name">{role.name}</span>
                    <span className="role-card-desc">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-name">Full Name</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  id="register-name"
                  type="text"
                  className="form-input auth-input"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-email">Email Address</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  id="register-email"
                  type="email"
                  className="form-input auth-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="Create a password"
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

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm">Confirm Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="register-confirm"
                  type="password"
                  className="form-input auth-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <label className="form-checkbox" htmlFor="accept-terms">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>I accept the <Link to="/terms" className="auth-switch-link">Terms of Service</Link></span>
            </label>

            <button
              type="submit"
              className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
              id="btn-register-submit"
            >
              {loading ? <span className="spinner" /> : <>Create Account <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
