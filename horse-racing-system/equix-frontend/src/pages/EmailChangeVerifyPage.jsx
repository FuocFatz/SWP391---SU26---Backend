import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiMail } from 'react-icons/fi';
import { api } from '../services/api';
import './PasswordResetPage.css';

function EmailChangeVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const verify = async () => {
    if (!token) {
      setError('Liên kết xác minh email không đầy đủ.');
      return;
    }
    try {
      setLoading(true); setError('');
      const message = await api.confirmEmailChange(token);
      setSuccess(message?.message || message || 'Đã xác minh và cập nhật địa chỉ email.');
    } catch (err) {
      setError(err.message || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-page">
      <div className="password-reset-container">
        <div className="password-reset-header">
          <FiMail className="success-icon" />
          <h1 className="password-reset-title">Xác minh email mới</h1>
        </div>
        <div className="password-reset-form-wrapper">
          {success ? <div className="password-reset-success"><FiCheckCircle className="success-icon" /><h2>Đã cập nhật email</h2><p>{success}</p><Link className="btn btn-primary" to="/login">Đăng nhập bằng email mới</Link></div> : <>
            <p className="password-reset-subtitle">Xác nhận yêu cầu thay đổi địa chỉ email của tài khoản EquiX.</p>
            {error && <div className="password-reset-error" role="alert">{error}</div>}
            <button type="button" className="btn btn-primary btn-lg" onClick={verify} disabled={loading || !token}>{loading ? 'Đang xác minh...' : 'Xác minh email mới'}</button>
            <p className="password-reset-footer"><Link to="/login">Quay lại đăng nhập</Link></p>
          </>}
        </div>
      </div>
    </div>
  );
}

export default EmailChangeVerifyPage;
