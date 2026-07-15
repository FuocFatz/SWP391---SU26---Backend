import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FiUsers, FiSearch } from 'react-icons/fi';

function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateUserStatus(id, newStatus);
      fetchUsers(); // Refresh
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchTerm || (
      (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'VERIFIED': return 'badge-green';
      case 'PENDING': return 'badge-yellow';
      case 'BANNED': return 'badge-red';
      default: return 'badge-gray';
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
    <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--container-max)', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--space-1)' }}>Users Management</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)' }}>
            {users.length} total account{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minWidth: 150 }}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HORSE_OWNER">HORSE_OWNER</option>
            <option value="JOCKEY">JOCKEY</option>
            <option value="REFEREE">REFEREE</option>
            <option value="SPECTATOR">SPECTATOR</option>
          </select>
          <div style={{ position: 'relative', minWidth: 250 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-16) 0', gap: 'var(--space-3)' }}>
          <FiUsers style={{ fontSize: 'var(--fs-4xl)', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: 'var(--fs-lg)' }}>{searchTerm ? 'No users match your search' : 'No users found'}</h3>
          <p style={{ color: 'var(--text-tertiary)' }}>{searchTerm ? 'Try a different search term.' : 'Users will appear here once they register.'}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', 'Name', 'Email', 'Role', 'Status', 'Actions'].map(header => (
                    <th key={header} style={{
                      padding: 'var(--space-4) var(--space-5)',
                      textAlign: 'left',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-primary)',
                      background: 'var(--bg-tertiary)',
                      whiteSpace: 'nowrap',
                    }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-secondary)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                      #{user.id}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                      {user.fullName || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span className="badge badge-neutral">{user.role}</span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span className={`badge ${statusBadgeClass(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }}>Edit</button>
                        {user.status === 'PENDING' && (
                          <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleStatusChange(user.id, 'VERIFIED')}>Approve</button>
                        )}
                        {user.status === 'VERIFIED' && (
                          <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleStatusChange(user.id, 'BANNED')}>Ban</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagementPage;
