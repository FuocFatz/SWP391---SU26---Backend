import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiUsers, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../contexts/useAuth';
import { api, resolveAssetUrl } from '../services/api';
import { subscribeRaceRealtime } from '../services/raceRealtime';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { translateText } from '../utils/vietnameseLocalization';
import './RaceDetailPage.css';

const colors = ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C'];
const guessOpenStatuses = new Set(['REGISTRATION_OPEN', 'REGISTRATION_CLOSED']);

function RaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [race, setRace] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [results, setResults] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [wagerPoints, setWagerPoints] = useState(10);
  const [pointBalance, setPointBalance] = useState(Number(user?.rewardPoints || 0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placingPrediction, setPlacingPrediction] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState('');
  const [predictionMessageType, setPredictionMessageType] = useState('success');
  const [liveSimulation, setLiveSimulation] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [raceData, entries, raceResults] = await Promise.all([api.getRaceById(id), api.getRaceRegistrations(id), api.getResults(id)]);
        if (!active) return;
        setRace(raceData);
        setRegistrations(Array.isArray(entries) ? entries : []);
        setResults(Array.isArray(raceResults) ? raceResults : []);
        if (['SPECTATOR', 'ADMIN'].includes(user?.role)) {
          const guesses = await api.getPredictions({ raceId: id });
          if (active) setPredictions(Array.isArray(guesses) ? guesses : []);
          if (user?.role === 'SPECTATOR') {
            const profile = await api.getMe();
            if (active) setPointBalance(Number(profile?.rewardPoints || 0));
          }
        } else {
          setPredictions([]);
        }
        setError('');
      } catch (err) {
        if (active) setError(translateText(err.message || 'Không thể tải chi tiết cuộc đua'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, user?.role]);

  useEffect(() => subscribeRaceRealtime((event) => {
    const payload = event?.payload;
    if (event?.type === 'RACE_STATE' && Number(payload?.id) === Number(id)) {
      setRace(payload);
      if (payload.status !== 'IN_PROGRESS') setLiveSimulation(null);
      if (['COMPLETED', 'REPORT_READY', 'REVISION_REQUIRED', 'OFFICIAL'].includes(payload.status)) {
        api.getResults(id).then((raceResults) => setResults(Array.isArray(raceResults) ? raceResults : [])).catch(() => {});
      }
    }
    if (event?.type === 'RACE_SIMULATION' && Number(payload?.raceId) === Number(id)) {
      setLiveSimulation(payload);
    }
  }, setRealtimeStatus), [id]);

  const handlePlacePrediction = async (event) => {
    event.preventDefault();
    if (!selectedHorseId || wagerPoints < 1) {
      setPredictionMessageType('warning');
      setPredictionMessage('Vui lòng chọn một ngựa.');
      return;
    }
    const selectedEntry = registrations.find((entry) => Number(entry.horseId) === Number(selectedHorseId));
    if (!window.confirm(`Lưu dự đoán cho ${selectedEntry?.horseName || 'ngựa này'} với ${wagerPoints} point? Bạn chỉ có thể thay đổi trước trạng thái Chờ xuất phát.`)) {
      return;
    }
    try {
      setPlacingPrediction(true);
      setPredictionMessage('');
      await api.createPrediction(id, { predictedHorseId: Number(selectedHorseId), wagerPoints });
      const guesses = await api.getPredictions({ raceId: id });
      const profile = await api.getMe();
      setPredictions(Array.isArray(guesses) ? guesses : []);
      setPointBalance(Number(profile?.rewardPoints || 0));
      setSelectedHorseId('');
      setPredictionMessageType('success');
      setPredictionMessage('Đã lưu dự đoán.');
    } catch (err) {
      setPredictionMessageType('error');
      setPredictionMessage(translateText(err.message || 'Không thể lưu dự đoán.'));
    } finally {
      setPlacingPrediction(false);
    }
  };

  if (loading) return <div className="race-detail-page"><div className="container page-state">Đang tải chi tiết cuộc đua...</div></div>;
  if (error || !race) return <div className="race-detail-page"><div className="container"><Link to="/races" className="race-detail-back"><FiArrowLeft /> Quay lại danh sách cuộc đua</Link><div className="page-state error">{error || 'Không tìm thấy cuộc đua'}</div></div></div>;

  const guessesLocked = !guessOpenStatuses.has(race.status);
  const currentPrediction = predictions.find((prediction) => Number(prediction.raceId) === Number(id));
  const availablePoints = pointBalance + Number(currentPrediction?.wagerPoints || 0);

  return (
    <div className="race-detail-page" id="race-detail-page">
      <div className="container">
        <Link to="/races" className="race-detail-back"><FiArrowLeft /> Quay lại danh sách cuộc đua</Link>
        <div className="race-detail-header">
          <div className="race-detail-header-left">
            <span className={`race-card-type-badge type-${String(race.type || 'sprint').toLowerCase()}`}>{translateText(race.type || 'Cuộc đua')}</span>
            <h1 className="race-detail-name">{race.name}</h1>
            <div className="race-detail-meta">
              <span><FiClock /> {race.raceDate} · {String(race.raceTime || '').slice(0, 5)}</span>
              <span><FiMapPin /> {race.distanceM}m · {translateText(race.surface || 'Sân cỏ')}</span>
              <span><FiUsers /> {registrations.length} người tham gia</span>
              <span className="race-detail-status">{translateText(String(race.status || '').replaceAll('_', ' '))}</span>
            </div>
          </div>
          <div className="race-detail-prize-box">
            {Number(race.prizePool || 0) > 0 ? <>
              <span className="race-detail-prize-label">Tổng điểm thưởng</span>
              <span className="race-detail-prize-value">{Number(race.prizePool).toLocaleString()} point</span>
              <div className="race-detail-prize-split">60% · 30% · 10%</div>
            </> : <>
              <span className="race-detail-prize-label">Cuộc đua giao hữu</span>
              <span className="race-detail-prize-value">Không có điểm thưởng</span>
            </>}
          </div>
        </div>

        {race.status === 'CANCELLED' && (
          <div className="race-schedule-notice cancelled" role="status">
            <strong>Cuộc đua đã bị hủy</strong>
            <span>{race.cancellationReason || 'Quản trị viên đã hủy cuộc đua này.'}</span>
          </div>
        )}

        {race.rescheduledAt && race.status !== 'CANCELLED' && (
          <div className="race-schedule-notice rescheduled">
            <strong>Lịch thi đấu đã cập nhật</strong>
            <span>{race.rescheduleReason || 'Ngày đua hoặc giờ bắt đầu đã thay đổi.'}</span>
          </div>
        )}

        {race.status === 'IN_PROGRESS' && registrations.length > 0 && (
          <div className="race-detail-live-section">
            <div className={`race-realtime-status ${realtimeStatus}`}>
              <span /> {realtimeStatus === 'connected' ? 'Đã kết nối thời gian trực tiếp' : 'Đang kết nối thời gian trực tiếp...'}
            </div>
            <RaceTrack
              horses={registrations.map((entry, index) => ({ id: entry.horseId, name: entry.horseName, jockey: entry.jockeyName, color: colors[index % colors.length] }))}
              duration={liveSimulation?.durationSeconds || 67}
              remainingSeconds={liveSimulation?.remainingSeconds}
              livePositions={liveSimulation?.lanes || []}
              isLive
            />
          </div>
        )}

        {user?.role === 'SPECTATOR' && (
          <section className="race-prediction-panel">
            <h2>{guessesLocked ? 'Dự đoán đã bị khóa' : 'Đặt dự đoán của bạn'}</h2>
            <p>{guessesLocked ? `Cuộc đua hiện ở trạng thái ${translateText(String(race.status).replaceAll('_', ' '))}.` : 'Chọn một cặp ngựa–nài ngựa đã đăng ký. Lưu lại sẽ cập nhật dự đoán hiện có.'}</p>
            {!guessesLocked && (
              <form onSubmit={handlePlacePrediction} className="race-prediction-form">
                <label className="form-field">
                  <span className="form-field-label">Cặp ngựa–nài ngựa</span>
                  <select className="form-select" value={selectedHorseId} onChange={(event) => setSelectedHorseId(event.target.value)} disabled={placingPrediction}>
                    <option value="">Chọn một cặp ngựa–nài ngựa</option>
                    {registrations.filter((entry) => entry.status !== 'WITHDRAWN').map((entry) => <option key={entry.id} value={entry.horseId}>{entry.horseName} — {entry.jockeyName}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-field-label">Point dự đoán ({pointBalance.toLocaleString()} khả dụng)</span>
                  <input className="form-input" type="number" min="1" max={Math.max(availablePoints, 1)} value={wagerPoints}
                    onChange={(event) => setWagerPoints(Number(event.target.value))} disabled={placingPrediction} required />
                </label>
                <button type="submit" className="btn btn-primary" disabled={placingPrediction || !selectedHorseId || wagerPoints < 1 || wagerPoints > availablePoints}>{placingPrediction ? 'Đang lưu...' : 'Lưu dự đoán'}</button>
              </form>
            )}
            <ToastNotification message={predictionMessage} type={predictionMessageType} onDismiss={() => setPredictionMessage('')} />
            {predictions.length > 0 && <p className="race-prediction-count">Số dự đoán đã lưu của tài khoản: {predictions.length}</p>}
          </section>
        )}

        {results.length > 0 && <section className="race-detail-participants">
          <h2 className="race-detail-section-title">Kết quả cuộc đua</h2>
          <div className={`race-schedule-notice ${results.every((result) => result.official) ? 'rescheduled' : ''}`} role="status">
            <strong>{results.every((result) => result.official) ? 'Kết quả chính thức' : 'Kết quả tạm thời'}</strong>
            <span>{results.every((result) => result.official) ? 'Quản trị viên đã xác nhận; bảng xếp hạng và phần thưởng đã được cập nhật.' : 'Chỉ hiển thị để xem xét. Điểm xếp hạng, giải thưởng và thưởng dự đoán chưa được trao.'}</span>
          </div>
          <div className="table-container"><table className="data-table"><thead><tr><th>Vị trí</th><th>Ngựa</th><th>Nài ngựa</th><th>Thời gian</th><th>Trạng thái</th></tr></thead><tbody>
            {results.map((result) => {
              const entry = registrations.find((item) => Number(item.id) === Number(result.registrationId));
              return <tr key={result.id}><td>{result.dnf ? 'Không về đích' : `#${result.finishPosition}`}</td><td>{entry?.horseName || `Ngựa #${result.horseId}`}</td><td>{entry?.jockeyName || `Nài ngựa #${result.jockeyId}`}</td><td>{result.finishTimeSeconds ?? '-'} giây</td><td><span className={`badge ${result.official ? 'badge-green' : 'badge-yellow'}`}>{result.disqualified ? 'Bị loại' : result.official ? 'Chính thức' : 'Tạm thời'}</span></td></tr>;
            })}
          </tbody></table></div>
        </section>}

        <div className="race-detail-participants">
          <h2 className="race-detail-section-title">Người tham gia</h2>
          <div className="table-container"><table className="data-table"><thead><tr><th>Làn đua</th><th>Ngựa</th><th>Nài ngựa</th><th>Chủ ngựa</th><th>Trạng thái</th></tr></thead><tbody>
            {registrations.map((entry, index) => <tr key={entry.id}><td><span className="race-detail-color-dot" style={{ backgroundColor: colors[index % colors.length] }} />{entry.laneNumber || index + 1}</td><td>{entry.horseImageUrl && <img className="race-detail-horse-thumb" src={resolveAssetUrl(entry.horseImageUrl)} alt="" />}<span className="leaderboard-horse-name">{entry.horseName}</span></td><td>{entry.jockeyName}</td><td>{entry.ownerName}</td><td><span className="badge badge-green">{translateText(String(entry.status || 'PENDING').replaceAll('_', ' '))}</span></td></tr>)}
            {!registrations.length && <tr><td colSpan="5">Chưa có người tham gia đăng ký.</td></tr>}
          </tbody></table></div>
        </div>
      </div>
    </div>
  );
}

export default RaceDetailPage;
