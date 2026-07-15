import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    pointsReward: 0,
    criteria: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await api.getAchievements();
      setAchievements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createAchievement(formData);
      setShowForm(false);
      setFormData({ name: '', description: '', icon: '', pointsReward: 0, criteria: '' });
      fetchAchievements();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Achievements Management</h1>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Create Achievement'}
          </button>
        )}
      </div>

      {showForm && user?.role === 'ADMIN' && (
        <div className="bg-white p-6 rounded shadow mb-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">New Achievement</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required className="mt-1 block w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Icon (emoji or text)</label>
                <input className="mt-1 block w-full border rounded p-2" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Points Reward</label>
                <input type="number" required className="mt-1 block w-full border rounded p-2" value={formData.pointsReward} onChange={e => setFormData({...formData, pointsReward: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Criteria</label>
                <input className="mt-1 block w-full border rounded p-2" value={formData.criteria} onChange={e => setFormData({...formData, criteria: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea required className="mt-1 block w-full border rounded p-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {saving ? 'Saving...' : 'Save Achievement'}
            </button>
          </form>
        </div>
      )}

      {loading && <div className="p-4">Loading achievements...</div>}
      {error && <div className="p-4 text-red-500">Error: {error}</div>}

      {!loading && !error && (
        <>
          {achievements.length === 0 ? (
            <div className="text-gray-500">No achievements found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((ach) => (
                <div key={ach.id} className="bg-white rounded shadow p-6 border border-gray-200 flex flex-col items-center text-center">
                  <div className="text-5xl mb-4">{ach.icon || '🏆'}</div>
                  <h3 className="text-xl font-bold">{ach.name}</h3>
                  <p className="text-gray-500 mt-2 text-sm flex-1">{ach.description}</p>
                  <div className="mt-4 w-full bg-indigo-50 text-indigo-800 p-2 rounded text-sm font-semibold">
                    Reward: {ach.pointsReward} pts
                  </div>
                  {ach.criteria && <div className="mt-2 text-xs text-gray-400">Criteria: {ach.criteria}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AchievementsPage;
