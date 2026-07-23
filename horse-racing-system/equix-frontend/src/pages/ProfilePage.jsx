import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import UserAvatar from '../components/UserAvatar/UserAvatar';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { validateAvatarFile } from '../utils/avatarValidation';
import { api } from '../services/api';
import { translateText } from '../utils/vietnameseLocalization';
import { FiImage, FiMail, FiSave, FiTrash2, FiUpload } from 'react-icons/fi';
import './ProfilePage.css';

function ProfilePage() {
  const { user, updateProfile, updateAvatar, removeAvatar } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const clearSelectedAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectAvatar = (event) => {
    const file = event.target.files?.[0];
    const validationMessage = validateAvatarFile(file);
    if (validationMessage) {
      clearSelectedAvatar();
      setFeedback({ type: 'error', text: validationMessage });
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFeedback(null);
  };

  const uploadSelectedAvatar = async () => {
    if (!avatarFile) return;
    setFeedback(null);
    try {
      setAvatarSaving(true);
      await updateAvatar(avatarFile);
      clearSelectedAvatar();
      setFeedback({ type: 'success', text: 'Đã cập nhật ảnh đại diện.' });
    } catch (err) {
      setFeedback({ type: 'error', text: translateText(err.message || 'Không thể cập nhật ảnh đại diện.') });
    } finally {
      setAvatarSaving(false);
    }
  };

  const resetAvatar = async () => {
    setFeedback(null);
    try {
      setAvatarSaving(true);
      await removeAvatar();
      clearSelectedAvatar();
      setFeedback({ type: 'success', text: 'Đã xóa ảnh đại diện.' });
    } catch (err) {
      setFeedback({ type: 'error', text: translateText(err.message || 'Không thể xóa ảnh đại diện.') });
    } finally {
      setAvatarSaving(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      setSaving(true);
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setFeedback({ type: 'success', text: 'Đã lưu hồ sơ.' });
    } catch (err) {
      setFeedback({ type: 'error', text: translateText(err.message || 'Không thể lưu hồ sơ.') });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', text: 'Mật khẩu mới và ô xác nhận không trùng khớp.' });
      return;
    }
    try {
      setPasswordSaving(true); setFeedback(null);
      await api.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFeedback({ type: 'success', text: 'Đã đổi mật khẩu.' });
    } catch (err) {
      setFeedback({ type: 'error', text: translateText(err.message || 'Không thể đổi mật khẩu.') });
    } finally {
      setPasswordSaving(false);
    }
  };

  const requestEmailChange = async (event) => {
    event.preventDefault();
    try {
      setEmailSaving(true); setFeedback(null);
      const message = await api.requestEmailChange({
        newEmail: emailForm.newEmail.trim(),
        currentPassword: emailForm.currentPassword,
      });
      setEmailForm({ newEmail: '', currentPassword: '' });
      setFeedback({ type: 'success', text: translateText(message?.message || message || 'Đã gửi liên kết xác minh đến địa chỉ email mới.') });
    } catch (err) {
      setFeedback({ type: 'error', text: translateText(err.message || 'Không thể yêu cầu thay đổi email.') });
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className="profile-page" id="profile-page">
      <h1 className="dash-title profile-title">Hồ sơ của tôi</h1>
      <ToastNotification
        message={feedback?.text}
        type={feedback?.type}
        onDismiss={() => setFeedback(null)}
      />
      <div className="profile-grid">
        <div className="profile-avatar-card card">
          <div className="profile-avatar-preview-wrap">
            <UserAvatar user={user} source={avatarPreview} className="profile-avatar-large" />
            {avatarPreview && <span className="profile-preview-badge">Xem trước</span>}
          </div>
          <h3 className="profile-avatar-name">{user?.name || 'Người dùng'}</h3>
          <span className="badge badge-green">{translateText(user?.role || 'Khách')}</span>
          <span className="profile-status"><span className="status-dot status-dot-active" /> {translateText(user?.status || 'Đang hoạt động')}</span>

          <input ref={fileInputRef} id="avatar-file" className="profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAvatar} />
          <div className="profile-avatar-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} disabled={avatarSaving}>
              <FiImage /> Chọn ảnh
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={uploadSelectedAvatar} disabled={!avatarFile || avatarSaving}>
              <FiUpload /> {avatarSaving && avatarFile ? 'Đang tải lên...' : 'Lưu ảnh đại diện'}
            </button>
            {(user?.avatar || avatarPreview) && (
              <button type="button" className="btn btn-ghost btn-sm profile-remove-avatar" onClick={avatarPreview ? clearSelectedAvatar : resetAvatar} disabled={avatarSaving}>
                <FiTrash2 /> {avatarPreview ? 'Hủy xem trước' : 'Xóa ảnh đại diện'}
              </button>
            )}
          </div>
          <p className="profile-avatar-hint">JPG, PNG hoặc WebP · tối đa 5 MB</p>
        </div>

        <div className="profile-form-card card">
          <h3>Thông tin tài khoản</h3>
          <form className="profile-form" onSubmit={save}>
            <div className="form-group"><label className="form-label" htmlFor="profile-name">Họ và tên</label><input id="profile-name" className="form-input" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength="2" maxLength="150" required /></div>
            <div className="form-group"><label className="form-label" htmlFor="profile-email">Địa chỉ email</label><input id="profile-email" type="email" className="form-input" value={user?.email || ''} readOnly aria-readonly="true" /></div>
            <div className="form-group"><label className="form-label" htmlFor="profile-phone">Số điện thoại</label><input id="profile-phone" className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength="30" placeholder="Số điện thoại không bắt buộc" /></div>
            <div className="form-group"><label className="form-label" htmlFor="profile-role">Vai trò</label><input id="profile-role" className="form-input" value={translateText(user?.role || '')} disabled /></div>
            <button type="submit" className="btn btn-primary profile-save-button" disabled={saving || fullName.trim().length < 2}><FiSave /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </form>
        </div>
        <div className="profile-form-card profile-password-card card">
          <h3>Đổi mật khẩu</h3>
          <form className="profile-form" onSubmit={changePassword}>
            <div className="form-group"><label className="form-label" htmlFor="current-password">Mật khẩu hiện tại</label><input id="current-password" type="password" className="form-input" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></div>
            <div className="form-group"><label className="form-label" htmlFor="new-password">Mật khẩu mới</label><input id="new-password" type="password" className="form-input" autoComplete="new-password" minLength="8" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required /><span className="profile-avatar-hint">Ít nhất 8 ký tự, gồm một chữ cái và một chữ số.</span></div>
            <div className="form-group"><label className="form-label" htmlFor="confirm-password">Xác nhận mật khẩu mới</label><input id="confirm-password" type="password" className="form-input" autoComplete="new-password" minLength="8" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required /></div>
            <button type="submit" className="btn btn-primary profile-save-button" disabled={passwordSaving || passwordForm.newPassword.length < 8 || passwordForm.newPassword !== passwordForm.confirmPassword}><FiSave /> {passwordSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
          </form>
        </div>
        <div className="profile-form-card profile-email-card card">
          <h3>Đổi email</h3>
          <p className="profile-avatar-hint">Email hiện tại vẫn hoạt động cho đến khi bạn xác minh địa chỉ mới. Liên kết xác minh hết hạn sau 30 phút.</p>
          <form className="profile-form" onSubmit={requestEmailChange}>
            <div className="form-group"><label className="form-label" htmlFor="new-email">Địa chỉ email mới</label><input id="new-email" type="email" className="form-input" autoComplete="email" value={emailForm.newEmail} onChange={(event) => setEmailForm({ ...emailForm, newEmail: event.target.value })} required /></div>
            <div className="form-group"><label className="form-label" htmlFor="email-current-password">Mật khẩu hiện tại</label><input id="email-current-password" type="password" className="form-input" autoComplete="current-password" value={emailForm.currentPassword} onChange={(event) => setEmailForm({ ...emailForm, currentPassword: event.target.value })} required /></div>
            <button type="submit" className="btn btn-primary profile-save-button" disabled={emailSaving || !emailForm.currentPassword || !emailForm.newEmail.trim() || emailForm.newEmail.trim().toLowerCase() === user?.email?.toLowerCase()}><FiMail /> {emailSaving ? 'Đang gửi...' : 'Gửi xác minh'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
