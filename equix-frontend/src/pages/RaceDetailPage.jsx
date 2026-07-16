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
  const [notes, setNotes] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [wagerPoints, setWagerPoints] = useState(10);
  const [placingPrediction, setPlacingPrediction] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState('');

  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch race details
        const raceData = await api.getRaceById(id);
        setRace(raceData);

        // Fetch race registrations, users, and horses to map references
        const [regsData, users, horses] = await Promise.all([
          api.getRaceRegistrations(id).catch(() => []),
          api.getUsers().catch(() => []),
          api.getHorses().catch(() => [])
        ]);
        
        const mappedRegs = (Array.isArray(regsData) ? regsData : []).map(reg => ({
          ...reg,
          horse: horses.find(h => h.id === reg.horseId),
          jockey: users.find(u => u.id === reg.jockeyId),
          owner: users.find(u => u.id === reg.ownerId)
        }));

        setRegistrations(mappedRegs);

        // Fetch predictions for this race
        const predsData = await api.getPredictions({ raceId: id });
        setPredictions(Array.isArray(predsData) ? predsData : []);

        // Fetch notes
        if (raceData.status === 'COMPLETED' || raceData.status === 'OFFICIAL' || user?.role === 'REFEREE') {
          const notesData = await api.getRaceNotes(id).catch(() => []);
          setNotes(Array.isArray(notesData) ? notesData : []);
        }

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

    if (wagerPoints <= 0) {
      setPredictionMessage('Wager points must be greater than 0');
      return;
    }

    try {
      setPlacingPrediction(true);
      setPredictionMessage('');

      const prediction = {
        raceId: parseInt(id),
        spectatorId: user.id,
        predictedHorseId: parseInt(selectedHorseId),
        wagerPoints: parseInt(wagerPoints),
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

  const handlePostNote = async (e) => {
    e.preventDefault();
    if (!noteContent) return;
    try {
      setSavingNote(true);
      await api.createRaceNote({
        race: { id: parseInt(id) },
        referee: { id: user.id },
        content: noteContent
      });
      setNoteContent('');
      const notesData = await api.getRaceNotes(id).catch(() => []);
      setNotes(Array.isArray(notesData) ? notesData : []);
      alert('Note added successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingNote(false);
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
            <span className="race-detail-prize-value">{race.prizePool?.toLocaleString() || '0'} Points</span>
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
                name: reg.horse?.name || reg.horseProfile?.name || reg.horseName || `Horse ${reg.horseId}`,
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
            backgroundColor: '#141414',
            border: '1px solid #2d2d2d',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            color: '#fff',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Place Your Prediction</h2>
            {predictionMessage && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: predictionMessage.includes('✓') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                color: predictionMessage.includes('✓') ? '#4ade80' : '#f87171',
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
                    border: '1px solid #2d2d2d',
                    borderRadius: '0.25rem',
                    fontSize: '1rem',
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                  }}
                  disabled={placingPrediction}
                >
                  <option value="">-- Select a horse --</option>
                  {registrations.map(reg => (
                    <option key={reg.id} value={reg.horseId}>
                      {reg.horse?.name || reg.horseProfile?.name || reg.horseName || `Horse ${reg.horseId}`} (Jockey: {reg.jockey?.fullName || 'Unknown'})
                    </option>
                  ))}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Wager Points:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={wagerPoints}
                    onChange={(e) => setWagerPoints(e.target.value)}
                    disabled={placingPrediction}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #2d2d2d',
                      borderRadius: '0.25rem',
                      fontSize: '1rem',
                      backgroundColor: '#1e1e1e',
                      color: '#fff',
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={placingPrediction || !selectedHorseId || wagerPoints <= 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#C0392B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    opacity: (placingPrediction || !selectedHorseId || wagerPoints <= 0) ? 0.5 : 1,
                  }}
                >
                {placingPrediction ? 'Placing...' : 'Place Prediction'}
              </button>
            </form>
          </div>
        )}

        {['STANDBY', 'IN_PROGRESS', 'COMPLETED', 'OFFICIAL'].includes(race.status) && user?.role === 'SPECTATOR' && (
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #2d2d2d',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            color: '#fff',
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#a0a0a0' }}>
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
                    <td><span className="leaderboard-horse-name">{reg.horse?.name || reg.horseProfile?.name || reg.horseName || 'Unknown'}</span></td>
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
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#141414', border: '1px solid #2d2d2d', borderRadius: '0.5rem' }}>
            <h3 style={{ color: '#fff' }}>Predictions: {predictions.length} spectators have placed guesses</h3>
          </div>
        )}

        {/* Race Notes */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#141414', borderRadius: '0.5rem', border: '1px solid #2d2d2d' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' }}>Race Notes</h2>
          {notes.length === 0 ? (
            <p style={{ color: '#a0a0a0' }}>No notes have been added to this race.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {notes.map(note => (
                <div key={note.id} style={{ padding: '1rem', backgroundColor: '#1e1e1e', borderRadius: '0.25rem', borderLeft: '4px solid #4f46e5' }}>
                  <p style={{ margin: 0, color: '#e0e0e0' }}>{note.content}</p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#a0a0a0' }}>
                    By Referee {note.referee?.fullName || 'Unknown'} on {new Date(note.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {user?.role === 'REFEREE' && (
            <form onSubmit={handlePostNote} style={{ marginTop: '1.5rem', borderTop: '1px solid #2d2d2d', paddingTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#fff' }}>Add Note</label>
              <textarea 
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                required
                rows={3}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #2d2d2d', borderRadius: '0.25rem', marginBottom: '1rem', backgroundColor: '#1e1e1e', color: '#fff' }}
                placeholder="Enter official race notes, infractions, or incidents..."
              />
              <button 
                type="submit" 
                disabled={savingNote}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                {savingNote ? 'Saving...' : 'Post Note'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default RaceDetailPage;
