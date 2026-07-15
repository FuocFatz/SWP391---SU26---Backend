import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiGift, FiClock, FiPlus, FiX } from 'react-icons/fi';

function RewardsPage() {
  const { user } = useAuth();
  
  const [rewardTypes, setRewardTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  // For Admin creation
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', pointsCost: 0, rewardValue: '' });
  const [saving, setSaving] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('REDEEM'); // REDEEM or HISTORY

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await api.getRewardTypes();
      setRewardTypes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await api.getRewardHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createRewardType(formData);
      setShowForm(false);
      setFormData({ name: '', description: '', pointsCost: 0, rewardValue: '' });
      fetchRewards();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRedeem = async (typeId) => {
    if (!window.confirm('Redeem this reward?')) return;
    try {
      await api.redeemReward({ rewardTypeId: typeId });
      alert('Reward redeemed successfully!');
      // Refresh to update potential point balance in context if we had it, but here just fetch history
      setActiveTab('HISTORY');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--container-max)', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--fs-2xl)' }}>Rewards Center</h1>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn btn-outline' : 'btn btn-primary'}
          >
            {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Create Reward Type</>}
          </button>
        )}
      </div>

      {showForm && user?.role === 'ADMIN' && (
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-5)' }}>New Reward Type</h3>
          <form onSubmit={handleCreateType} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Points Cost</label>
                <input type="number" required className="form-input" value={formData.pointsCost} onChange={e => setFormData({...formData, pointsCost: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Reward Value</label>
                <input required className="form-input" value={formData.rewardValue} onChange={e => setFormData({...formData, rewardValue: e.target.value})} placeholder="e.g. VIP Badge, 50 Coins" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea required className="form-input" style={{ minHeight: 80, resize: 'vertical' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <button type="submit" disabled={saving} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving...' : 'Save Reward Type'}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 0 }}>
        <button 
          onClick={() => setActiveTab('REDEEM')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'REDEEM' ? '2px solid var(--color-primary-light)' : '2px solid transparent',
            color: activeTab === 'REDEEM' ? 'var(--color-primary-light)' : 'var(--text-tertiary)',
            borderRadius: 0,
            paddingBottom: 'var(--space-3)',
          }}
        >
          <FiGift /> Available Rewards
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'HISTORY' ? '2px solid var(--color-primary-light)' : '2px solid transparent',
            color: activeTab === 'HISTORY' ? 'var(--color-primary-light)' : 'var(--text-tertiary)',
            borderRadius: 0,
            paddingBottom: 'var(--space-3)',
          }}
        >
          <FiClock /> Redemption History
        </button>
      </div>

      {activeTab === 'REDEEM' && (
        <>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <div className="loading-spinner" />
            </div>
          )}
          {error && (
            <div className="card" style={{ padding: 'var(--space-4)', borderColor: 'rgba(192,57,43,0.3)' }}>
              <span style={{ color: 'var(--color-primary-light)' }}>Error: {error}</span>
            </div>
          )}
          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {rewardTypes.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-16) 0', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--fs-4xl)' }}>🏆</span>
                  <h3 style={{ fontSize: 'var(--fs-lg)' }}>No rewards available</h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>Check back later for exciting rewards to redeem</p>
                </div>
              ) : (
                rewardTypes.map(rt => (
                  <div key={rt.id} className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>{rt.name}</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)', flex: 1 }}>{rt.description}</p>
                    <div style={{ marginTop: 'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-4)' }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--color-accent)', fontSize: 'var(--fs-lg)' }}>{rt.pointsCost} pts</span>
                      <button 
                        onClick={() => handleRedeem(rt.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'HISTORY' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <div className="loading-spinner" />
            </div>
          ) : history.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-16) 0', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--fs-4xl)' }}>📜</span>
              <h3 style={{ fontSize: 'var(--fs-lg)' }}>No redemption history</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>You haven't redeemed any rewards yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)' }}>Date</th>
                    <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)' }}>Reward</th>
                    <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                      <td style={{ padding: 'var(--space-4) var(--space-6)', whiteSpace: 'nowrap', color: 'var(--text-tertiary)' }}>
                        {new Date(item.redeemedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                        {item.rewardType?.name}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                        <span className={`badge ${item.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RewardsPage;
