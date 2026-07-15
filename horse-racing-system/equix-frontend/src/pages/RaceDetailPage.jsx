import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiUsers, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../contexts/useAuth';
import { api } from '../services/api';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import './RaceDetailPage.css';

const colors = ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C'];
const lockedStatuses = new Set(['STANDBY', 'IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'OFFICIAL', 'CANCELLED']);

function RaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [race, setRace] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placingPrediction, setPlacingPrediction] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [raceData, entries] = await Promise.all([api.getRaceById(id), api.getRaceRegistrations(id)]);
        if (!active) return;
        setRace(raceData);
        setRegistrations(Array.isArray(entries) ? entries : []);
        if (['SPECTATOR', 'ADMIN'].includes(user?.role)) {
          const guesses = await api.getPredictions({ raceId: id });
          if (active) setPredictions(Array.isArray(guesses) ? guesses : []);
        } else {
          setPredictions([]);
        }
        setError('');
      } catch (err) {
        if (active) setError(err.message || 'Failed to load race details');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, user?.role]);

  const handlePlacePrediction = async (event) => {
    event.preventDefault();
    if (!selectedHorseId) {
      setPredictionMessage('Please select a horse.');
      return;
    }
    try {
      setPlacingPrediction(true);
      setPredictionMessage('');
      await api.createPrediction(id, { predictedHorseId: Number(selectedHorseId) });
      const guesses = await api.getPredictions({ raceId: id });
      setPredictions(Array.isArray(guesses) ? guesses : []);
      setSelectedHorseId('');
      setPredictionMessage('Prediction saved successfully.');
    } catch (err) {
      setPredictionMessage(err.message || 'Failed to save prediction.');
    } finally {
      setPlacingPrediction(false);
    }
  };

  if (loading) return <div className="race-detail-page"><div className="container page-state">Loading race details...</div></div>;
  if (error || !race) return <div className="race-detail-page"><div className="container"><Link to="/races" className="race-detail-back"><FiArrowLeft /> Back to Races</Link><div className="page-state error">{error || 'Race not found'}</div></div></div>;

  const guessesLocked = lockedStatuses.has(race.status);

  return (
    <div className="race-detail-page" id="race-detail-page">
      <div className="container">
        <Link to="/races" className="race-detail-back"><FiArrowLeft /> Back to Races</Link>
        <div className="race-detail-header">
          <div className="race-detail-header-left">
            <span className={`race-card-type-badge type-${String(race.type || 'sprint').toLowerCase()}`}>{race.type || 'Race'}</span>
            <h1 className="race-detail-name">{race.name}</h1>
            <div className="race-detail-meta">
              <span><FiClock /> {race.raceDate} · {String(race.raceTime || '').slice(0, 5)}</span>
              <span><FiMapPin /> {race.distanceM}m · {race.surface || 'Turf'}</span>
              <span><FiUsers /> {registrations.length} participants</span>
              <span className="race-detail-status">{String(race.status || '').replaceAll('_', ' ')}</span>
            </div>
          </div>
          <div className="race-detail-prize-box"><span className="race-detail-prize-label">Prize Pool</span><span className="race-detail-prize-value">{Number(race.prizePool || 0).toLocaleString()} VND</span><div className="race-detail-prize-split">60% · 30% · 10%</div></div>
        </div>

        {race.status === 'IN_PROGRESS' && registrations.length > 0 && <div className="race-detail-live-section"><RaceTrack horses={registrations.map((entry, index) => ({ id: entry.horseId, name: entry.horseName, jockey: entry.jockeyName, color: colors[index % colors.length] }))} duration={67} isLive /></div>}

        {user?.role === 'SPECTATOR' && (
          <section className="race-prediction-panel">
            <h2>{guessesLocked ? 'Predictions are locked' : 'Place Your Prediction'}</h2>
            <p>{guessesLocked ? `This race is currently ${String(race.status).replaceAll('_', ' ')}.` : 'Choose one registered horse-jockey pair. Saving again updates your existing guess.'}</p>
            {!guessesLocked && <form onSubmit={handlePlacePrediction} className="race-prediction-form"><select className="form-select" value={selectedHorseId} onChange={(event) => setSelectedHorseId(event.target.value)} disabled={placingPrediction}><option value="">Select a horse-jockey pair</option>{registrations.filter((entry) => entry.status !== 'WITHDRAWN').map((entry) => <option key={entry.id} value={entry.horseId}>{entry.horseName} — {entry.jockeyName}</option>)}</select><button type="submit" className="btn btn-primary" disabled={placingPrediction || !selectedHorseId}>{placingPrediction ? 'Saving...' : 'Save Prediction'}</button></form>}
            {predictionMessage && <div className="dash-message">{predictionMessage}</div>}
            {predictions.length > 0 && <p className="race-prediction-count">Saved guesses for this account: {predictions.length}</p>}
          </section>
        )}

        <div className="race-detail-participants">
          <h2 className="race-detail-section-title">Participants</h2>
          <div className="table-container"><table className="data-table"><thead><tr><th>Lane</th><th>Horse</th><th>Jockey</th><th>Owner</th><th>Status</th></tr></thead><tbody>
            {registrations.map((entry, index) => <tr key={entry.id}><td><span className="race-detail-color-dot" style={{ backgroundColor: colors[index % colors.length] }} />{entry.laneNumber || index + 1}</td><td><span className="leaderboard-horse-name">{entry.horseName}</span></td><td>{entry.jockeyName}</td><td>{entry.ownerName}</td><td><span className="badge badge-green">{String(entry.status || 'PENDING').replaceAll('_', ' ')}</span></td></tr>)}
            {!registrations.length && <tr><td colSpan="5">No registered participants yet.</td></tr>}
          </tbody></table></div>
        </div>
      </div>
    </div>
  );
}

export default RaceDetailPage;
