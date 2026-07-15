import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function HorseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHorse();
  }, [id]);

  const fetchHorse = async () => {
    try {
      setLoading(true);
      const data = await api.getHorse(id);
      setHorse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this horse?')) return;
    try {
      setDeleting(true);
      await api.deleteHorse(id);
      alert('Horse deleted successfully');
      navigate('/dashboard/horses');
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading horse details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!horse) return <div className="p-8 text-center text-gray-500">Horse not found.</div>;

  const isOwner = user?.role === 'HORSE_OWNER' && user?.id === horse.owner?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-amber-600 h-32 flex items-end px-6 pb-4">
          <h1 className="text-3xl font-bold text-white">{horse.name}</h1>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-500">Breed: <span className="font-semibold text-gray-900">{horse.breed}</span></p>
              <p className="text-gray-500">Age: <span className="font-semibold text-gray-900">{horse.age} years</span></p>
            </div>
            {(isOwner || isAdmin) && (
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition"
              >
                {deleting ? 'Deleting...' : 'Delete Horse'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-gray-100 pt-6">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500 uppercase font-medium">Health</div>
              <div className="text-2xl font-bold text-gray-900">{horse.healthStatus}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500 uppercase font-medium">Speed</div>
              <div className="text-2xl font-bold text-gray-900">{horse.speedStat}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500 uppercase font-medium">Stamina</div>
              <div className="text-2xl font-bold text-gray-900">{horse.staminaStat}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500 uppercase font-medium">Owner</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{horse.owner?.fullName || 'Unknown'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorseDetailPage;
