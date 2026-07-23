import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { GiHorseshoe } from 'react-icons/gi';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './LoginPage.css';

const roles = [
  { id: 'HORSE_OWNER', name: 'Chủ ngựa', desc: 'Quản lý ngựa và đăng ký cuộc đua' },
  { id: 'JOCKEY', name: 'Nài ngựa', desc: 'Chấp nhận lời mời cưỡi ngựa' },
  { id: 'SPECTATOR', name: 'Khán giả', desc: 'Xem cuộc đua và dự đoán người thắng' },
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
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!acceptTerms) {
      setError('Vui lòng chấp nhận Điều khoản dịch vụ');
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
        navigate('/login', { state: { message: 'Đã nhận đăng ký. Tài khoản của bạn đang chờ Quản trị viên xác nhận.' } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
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
            Tham gia đường đua <span className="text-primary-color">EquiX</span>
          </h1>
          <p className="auth-brand-desc">
            Tạo tài khoản cho vai trò bạn muốn sử dụng trong quy trình cuộc đua.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Tạo tài khoản</h2>
            <p className="auth-form-subtitle">
              Chọn vai trò và nhập thông tin của bạn
            </p>
          </div>

          {error && (
            <div className="auth-error" id="register-error">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} id="register-form">
            <div className="form-group">
              <label className="form-label">Chọn vai trò</label>
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
              <label className="form-label" htmlFor="register-name">Họ và tên</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  id="register-name"
                  type="text"
                  className="form-input auth-input"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-email">Địa chỉ email</label>
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
              <label className="form-label" htmlFor="register-password">Mật khẩu</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="Tạo mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Ẩn hoặc hiện mật khẩu"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm">Xác nhận mật khẩu</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="register-confirm"
                  type="password"
                  className="form-input auth-input"
                  placeholder="Nhập lại mật khẩu"
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
              <span>Tôi chấp nhận <Link to="/terms" className="auth-switch-link">Điều khoản dịch vụ</Link></span>
            </label>

            <button
              type="submit"
              className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
              id="btn-register-submit"
            >
              {loading ? <span className="spinner" /> : <>Tạo tài khoản <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-switch">
            Bạn đã có tài khoản?{' '}
            <Link to="/login" className="auth-switch-link">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
