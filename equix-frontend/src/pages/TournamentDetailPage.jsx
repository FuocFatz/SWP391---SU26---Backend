import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function TournamentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState(null);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tournData, racesData] = await Promise.all([
        api.getTournament(id),
        api.getTournamentRaces(id)
      ]);
      setTournament(tournData);
      setFormData({
        name: tournData.name,
        startDate: tournData.startDate,
        endDate: tournData.endDate,
        prizePool: tournData.prizePool,
        status: tournData.status
      });
      setRaces(racesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateTournament(id, formData);
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tournament details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!tournament) return <div className="p-8 text-center text-gray-500">Tournament not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50 rounded-t-lg">
          <h1 className="text-3xl font-bold text-indigo-900">{tournament.name}</h1>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Tournament'}
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input className="mt-1 block w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="mt-1 block w-full border rounded p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" className="mt-1 block w-full border rounded p-2" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" className="mt-1 block w-full border rounded p-2" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prize Pool</label>
                  <input type="number" className="mt-1 block w-full border rounded p-2" value={formData.prizePool} onChange={e => setFormData({...formData, prizePool: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Status</p>
                <p className="text-lg font-semibold">{tournament.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Dates</p>
                <p className="text-lg font-semibold">{tournament.startDate} to {tournament.endDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Prize Pool</p>
                <p className="text-lg font-semibold text-green-600">{tournament.prizePool?.toLocaleString()} Points</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Tournament Races</h2>
      {races.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No races scheduled for this tournament yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {races.map(race => (
            <div key={race.id} className="bg-white border rounded shadow-sm p-4 hover:shadow-md transition">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{race.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  race.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  race.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {race.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                {race.raceDate} • {race.distanceM}m • {race.surface}
              </p>
              <Link to={`/races/${race.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                View Race Details &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TournamentDetailPage;
