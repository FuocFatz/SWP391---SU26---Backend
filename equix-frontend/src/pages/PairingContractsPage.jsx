import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function PairingContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await api.getPairingContracts();
      setContracts(data);
    } catch (err) {
      if (err.message === 'Request failed' || err.message.includes('403')) {
        setError('Access Denied: You do not have permission to view all pairing contracts.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDissolve = async (id) => {
    if (!window.confirm('Are you sure you want to dissolve this contract?')) return;
    try {
      await api.dissolvePairingContract(id);
      alert('Contract dissolved successfully');
      fetchContracts();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading pairing contracts...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pairing Contracts</h1>
      
      {error && (
        <div className="mb-6 p-4 rounded bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}
      
      {contracts.length === 0 ? (
        <div className="text-gray-500 bg-white p-6 rounded shadow">No pairing contracts found.</div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Horse</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Jockey</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map((contract) => {
                const canDissolve = 
                  contract.status === 'ACTIVE' && 
                  (user?.role === 'ADMIN' || 
                   (user?.role === 'HORSE_OWNER' && user?.id === contract.horse?.owner?.id) || 
                   (user?.role === 'JOCKEY' && user?.id === contract.jockey?.user?.id));

                return (
                  <tr key={contract.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{contract.id}</td>
                    <td className="px-4 py-3">
                      {contract.horse?.name} (Owner: {contract.horse?.owner?.fullName})
                    </td>
                    <td className="px-4 py-3">{contract.jockey?.user?.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        contract.status === 'DISSOLVED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {contract.startDate} to {contract.endDate}
                    </td>
                    <td className="px-4 py-3">
                      {canDissolve && (
                        <button 
                          onClick={() => handleDissolve(contract.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Dissolve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PairingContractsPage;
