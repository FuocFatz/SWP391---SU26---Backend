import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './TestEndpointsPage.css';

function TestEndpointsPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (name, success, message, data = null) => {
    setTestResults(prev => [...prev, { name, success, message, data, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testGetRaces = async () => {
    try {
      setLoading(true);
      const data = await api.getRaces();
      addResult('GET /races', true, `Found ${data.length} races`, data);
    } catch (err) {
      addResult('GET /races', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetNotifications = async () => {
    if (!user?.id) {
      addResult('GET /notifications', false, 'Not logged in');
      return;
    }
    try {
      setLoading(true);
      const data = await api.getNotifications(user.id);
      addResult('GET /notifications', true, `Found ${data.length} notifications`, data);
    } catch (err) {
      addResult('GET /notifications', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPasswordResetRequest = async () => {
    try {
      setLoading(true);
      const data = await api.requestPasswordReset('test@example.com');
      addResult('POST /auth/password-reset/request', true, 'Reset link sent', data);
    } catch (err) {
      addResult('POST /auth/password-reset/request', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPlacePrediction = async () => {
    if (!user?.id) {
      addResult('POST /predictions', false, 'Not logged in or not spectator');
      return;
    }
    try {
      setLoading(true);
      const prediction = {
        raceId: 1,
        spectatorId: user.id,
        predictedHorseId: 1,
      };
      const data = await api.placePrediction(prediction);
      addResult('POST /predictions', true, 'Prediction placed', data);
    } catch (err) {
      addResult('POST /predictions', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetRaceById = async () => {
    try {
      setLoading(true);
      const data = await api.getRaceById(1);
      addResult('GET /races/{id}', true, `Race: ${data.name || 'Unknown'}`, data);
    } catch (err) {
      addResult('GET /races/{id}', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetRaceRegistrations = async () => {
    try {
      setLoading(true);
      const data = await api.getRaceRegistrations(1);
      addResult('GET /races/{id}/registrations', true, `Found ${data.length} registrations`, data);
    } catch (err) {
      addResult('GET /races/{id}/registrations', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetPredictions = async () => {
    try {
      setLoading(true);
      const data = await api.getPredictions({ raceId: 1 });
      addResult('GET /predictions', true, `Found ${data.length} predictions`, data);
    } catch (err) {
      addResult('GET /predictions', false, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-endpoints-page">
      <div className="container">
        <div className="test-header">
          <h1> API Test Console</h1>
          <p>Test backend endpoints to verify business logic implementation</p>
        </div>

        <div className="test-user-info">
          {user ? (
            <>
              <strong>Logged in as:</strong> {user.name} ({user.role})
            </>
          ) : (
            <strong style={{ color: '#c00' }}>Not logged in</strong>
          )}
        </div>

        <div className="test-buttons">
          <button onClick={testGetRaces} disabled={loading} className="test-btn">
            1️⃣ Test GET /races
          </button>
          <button onClick={testGetRaceById} disabled={loading} className="test-btn">
            2️⃣ Test GET /races/1
          </button>
          <button onClick={testGetRaceRegistrations} disabled={loading} className="test-btn">
            3️⃣ Test GET /races/1/registrations
          </button>
          <button onClick={testGetPredictions} disabled={loading} className="test-btn">
            4️⃣ Test GET /predictions
          </button>
          <button onClick={testGetNotifications} disabled={loading} className="test-btn">
            5️⃣ Test GET /notifications
          </button>
          <button onClick={testPasswordResetRequest} disabled={loading} className="test-btn">
            6️⃣ Test POST /password-reset/request
          </button>
          <button onClick={testPlacePrediction} disabled={loading} className="test-btn">
            7️⃣ Test POST /predictions
          </button>
          <button onClick={clearResults} disabled={loading} className="test-btn btn-danger">
            ️ Clear Results
          </button>
        </div>

        <div className="test-results">
          <h2>Test Results ({testResults.length})</h2>
          {testResults.length === 0 ? (
            <div className="test-empty">Click a button above to start testing endpoints...</div>
          ) : (
            <div className="test-results-list">
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`test-result ${result.success ? 'success' : 'error'}`}
                >
                  <div className="test-result-header">
                    <span className={`test-result-icon ${result.success ? 'success' : 'error'}`}>
                      {result.success ? '✓' : '✗'}
                    </span>
                    <span className="test-result-name">{result.name}</span>
                    <span className="test-result-time">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="test-result-message">{result.message}</div>
                  {result.data && (
                    <div className="test-result-data">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestEndpointsPage;
