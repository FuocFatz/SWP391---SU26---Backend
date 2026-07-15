import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

function JockeysPage() {
  const [jockeys, setJockeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJockeys();
  }, []);

  const fetchJockeys = async () => {
    try {
      setLoading(true);
      const data = await api.getJockeys();
      setJockeys(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading jockeys...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Jockeys Directory</h1>

      {jockeys.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No jockeys found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jockeys.map((jockey) => (
            <div key={jockey.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {jockey.user?.fullName?.charAt(0) || 'J'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{jockey.user?.fullName}</h3>
                  <span className={`inline-block px-2 py-1 mt-1 rounded text-xs font-semibold ${
                    jockey.availabilityStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {jockey.availabilityStatus}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Total Races</div>
                  <div className="text-lg font-bold">{jockey.totalRaces}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Total Wins</div>
                  <div className="text-lg font-bold">{jockey.totalWins}</div>
                </div>
              </div>

              <Link 
                to={`/jockeys/${jockey.id}`}
                className="block w-full text-center bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 font-medium transition"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JockeysPage;
