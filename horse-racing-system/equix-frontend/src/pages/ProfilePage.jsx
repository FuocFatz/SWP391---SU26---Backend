import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { FiSave } from 'react-icons/fi';
import './ProfilePage.css';

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      setSaving(true);
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setMessage('Profile saved successfully.');
    } catch (err) {
      setMessage(err.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page" id="profile-page">
      <h1 className="dash-title" style={{ marginBottom: 'var(--space-8)' }}>My Profile</h1>
      {message && <div className="dash-message">{message}</div>}
      <div className="profile-grid">
        <div className="profile-avatar-card card">
          <div className="profile-avatar-large">{user?.name?.charAt(0) || 'U'}</div>
          <h3 className="profile-avatar-name">{user?.name || 'User'}</h3>
          <span className="badge badge-green">{user?.role || 'GUEST'}</span>
          <span className="profile-status"><span className="status-dot status-dot-active" /> {user?.status || 'Active'}</span>
          <p className="workflow-muted inline">Avatar upload is not enabled in this release.</p>
        </div>

        <div className="profile-form-card card" style={{ padding: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-6)' }}>Account Information</h3>
          <form className="profile-form" onSubmit={save}>
            <div className="form-group"><label className="form-label" htmlFor="profile-name">Full Name</label><input id="profile-name" className="form-input" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength="2" maxLength="150" required /></div>
            <div className="form-group"><label className="form-label" htmlFor="profile-email">Email Address</label><input id="profile-email" type="email" className="form-input" value={user?.email || ''} readOnly aria-readonly="true" /></div>
            <div className="form-group"><label className="form-label" htmlFor="profile-phone">Phone</label><input id="profile-phone" className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength="30" placeholder="Optional phone number" /></div>
            <div className="form-group"><label className="form-label" htmlFor="profile-role">Role</label><input id="profile-role" className="form-input" value={user?.role || ''} disabled /></div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} disabled={saving || fullName.trim().length < 2}><FiSave /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
