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
      setError('Vui lòng nhập email của bạn');
      return;
    }

    try {
      setLoading(true);
      await api.requestPasswordReset(email);
      setMessage('✓ Nếu tồn tại tài khoản với email này, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email.');
      setEmail('');
      setTimeout(() => setStep('request'), 3000);
    } catch (err) {
      setError(err.message || 'Không thể yêu cầu đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ hai ô mật khẩu');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hai mật khẩu không trùng khớp');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, gồm một chữ cái và một chữ số');
      return;
    }

    try {
      setLoading(true);
      await api.confirmPasswordReset(token, password);
      setMessage('✓ Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      setPassword('');
      setConfirmPassword('');
      setStep('success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-page" id="password-reset-page">
      <div className="password-reset-container">
        <div className="password-reset-header">
          <Link to="/login" className="password-reset-back">
            <FiArrowLeft /> Quay lại đăng nhập
          </Link>
          <h1 className="password-reset-title">Đặt lại mật khẩu</h1>
        </div>

        {step === 'request' && (
          <div className="password-reset-form-wrapper">
            <p className="password-reset-subtitle">
              Nhập địa chỉ email của tài khoản; hệ thống sẽ gửi cho bạn liên kết đặt lại mật khẩu.
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
                <label htmlFor="reset-email" className="form-label">Địa chỉ email</label>
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
                {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
              </button>
            </form>

            <p className="password-reset-footer">
              Bạn nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link>
            </p>
          </div>
        )}

        {step === 'confirm' && token && (
          <div className="password-reset-form-wrapper">
            <p className="password-reset-subtitle">
              Nhập mật khẩu mới bên dưới. Hãy sử dụng mật khẩu mạnh và riêng biệt.
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
                <label htmlFor="new-password" className="form-label">Mật khẩu mới</label>
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
                <label htmlFor="confirm-password" className="form-label">Xác nhận mật khẩu</label>
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
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="password-reset-success">
            <FiCheckCircle className="success-icon" />
            <h2>Đặt lại mật khẩu thành công</h2>
            <p>Mật khẩu đã được đặt lại thành công. Bạn sẽ sớm được chuyển đến trang đăng nhập.</p>
            <Link to="/login" className="btn btn-primary">Đi đến đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordResetPage;
