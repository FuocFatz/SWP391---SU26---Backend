import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiSave, FiCamera, FiPhone, FiLink, FiStar } from 'react-icons/fi';
import { api } from '../services/api';
import './ProfilePage.css';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getUserProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatarUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateUserProfile({ fullName, phone, avatarUrl });
      alert('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <div className="loading-spinner" />
    </div>
  );
  if (error) return (
    <div className="card" style={{ margin: 'var(--space-6)', padding: 'var(--space-4)', borderColor: 'rgba(192,57,43,0.3)' }}>
      <span style={{ color: 'var(--color-primary-light)' }}>Error: {error}</span>
    </div>
  );

  return (
    <div className="profile-page" id="profile-page" style={{ padding: 'var(--space-8)', maxWidth: 'var(--container-max)', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--space-8)' }}>My Profile</h1>

      <div className="profile-grid">
        {/* Avatar Card */}
        <div className="card profile-avatar-card">
          <div className="profile-avatar-large">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              profile?.fullName?.charAt(0) || 'U'
            )}
          </div>
          <span className="profile-avatar-name">{profile?.fullName || 'User'}</span>
          <span className="badge badge-green">{profile?.role || 'GUEST'}</span>
          <span className="profile-status">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: profile?.status === 'VERIFIED' ? 'var(--color-secondary-light)' : 'var(--color-accent)', display: 'inline-block' }} />
            {profile?.status || 'Unknown'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <FiStar style={{ color: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--color-accent)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' }}>
              {profile?.rewardPoints || 0}
            </span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>points</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-6)' }}>Account Information</h3>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-group">
              <label className="form-label"><FiUser style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Full Name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><FiPhone style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Phone</label>
              <input
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label"><FiLink style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Avatar URL</label>
              <input
                className="form-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><FiMail style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Email Address</label>
              <input
                className="form-input"
                type="email"
                value={profile?.email || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
