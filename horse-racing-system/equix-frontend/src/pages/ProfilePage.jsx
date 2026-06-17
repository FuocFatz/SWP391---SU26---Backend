import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiSave, FiCamera } from 'react-icons/fi';
import './ProfilePage.css';

function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  return (
    <div className="profile-page" id="profile-page">
      <h1 className="dash-title" style={{ marginBottom: 'var(--space-8)' }}>My Profile</h1>

      <div className="profile-grid">
        {/* Avatar Card */}
        <div className="profile-avatar-card card">
          <div className="profile-avatar-large">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h3 className="profile-avatar-name">{user?.name || 'User'}</h3>
          <span className="badge badge-green">{user?.role || 'GUEST'}</span>
          <span className="profile-status">
            <span className="status-dot status-dot-active" /> Active
          </span>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-4)' }}>
            <FiCamera /> Change Photo
          </button>
        </div>

        {/* Edit Form */}
        <div className="profile-form-card card" style={{ padding: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-6)' }}>Account Information</h3>

          <form className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-role">Role</label>
              <input
                id="profile-role"
                className="form-input"
                value={user?.role || ''}
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>

            <button type="button" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              <FiSave /> Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
