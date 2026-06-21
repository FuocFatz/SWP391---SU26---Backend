import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiArrowLeft, FiClock, FiUsers, FiAward, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import './RaceDetailPage.css';

function RaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [placingPrediction, setPlacingPrediction] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch race details
        const raceData = await api.getRaceById(id);
        setRace(raceData);

        // Fetch race registrations
        const regsData = await api.getRaceRegistrations(id);
        setRegistrations(Array.isArray(regsData) ? regsData : []);

        // Fetch predictions for this race
        const predsData = await api.getPredictions({ raceId: id });
        setPredictions(Array.isArray(predsData) ? predsData : []);

        setError('');
      } catch (err) {
        console.error('Failed to fetch race data:', err);
        setError('Failed to load race details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePlacePrediction = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to place a prediction');
      return;
    }

    if (!selectedHorseId) {
      setPredictionMessage('Please select a horse');
      return;
    }

    try {
      setPlacingPrediction(true);
      setPredictionMessage('');

      const prediction = {
        raceId: parseInt(id),
        spectatorId: user.id,
        predictedHorseId: parseInt(selectedHorseId),
      };

      await api.placePrediction(prediction);
      setPredictionMessage('✓ Prediction placed successfully!');
      setSelectedHorseId('');

      // Refresh predictions
      const updatedPreds = await api.getPredictions({ raceId: id });
      setPredictions(Array.isArray(updatedPreds) ? updatedPreds : []);
    } catch (err) {
      setPredictionMessage(`✗ ${err.message || 'Failed to place prediction'}`);
    } finally {
      setPlacingPrediction(false);
    }
  };

  if (loading) {
    return (
      <div className="race-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
          Loading race details...
        </div>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="race-detail-page">
        <div className="container">
          <Link to="/races" className="race-detail-back">
            <FiArrowLeft /> Back to Races
          </Link>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c00' }}>
            {error || 'Race not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="race-detail-page" id="race-detail-page">
      <div className="container">
        <Link to="/races" className="race-detail-back">
          <FiArrowLeft /> Back to Races
        </Link>

        <div className="race-detail-header">
          <div className="race-detail-header-left">
            <span className={`race-card-type-badge type-${race.type?.toLowerCase() || 'sprint'}`}>
              {race.type || 'Race'}
            </span>
            <h1 className="race-detail-name">{race.name}</h1>
            <div className="race-detail-meta">
              <span><FiClock /> {race.raceDate} · {race.raceTime}</span>
              <span><FiMapPin /> {race.distanceM}m · {race.surface}</span>
              <span><FiUsers /> {registrations.length} Participants</span>
              <span style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', borderRadius: '0.25rem', fontSize: '0.9em' }}>
                Status: {race.status}
              </span>
            </div>
          </div>
          <div className="race-detail-prize-box">
            <span className="race-detail-prize-label">Prize Pool</span>
            <span className="race-detail-prize-value">{race.prizePool?.toLocaleString() || '0'} VND</span>
            <div className="race-detail-prize-split">
              <span> 60% ·  30% ·  10%</span>
            </div>
          </div>
        </div>

        {/* Live Race Track */}
        {race.status === 'IN_PROGRESS' && (
          <div className="race-detail-live-section">
            <RaceTrack
              horses={registrations.map(reg => ({
                id: reg.horseId,
                name: reg.horse?.name || `Horse ${reg.horseId}`,
                jockey: reg.jockey?.fullName || 'Unknown',
                color: ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C'][
                  registrations.indexOf(reg) % 6
                ],
              }))}
              duration={67}
              isLive={true}
            />
          </div>
        )}

        {/* Prediction Form for Spectators */}
        {['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'DRAFT'].includes(race.status) && user?.role === 'SPECTATOR' && (
          <div style={{
            backgroundColor: '#f9f9f9',
            border: '1px solid #ddd',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Place Your Prediction</h2>
            {predictionMessage && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: predictionMessage.includes('✓') ? '#efe' : '#fee',
                color: predictionMessage.includes('✓') ? '#070' : '#c00',
                borderRadius: '0.25rem',
              }}>
                {predictionMessage}
              </div>
            )}
            <form onSubmit={handlePlacePrediction}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Select Horse:
                </label>
                <select
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '0.25rem',
                    fontSize: '1rem',
                  }}
                  disabled={placingPrediction}
                >
                  <option value="">-- Select a horse --</option>
                  {registrations.map(reg => (
                    <option key={reg.id} value={reg.horseId}>
                      {reg.horse?.name || `Horse ${reg.horseId}`} (Jockey: {reg.jockey?.fullName || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={placingPrediction || !selectedHorseId}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#C0392B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  opacity: (placingPrediction || !selectedHorseId) ? 0.5 : 1,
                }}
              >
                {placingPrediction ? 'Placing...' : 'Place Prediction'}
              </button>
            </form>
          </div>
        )}

        {['STANDBY', 'IN_PROGRESS', 'COMPLETED', 'OFFICIAL'].includes(race.status) && user?.role === 'SPECTATOR' && (
          <div style={{
            backgroundColor: '#f9f9f9',
            border: '1px solid #ddd',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#666' }}>
              ℹ️ Predictions are locked for this race (Status: {race.status})
            </h2>
          </div>
        )}

        {/* Participants */}
        <div className="race-detail-participants">
          <h2 className="race-detail-section-title">Participants</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Horse</th>
                  <th>Jockey</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, i) => (
                  <tr key={reg.id}>
                    <td>
                      <span
                        className="race-detail-color-dot"
                        style={{
                          backgroundColor: ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C'][
                            i % 6
                          ],
                        }}
                      />
                      {i + 1}
                    </td>
                    <td><span className="leaderboard-horse-name">{reg.horse?.name || 'Unknown'}</span></td>
                    <td>{reg.jockey?.fullName || 'Unknown'}</td>
                    <td>{reg.owner?.fullName || 'Unknown'}</td>
                    <td><span className="badge badge-green">{reg.status || 'Confirmed'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Predictions Stats */}
        {predictions.length > 0 && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '0.5rem' }}>
            <h3>Predictions: {predictions.length} spectators have placed guesses</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default RaceDetailPage;
