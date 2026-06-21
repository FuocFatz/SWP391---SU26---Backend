import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiLock, FiCheckCircle } from 'react-icons/fi';
import { api } from '../services/api';
import './PasswordResetPage.css';

function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState(token ? 'confirm' : 'request'); // 'request' or 'confirm' or 'success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      await api.requestPasswordReset(email);
      setMessage('✓ If an account with that email exists, a reset link has been sent. Please check your email.');
      setEmail('');
      setTimeout(() => setStep('request'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await api.confirmPasswordReset(token, password);
      setMessage('✓ Password reset successful! Redirecting to login...');
      setPassword('');
      setConfirmPassword('');
      setStep('success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-page" id="password-reset-page">
      <div className="password-reset-container">
        <div className="password-reset-header">
          <Link to="/login" className="password-reset-back">
            <FiArrowLeft /> Back to Login
          </Link>
          <h1 className="password-reset-title">Reset Your Password</h1>
        </div>

        {step === 'request' && (
          <div className="password-reset-form-wrapper">
            <p className="password-reset-subtitle">
              Enter the email address associated with your account, and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="password-reset-error">
                <span>✗ {error}</span>
              </div>
            )}

            {message && (
              <div className="password-reset-message">
                <span>ℹ️ {message}</span>
              </div>
            )}

            <form onSubmit={handleRequestReset} className="password-reset-form">
              <div className="form-group">
                <label htmlFor="reset-email" className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <FiMail className="form-input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="password-reset-footer">
              Remember your password? <Link to="/login">Back to login</Link>
            </p>
          </div>
        )}

        {step === 'confirm' && token && (
          <div className="password-reset-form-wrapper">
            <p className="password-reset-subtitle">
              Enter your new password below. Make sure to use a strong, unique password.
            </p>

            {error && (
              <div className="password-reset-error">
                <span>✗ {error}</span>
              </div>
            )}

            {message && (
              <div className="password-reset-message">
                <span>ℹ️ {message}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReset} className="password-reset-form">
              <div className="form-group">
                <label htmlFor="new-password" className="form-label">New Password</label>
                <div className="form-input-wrapper">
                  <FiLock className="form-input-icon" />
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
                <div className="form-input-wrapper">
                  <FiLock className="form-input-icon" />
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-input"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="password-reset-success">
            <FiCheckCircle className="success-icon" />
            <h2>Password Reset Successful</h2>
            <p>Your password has been successfully reset. You will be redirected to the login page shortly.</p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordResetPage;
