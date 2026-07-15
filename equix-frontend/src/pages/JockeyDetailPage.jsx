import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function JockeyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [jockey, setJockey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For achievements awarding
  const [achievements, setAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState('');
  const [awardLoading, setAwardLoading] = useState(false);

  useEffect(() => {
    fetchJockey();
    if (user?.role === 'ADMIN' || user?.role === 'REFEREE') {
      fetchAchievements();
    }
  }, [id, user]);

  const fetchJockey = async () => {
    try {
      setLoading(true);
      const data = await api.getJockey(id);
      setJockey(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const data = await api.getAchievements();
      setAchievements(data);
      if (data.length > 0) setSelectedAchievement(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAward = async (e) => {
    e.preventDefault();
    if (!selectedAchievement) return;
    try {
      setAwardLoading(true);
      await api.awardAchievement(id, {
        achievement: { id: selectedAchievement }
      });
      alert('Achievement awarded!');
      fetchJockey(); // refresh to show new achievement
    } catch (err) {
      alert(err.message);
    } finally {
      setAwardLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading jockey details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!jockey) return <div className="p-8 text-center text-gray-500">Jockey not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-indigo-600 h-32"></div>
        <div className="px-6 py-8 relative">
          <div className="absolute -top-16 left-6 w-32 h-32 bg-white rounded-full border-4 border-white flex items-center justify-center text-5xl text-indigo-600 font-bold shadow-md">
            {jockey.user?.fullName?.charAt(0) || 'J'}
          </div>
          
          <div className="ml-40">
            <h1 className="text-3xl font-bold text-gray-900">{jockey.user?.fullName}</h1>
            <p className="text-gray-500 mt-1">{jockey.user?.email}</p>
            <div className="mt-4 flex gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                jockey.availabilityStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {jockey.availabilityStatus}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                Experience: {jockey.experienceLevel}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 px-6 py-6 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-sm text-gray-500 uppercase font-medium">Races</div>
            <div className="text-3xl font-bold text-gray-900">{jockey.totalRaces}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 uppercase font-medium">Wins</div>
            <div className="text-3xl font-bold text-gray-900">{jockey.totalWins}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 uppercase font-medium">Win Rate</div>
            <div className="text-3xl font-bold text-gray-900">
              {jockey.totalRaces > 0 ? Math.round((jockey.totalWins / jockey.totalRaces) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Achievements</h2>
        {(!jockey.achievements || jockey.achievements.length === 0) ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 border border-gray-200">
            No achievements earned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {jockey.achievements.map((ach) => (
              <div key={ach.id} className="bg-white rounded border border-gray-200 p-4 shadow-sm flex items-start gap-3">
                <div className="text-2xl">{ach.achievement.icon || '🏆'}</div>
                <div>
                  <h4 className="font-bold text-gray-900">{ach.achievement.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">Awarded: {new Date(ach.awardedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'REFEREE') && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">Award Achievement (Admin/Referee)</h3>
          <form onSubmit={handleAward} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Achievement</label>
              <select 
                className="w-full border-gray-300 rounded-md shadow-sm border p-2"
                value={selectedAchievement}
                onChange={(e) => setSelectedAchievement(e.target.value)}
                required
              >
                {achievements.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.pointsReward} pts)</option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={awardLoading}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
            >
              {awardLoading ? 'Awarding...' : 'Award'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default JockeyDetailPage;
