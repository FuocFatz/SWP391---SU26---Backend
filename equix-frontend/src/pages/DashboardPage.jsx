import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiCheckCircle,
  FiFlag,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiXCircle,
  FiX,
  FiZap,
  FiAlertOctagon,
  FiSend,
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import StatCard from '../components/StatCard/StatCard';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import { api } from '../services/api';
import './DashboardPage.css';

const colors = ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'];
const RACE_STATUSES = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'STANDBY', 'IN_PROGRESS', 'REPORT_READY', 'OFFICIAL', 'COMPLETED', 'CANCELLED'];

function statusLabel(status) {
  const labels = {
    REGISTRATION_OPEN: 'Registration Open',
    PENDING_ADMIN: 'Pending Admin',
    APPROVED: 'Approved',
    READY_FOR_CHECK: 'Ready For Check',
    CLEARED_TO_RACE: 'Cleared To Race',
    REJECTED_BY_REFEREE: 'Rejected',
    JOCKEY_DECLINED: 'Jockey Declined',
    WITHDRAWN: 'Withdrawn',
    IN_PROGRESS: 'In Progress',
    OFFICIAL: 'Official',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    WON: 'Won',
    LOST: 'Lost',
  };
  return labels[status] || status || 'Unknown';
}

function money(value) {
  return Number(value || 0).toLocaleString();
}

function shortTime(value) {
  return value ? String(value).slice(0, 5) : '--:--';
}

function byId(items, id) {
  return items.find((item) => Number(item.id) === Number(id));
}

function nameOf(items, id, key, fallback) {
  return byId(items, id)?.[key] || fallback;
}

function DashboardPage() {
  const { user, currentRole } = useAuth();
  const [data, setData] = useState({ users: [], jockeys: [], races: [], horses: [], registrations: [], invitations: [], predictions: [], horseLeaderboard: [], jockeyLeaderboard: [], tournaments: [], referees: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState(1);
  const [selectedHorseByRace, setSelectedHorseByRace] = useState({});
  const [selectedJockeyByRegistration, setSelectedJockeyByRegistration] = useState({});
  const [simulation, setSimulation] = useState(null);
  const [horseForm, setHorseForm] = useState({ horseName: '', breed: 'Thoroughbred', age: 4, speed: 80, stamina: 80, gender: '' });
  const [predictionForm, setPredictionForm] = useState({ raceId: 1, predictedHorseId: 1, wagerPoints: 10 });

  const userId = user?.id || 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getUsers(),
        api.getUsersByRole('JOCKEY'),
        api.getRaces(),
        user?.role === 'HORSE_OWNER' ? api.getHorsesByOwner() : api.getHorses(),
        api.getRegistrations(),
        api.getInvitations(user?.role === 'JOCKEY' ? { myInvitations: true } : {}),
        api.getPredictions(user?.role === 'SPECTATOR' ? { spectatorId: userId } : {}),
        api.getHorseLeaderboard(),
        api.getJockeyLeaderboard(),
        api.getTournaments(),
        api.getUsersByRole('REFEREE'),
      ]);

      const [
        usersRes,
        jockeysRes,
        racesRes,
        horsesRes,
        registrationsRes,
        invitationsRes,
        predictionsRes,
        horseLeaderboardRes,
        jockeyLeaderboardRes,
        tournamentsRes,
        refereesRes,
      ] = results;

      const users = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const jockeys = jockeysRes.status === 'fulfilled' ? jockeysRes.value : [];
      const races = racesRes.status === 'fulfilled' ? racesRes.value : [];
      const horses = horsesRes.status === 'fulfilled' ? horsesRes.value : [];
      const registrations = registrationsRes.status === 'fulfilled' ? registrationsRes.value : [];
      const invitations = invitationsRes.status === 'fulfilled' ? invitationsRes.value : [];
      const predictions = predictionsRes.status === 'fulfilled' ? predictionsRes.value : [];
      const horseLeaderboard = horseLeaderboardRes.status === 'fulfilled' ? horseLeaderboardRes.value : [];
      const jockeyLeaderboard = jockeyLeaderboardRes.status === 'fulfilled' ? jockeyLeaderboardRes.value : [];
      const tournaments = tournamentsRes.status === 'fulfilled' ? tournamentsRes.value : [];
      const referees = refereesRes.status === 'fulfilled' ? refereesRes.value : [];

      const flatInvitations = invitations.map(inv => ({
        ...inv,
        raceId: inv.raceId || inv.race?.id,
        horseId: inv.horseId || inv.horse?.id,
        ownerId: inv.ownerId || inv.owner?.id,
        jockeyId: inv.jockeyId || inv.jockey?.id,
      }));

      setData({
        users,
        jockeys,
        races,
        horses,
        registrations,
        invitations: flatInvitations,
        predictions,
        horseLeaderboard,
        jockeyLeaderboard,
        tournaments,
        referees,
      });
      if (races.length && !races.some((race) => Number(race.id) === Number(selectedRaceId))) {
        setSelectedRaceId(races[0].id);
        setPredictionForm((form) => ({ ...form, raceId: races[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, userId]);

  const selectedRace = useMemo(
    () => byId(data.races, selectedRaceId) || data.races[0],
    [data.races, selectedRaceId],
  );

  const ownerHorses = user?.role === 'HORSE_OWNER' ? data.horses : data.horses.filter((horse) => Number(horse.ownerId) === Number(userId));
  const ownerRegistrations = data.registrations.filter((registration) => Number(registration.ownerId) === Number(userId));
  const jockeyInvitations = data.invitations.filter((invitation) => Number(invitation.jockeyId) === Number(userId));
  const jockeyAssignments = data.registrations.filter((registration) => Number(registration.jockeyId) === Number(userId));
  const selectedRaceRegistrations = data.registrations.filter((registration) => Number(registration.raceId) === Number(selectedRace?.id));
  const pendingAdminRegistrations = data.registrations.filter((registration) => registration.status === 'PENDING_ADMIN');
  const checkableRegistrations = data.registrations.filter((registration) => ['READY_FOR_CHECK', 'CLEARED_TO_RACE', 'APPROVED'].includes(registration.status));

  const execute = async (label, action) => {
    setMessage('');
    try {
      await action();
      setMessage(`${label} completed`);
      await loadData();
      return true;
    } catch (err) {
      let friendlyMessage = err.message || `${label} failed`;
      if (friendlyMessage.includes('uk_rr_race_jockey') || friendlyMessage.includes('duplicate key in object') || friendlyMessage.includes('Jockey already registered')) {
        friendlyMessage = 'This jockey is already registered for this race.';
      } else if (friendlyMessage.includes('uk_rr_race_horse') || friendlyMessage.includes('Horse already registered')) {
        friendlyMessage = 'This horse is already registered for this race.';
      } else if (friendlyMessage.includes('could not execute statement')) {
        friendlyMessage = 'A database error occurred. Please check your inputs.';
      }
      setMessage(friendlyMessage);
      return false;
    }
  };

  const handleCreateHorse = (event) => {
    event.preventDefault();
    if (!horseForm.gender) {
      setMessage('Please select a gender for the horse.');
      return;
    }
    execute(
      'Create horse',
      () => api.createHorse({
        ...horseForm,
        ownerId: userId,
        healthStatus: 'HEALTHY',
      })
    );
    setHorseForm({ horseName: '', breed: 'Thoroughbred', age: 4, speed: 80, stamina: 80, gender: '' });
  };

  const [selectedJockeyByRaceRegistration, setSelectedJockeyByRaceRegistration] = useState({});

  const handleRegisterHorse = (raceId, fallbackHorseId, fallbackJockeyId) => {
    const horseId = selectedHorseByRace[raceId] || fallbackHorseId;
    const jockeyId = selectedJockeyByRaceRegistration[raceId] || fallbackJockeyId;

    if (!horseId) {
      setMessage('No available horse to register.');
      return;
    }
    if (!jockeyId) {
      setMessage('No available jockey to register.');
      return;
    }

    execute(
      'Race registration',
      () => api.registerHorse({ raceId, horseId, ownerId: userId, jockeyId })
    );
  };

  const handleInviteJockey = (registration) => {
    const jockeyId = selectedJockeyByRegistration[registration.id] || data.jockeys[0]?.id;
    if (!jockeyId) {
      setMessage('No jockey account available');
      return;
    }

    execute(
      'Jockey invitation',
      () => api.inviteJockey({
        raceId: registration.raceId,
        horseId: registration.horseId,
        ownerId: registration.ownerId,
        jockeyId,
        message: `Invitation for ${nameOf(data.horses, registration.horseId, 'horseName', 'horse')}`,
      })
    );
  };

  const handleUpdateRaceStatus = (raceId, newStatus, reason) => {
    execute(
      'Update race status',
      () => api.updateRaceStatus(raceId, newStatus, reason)
    );
  };

  const handleCreateRace = async (payload) => {
    return await execute('Create race', () => api.createRace(payload));
  };

  const handleInvitationDecision = (invitation, status) => {
    execute(
      `${status === 'ACCEPTED' ? 'Accept' : 'Decline'} invitation`,
      () => api.respondInvitation(invitation.id, { status })
    );
  };

  const handleRegistrationPatch = (label, registrationId, action, patch) => {
    execute(
      label,
      action
    );
  };

  const handleSimulate = () => {
    if (!selectedRace) return;


    execute(
      'Race simulation',
      async () => {
        const response = await api.simulateRace(selectedRace.id, 60);
        setSimulation(response);
      },
    );
  };

  const handleConfirmResults = () => {
    if (!selectedRace) return;
    const runners = selectedRaceRegistrations.filter((item) => !['WITHDRAWN', 'REJECTED_BY_REFEREE'].includes(item.status));
    if (!runners.length) {
      setMessage('No runners available for result confirmation');
      return;
    }

    const ordered = simulation?.lanes?.length
      ? simulation.lanes.map((lane) => runners.find((item) => Number(item.id) === Number(lane.registrationId))).filter(Boolean)
      : runners;

    execute(
      'Confirm results',
      () => api.confirmResults({
        raceId: selectedRace.id,
        results: ordered.map((registration, index) => ({
          registrationId: registration.id,
          finishPosition: index + 1,
          finishTimeSeconds: Number((68 + index * 2.4).toFixed(2)),
          violationNotes: '',
        })),
      })
    );
  };

  const handlePrediction = (event) => {
    event.preventDefault();
    execute(
      'Prediction',
      () => api.createPrediction({ ...predictionForm, spectatorId: userId })
    );
  };

  const liveTrackHorses = selectedRaceRegistrations.map((registration, index) => ({
    id: registration.id,
    name: nameOf(data.horses, registration.horseId, 'horseName', `Horse #${registration.horseId}`),
    jockey: nameOf(data.users, registration.jockeyId, 'fullName', 'Unassigned'),
    color: colors[index % colors.length],
  }));

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="dash-header">
          <h1 className="dash-title">EquiX Dashboard</h1>
          <p className="dash-subtitle">Sign in or use quick login to open a role dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading && (!data.races || data.races.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" id="dashboard-page">
      <div className="dash-header dash-header-row">
        <div>
          <h1 className="dash-title">
            Welcome back, <span className="text-primary-color">{user.name || user.email}</span>
          </h1>
          <p className="dash-subtitle">
            {currentRole} workflow dashboard
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadData} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {message && (
        <div className="dash-message success">
          {message}
        </div>
      )}

      {currentRole === 'HORSE_OWNER' && (
        <OwnerDashboard
          data={data}
          userId={userId}
          ownerHorses={ownerHorses}
          ownerRegistrations={ownerRegistrations}
          horseForm={horseForm}
          setHorseForm={setHorseForm}
          selectedHorseByRace={selectedHorseByRace}
          setSelectedHorseByRace={setSelectedHorseByRace}
          selectedJockeyByRegistration={selectedJockeyByRegistration}
          setSelectedJockeyByRegistration={setSelectedJockeyByRegistration}
          selectedJockeyByRaceRegistration={selectedJockeyByRaceRegistration}
          setSelectedJockeyByRaceRegistration={setSelectedJockeyByRaceRegistration}
          onCreateHorse={handleCreateHorse}
          onRegisterHorse={handleRegisterHorse}
          onInviteJockey={handleInviteJockey}
          onConfirm={(id) => handleRegistrationPatch('Confirm registration', id, () => api.ownerConfirmRegistration(id), { ownerConfirmed: true })}
          onWithdraw={(id) => handleRegistrationPatch('Withdraw registration', id, () => api.withdrawRegistration(id, 'Horse or jockey unavailable'), { status: 'WITHDRAWN', withdrawReason: 'Horse or jockey unavailable' })}
        />
      )}

      {currentRole === 'ADMIN' && (
        <AdminDashboard
          data={data}
          pendingAdminRegistrations={pendingAdminRegistrations}
          onCreateRace={handleCreateRace}
          onApprove={(id) => handleRegistrationPatch('Approve registration', id, () => api.approveRegistration(id), { status: 'APPROVED' })}
          onUpdateRaceStatus={handleUpdateRaceStatus}
        />
      )}

      {currentRole === 'JOCKEY' && (
        <JockeyDashboard
          data={data}
          invitations={jockeyInvitations}
          assignments={jockeyAssignments}
          onDecision={handleInvitationDecision}
        />
      )}

      {currentRole === 'REFEREE' && (
        <RefereeDashboard
          data={data}
          selectedRace={selectedRace}
          selectedRaceId={selectedRaceId}
          setSelectedRaceId={setSelectedRaceId}
          selectedRaceRegistrations={selectedRaceRegistrations}
          checkableRegistrations={checkableRegistrations}
          liveTrackHorses={liveTrackHorses}
          simulation={simulation}
          onCreateRace={handleCreateRace}
          onCheck={(id, approved) => handleRegistrationPatch(
            approved ? 'Approve race check' : 'Reject race check',
            id,
            () => api.refereeCheck(id, { approved, healthCheckStatus: approved ? 'FIT' : 'NOT_FIT', notes: approved ? 'Ready to race' : 'Health check failed' }),
            { refereeApproved: approved, healthCheckStatus: approved ? 'FIT' : 'NOT_FIT', status: approved ? 'CLEARED_TO_RACE' : 'REJECTED_BY_REFEREE' },
          )}
          onStart={() => handleRegistrationPatch('Start race', selectedRace.id, () => api.startRace(selectedRace.id), {})}
          onSimulate={handleSimulate}
          onConfirmResults={handleConfirmResults}
        />
      )}

      {currentRole === 'SPECTATOR' && (
        <SpectatorDashboard
          data={data}
          predictionForm={predictionForm}
          setPredictionForm={setPredictionForm}
          onPrediction={handlePrediction}
        />
      )}
    </div>
  );
}

function OwnerDashboard({
  data,
  userId,
  ownerHorses,
  ownerRegistrations,
  horseForm,
  setHorseForm,
  selectedHorseByRace,
  setSelectedHorseByRace,
  selectedJockeyByRegistration,
  setSelectedJockeyByRegistration,
  selectedJockeyByRaceRegistration,
  setSelectedJockeyByRaceRegistration,
  onCreateHorse,
  onRegisterHorse,
  onInviteJockey,
  onConfirm,
  onWithdraw,
}) {
  const readyCount = ownerRegistrations.filter((item) => item.status === 'APPROVED' && item.ownerConfirmed && item.jockeyConfirmed && item.refereeApproved).length;

  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<GiHorseHead />} label="My Horses" value={ownerHorses.length} color="red" />
        <StatCard icon={<FiFlag />} label="Registrations" value={ownerRegistrations.length} color="green" />
        <StatCard icon={<GiHorseshoe />} label="Ready Pairings" value={readyCount} color="yellow" />
        <StatCard icon={<FiAward />} label="Reward Points" value={nameOf(data.users, userId, 'rewardPoints', 100)} />
      </div>

      <div className="workflow-grid two">
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Create Horse</h3>
            <FiPlus />
          </div>
          <form className="workflow-form" onSubmit={onCreateHorse}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input className="form-input" placeholder="Horse name" value={horseForm.horseName} onChange={(e) => setHorseForm({ ...horseForm, horseName: e.target.value })} required />
              <input className="form-input" placeholder="Breed" value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <select className="form-select md:col-span-2" value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value })} required>
                <option value="" disabled>Select Gender</option>
                <option value="STALLION">Stallion</option>
                <option value="MARE">Mare</option>
                <option value="GELDING">Gelding</option>
              </select>
              <input className="form-input" type="number" min="1" placeholder="Age" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
              <input className="form-input" type="number" min="1" max="100" placeholder="Speed" value={horseForm.speed} onChange={(e) => setHorseForm({ ...horseForm, speed: Number(e.target.value) })} />
            </div>
            <div className="mb-4">
              <input className="form-input w-full md:w-1/4" type="number" min="1" max="100" placeholder="Stamina" value={horseForm.stamina} onChange={(e) => setHorseForm({ ...horseForm, stamina: Number(e.target.value) })} />
            </div>
            <button className="btn btn-primary w-full md:w-auto" type="submit">Create Horse</button>
          </form>
        </section>

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>My Horses</h3>
            <GiHorseHead />
          </div>
          <CompactTable
            headers={['Horse', 'Breed', 'Health', 'Points']}
            rows={ownerHorses.map((horse) => [
              horse.horseName,
              horse.breed || '-',
              statusLabel(horse.healthStatus),
              horse.totalPoints || 0,
            ])}
            empty="No horses yet"
          />
        </section>
      </div>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Available Races</h3>
          <FiFlag />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Race</th>
                <th>Date</th>
                <th>Prize</th>
                <th>Horse</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.races.map((race) => {
                const registeredJockeyIds = data.registrations.filter(r => Number(r.raceId) === Number(race.id) && r.status !== 'WITHDRAWN' && r.status !== 'REJECTED_BY_REFEREE').map(r => Number(r.jockeyId));
                const availableJockeys = data.jockeys.filter(j => !registeredJockeyIds.includes(Number(j.id)));
                
                const registeredHorseIds = data.registrations.filter(r => Number(r.raceId) === Number(race.id) && r.status !== 'WITHDRAWN' && r.status !== 'REJECTED_BY_REFEREE').map(r => Number(r.horseId));
                const availableHorses = ownerHorses.filter(h => !registeredHorseIds.includes(Number(h.id)));

                return (
                <tr key={race.id}>
                  <td>{race.name}<span className="workflow-muted">{statusLabel(race.status)}</span></td>
                  <td>{race.raceDate} {shortTime(race.raceTime)}</td>
                  <td>{money(race.prizePool)} Points</td>
                  <td>
                    <div className="workflow-form-row">
                      <select className="form-select compact" value={selectedHorseByRace[race.id] || availableHorses[0]?.id || ''} onChange={(e) => setSelectedHorseByRace({ ...selectedHorseByRace, [race.id]: e.target.value })}>
                        {availableHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
                        {availableHorses.length === 0 && <option value="" disabled>No available horses</option>}
                      </select>
                      <select className="form-select compact" value={selectedJockeyByRaceRegistration[race.id] || availableJockeys[0]?.id || ''} onChange={(e) => setSelectedJockeyByRaceRegistration({ ...selectedJockeyByRaceRegistration, [race.id]: e.target.value })}>
                        {availableJockeys.map((jockey) => <option key={jockey.id} value={jockey.id}>{jockey.fullName || jockey.username || jockey.email}</option>)}
                        {availableJockeys.length === 0 && <option value="" disabled>No available jockeys</option>}
                      </select>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => onRegisterHorse(race.id, availableHorses[0]?.id, availableJockeys[0]?.id)} disabled={race.status !== 'REGISTRATION_OPEN' || !availableHorses.length || !availableJockeys.length}>
                      Register
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Registrations And Jockeys</h3>
          <GiHorseshoe />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Race</th>
                <th>Horse</th>
                <th>Status</th>
                <th>Jockey</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ownerRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{nameOf(data.races, registration.raceId, 'name', `Race #${registration.raceId}`)}</td>
                  <td>{nameOf(data.horses, registration.horseId, 'horseName', `Horse #${registration.horseId}`)}</td>
                  <td><RegistrationStatusBadge registration={registration} /></td>
                  <td>
                    <select className="form-select compact" value={selectedJockeyByRegistration[registration.id] || registration.jockeyId || data.jockeys[0]?.id || ''} onChange={(e) => setSelectedJockeyByRegistration({ ...selectedJockeyByRegistration, [registration.id]: e.target.value })}>
                      {data.jockeys.map((jockey) => <option key={jockey.id} value={jockey.id}>{jockey.fullName || jockey.username || jockey.email}</option>)}
                    </select>
                  </td>
                  <td className="workflow-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => onConfirm(registration.id)} disabled={registration.status !== 'APPROVED' || registration.ownerConfirmed}>
                      Confirm
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onInviteJockey(registration)} disabled={registration.status !== 'APPROVED' || !registration.ownerConfirmed || registration.jockeyConfirmed}>
                      Invite
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => onWithdraw(registration.id)}>
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ─── Cancel Race Modal ──────────────────────────────────────────────────────
function CancelRaceModal({ race, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 15;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onConfirm(race.id, reason.trim());
  };

  // Close on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" id="cancel-race-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container cancel-race-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-race-title">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-header-icon danger">
              <FiAlertTriangle />
            </div>
            <div>
              <h3 id="cancel-race-title" className="modal-title">Hủy Giải Đấu</h3>
              <p className="modal-subtitle">Hành động này không thể hoàn tác.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="cancel-race-info">
            <span className="cancel-race-name">{race?.name}</span>
            <span className="cancel-race-date">{race?.raceDate}</span>
          </div>

          <form onSubmit={handleSubmit} id="cancel-race-form">
            <div className="modal-field">
              <label className="modal-label" htmlFor="cancel-reason">
                Lý do hủy giải đấu <span className="required-star">*</span>
              </label>
              <textarea
                id="cancel-reason"
                className={`modal-textarea ${reason.trim().length > 0 && !isValid ? 'input-error' : ''}`}
                rows={4}
                placeholder="Nhập lý do hủy giải đấu chi tiết... (tối thiểu 15 ký tự)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
              <div className="modal-char-count">
                <span className={reason.trim().length > 0 && !isValid ? 'char-count-error' : reason.trim().length >= 15 ? 'char-count-ok' : ''}>
                  {reason.trim().length} / 15 ký tự tối thiểu
                </span>
                {reason.trim().length > 0 && !isValid && (
                  <span className="char-count-error"> — Cần ít nhất 15 ký tự</span>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy bỏ</button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={!isValid}
                id="btn-confirm-cancel-race"
              >
                <FiAlertOctagon /> Xác nhận hủy giải
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ data, pendingAdminRegistrations, onCreateRace, onApprove, onUpdateRaceStatus }) {
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [cancelModal, setCancelModal] = useState(null); // { race }

  const handleCancelRace = async (raceId, reason) => {
    await onUpdateRaceStatus(raceId, 'CANCELLED', reason);
    setCancelModal(null);
  };

  return (
    <>
      {cancelModal && (
        <CancelRaceModal
          race={cancelModal.race}
          onClose={() => setCancelModal(null)}
          onConfirm={handleCancelRace}
        />
      )}

      <div className="dash-stats-grid">
        <StatCard icon={<FiUsers />} label="Accounts" value={data.users.length} color="red" />
        <StatCard icon={<FiFlag />} label="Races" value={data.races.length} color="green" />
        <StatCard icon={<FiCheckCircle />} label="Pending Approvals" value={pendingAdminRegistrations.length} color="yellow" />
        <StatCard icon={<GiHorseHead />} label="Horses" value={data.horses.length} />
      </div>

      <div className="workflow-grid two">
        <CreateRaceForm onCreateRace={onCreateRace} />

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Race List</h3>
            <FiFlag />
          </div>
          <div className="workflow-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Race</th>
                  <th>Tournament</th>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Current Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.races.map((race) => (
                  <tr key={race.id}>
                    <td>{race.name}</td>
                    <td>{nameOf(data.tournaments, race.tournamentId, 'name', `Tournament #${race.tournamentId}`)}</td>
                    <td>{`${race.raceDate} ${shortTime(race.raceTime)}`}</td>
                    <td>{`${race.distanceM || '-'}m`}</td>
                    <td><RaceStatusBadge status={race.status} /></td>
                    <td className="workflow-actions">
                      <select 
                        className="form-select compact" 
                        value={selectedStatuses[race.id] || ''} 
                        onChange={(e) => setSelectedStatuses({ ...selectedStatuses, [race.id]: e.target.value })}
                      >
                        <option value="" disabled>Change Status</option>
                        {RACE_STATUSES.filter(s => s !== race.status && s !== 'CANCELLED').map(status => (
                          <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-primary btn-sm" 
                        disabled={!selectedStatuses[race.id]}
                        onClick={() => {
                          onUpdateRaceStatus(race.id, selectedStatuses[race.id]);
                          setSelectedStatuses({ ...selectedStatuses, [race.id]: '' });
                        }}
                      >
                        Update
                      </button>
                      {race.status !== 'CANCELLED' && race.status !== 'COMPLETED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          id={`btn-cancel-race-${race.id}`}
                          onClick={() => setCancelModal({ race })}
                          title="Hủy giải đấu này"
                        >
                          <FiXCircle /> Cancel Race
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!data.races.length && (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>No races</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Registration Approvals</h3>
          <FiCheckCircle />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Race</th>
                <th>Horse</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingAdminRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{nameOf(data.races, registration.raceId, 'name', `Race #${registration.raceId}`)}</td>
                  <td>{nameOf(data.horses, registration.horseId, 'horseName', `Horse #${registration.horseId}`)}</td>
                  <td>{nameOf(data.users, registration.ownerId, 'fullName', `Owner #${registration.ownerId}`)}</td>
                  <td><StatusBadge status={registration.status} /></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => onApprove(registration.id)}>Approve</button></td>
                </tr>
              ))}
              {!pendingAdminRegistrations.length && (
                <tr><td colSpan="5">No pending registrations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}


function JockeyDashboard({ data, invitations, assignments, onDecision }) {
  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<FiMail />} label="Invitations" value={invitations.length} color="red" />
        <StatCard icon={<GiHorseHead />} label="Assignments" value={assignments.length} color="green" />
        <StatCard icon={<FiFlag />} label="Upcoming Races" value={assignments.filter((item) => item.status !== 'WITHDRAWN').length} color="yellow" />
        <StatCard icon={<FiAward />} label="Career Points" value={data.jockeyLeaderboard[0]?.totalPoints || 0} />
      </div>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Invitations</h3>
          <FiMail />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Race</th>
                <th>Horse</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>{nameOf(data.races, invitation.raceId, 'name', `Race #${invitation.raceId}`)}</td>
                  <td>{nameOf(data.horses, invitation.horseId, 'horseName', `Horse #${invitation.horseId}`)}</td>
                  <td>{nameOf(data.users, invitation.ownerId, 'fullName', `Owner #${invitation.ownerId}`)}</td>
                  <td><StatusBadge status={invitation.status} /></td>
                  <td className="workflow-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => onDecision(invitation, 'ACCEPTED')} disabled={invitation.status !== 'PENDING'}><FiCheckCircle /> Accept</button>
                    <button className="btn btn-outline btn-sm" onClick={() => onDecision(invitation, 'DECLINED')} disabled={invitation.status !== 'PENDING'}><FiXCircle /> Decline</button>
                  </td>
                </tr>
              ))}
              {!invitations.length && (
                <tr><td colSpan="5">No invitations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Race Assignments</h3>
          <GiHorseshoe />
        </div>
        <CompactTable
          headers={['Race', 'Horse', 'Lane', 'Status']}
          rows={assignments.map((assignment) => [
            nameOf(data.races, assignment.raceId, 'name', `Race #${assignment.raceId}`),
            nameOf(data.horses, assignment.horseId, 'horseName', `Horse #${assignment.horseId}`),
            assignment.laneNumber || '-',
            statusLabel(assignment.status),
          ])}
          empty="No assignments"
        />
      </section>
    </>
  );
}

// ─── Referee Quick-Action Panel ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'stumble',      label: 'Stumble',       icon: '🐎', category: 'Movement',    severity: 'Medium',   color: '#F39C12', desc: 'Horse stumbled during race' },
  { id: 'interference', label: 'Interference',  icon: '⚡', category: 'Conduct',     severity: 'High',     color: '#E74C3C', desc: 'Interference with another horse' },
  { id: 'false_start', label: 'False Start',   icon: '🚫', category: 'Start',       severity: 'Critical', color: '#C0392B', desc: 'Horse false started at gate' },
  { id: 'injury',      label: 'Injury Observed', icon: '🏥', category: 'Health',    severity: 'Critical', color: '#8E44AD', desc: 'Injury observed on horse or jockey' },
];

function RefereeQuickActionPanel({ raceId, registrations, horses, users, onNoteSaved }) {
  const [noteForm, setNoteForm] = useState({ category: '', severity: '', description: '', registrationId: '', activeQuickAction: null });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const isDescValid = noteForm.description.trim().length >= 10;
  const canSave = noteForm.category && noteForm.severity && isDescValid;

  const handleQuickAction = (action) => {
    setNoteForm((prev) => ({
      ...prev,
      category: action.category,
      severity: action.severity,
      description: action.desc,
      activeQuickAction: action.id,
    }));
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!canSave || !raceId) return;
    setSaving(true);
    try {
      await api.createRaceNote({
        raceId,
        registrationId: noteForm.registrationId ? Number(noteForm.registrationId) : null,
        category: noteForm.category,
        severity: noteForm.severity,
        description: noteForm.description.trim(),
      });
      setSavedMsg('✅ Ghi chú đã được lưu!');
      setNoteForm({ category: '', severity: '', description: '', registrationId: '', activeQuickAction: null });
      onNoteSaved?.();
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setSavedMsg(`❌ Lỗi: ${err.message || 'Không thể lưu ghi chú'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workflow-panel referee-quick-panel" id="referee-quick-action-panel">
      <div className="workflow-panel-heading">
        <h3><FiZap style={{ marginRight: 6 }} />Quick Actions</h3>
        <span className="referee-panel-badge">Referee Tools</span>
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            id={`qa-btn-${action.id}`}
            className={`quick-action-btn ${noteForm.activeQuickAction === action.id ? 'active' : ''}`}
            style={{ '--qa-color': action.color }}
            onClick={() => handleQuickAction(action)}
            title={`Category: ${action.category} | Severity: ${action.severity}`}
          >
            <span className="qa-icon">{action.icon}</span>
            <span className="qa-label">{action.label}</span>
            <span className="qa-meta">
              <span className="qa-category">{action.category}</span>
              <span className={`qa-severity qa-severity-${action.severity.toLowerCase()}`}>{action.severity}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Note Form */}
      <form className="referee-note-form" onSubmit={handleSaveNote} id="referee-note-form">
        <div className="referee-note-row">
          <div className="referee-note-field">
            <label className="modal-label" htmlFor="note-registration">Đối tượng (Registration)</label>
            <select
              id="note-registration"
              className="form-select"
              value={noteForm.registrationId}
              onChange={(e) => setNoteForm({ ...noteForm, registrationId: e.target.value })}
            >
              <option value="">— Tất cả (Race level) —</option>
              {registrations.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {horses.find(h => Number(h.id) === Number(reg.horseId))?.horseName || `Horse #${reg.horseId}`}
                  {' / '}
                  {users.find(u => Number(u.id) === Number(reg.jockeyId))?.fullName || 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div className="referee-note-field">
            <label className="modal-label" htmlFor="note-category">Category <span className="required-star">*</span></label>
            <select
              id="note-category"
              className="form-select"
              value={noteForm.category}
              onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value, activeQuickAction: null })}
            >
              <option value="">— Chọn Category —</option>
              {['Movement', 'Conduct', 'Start', 'Health', 'Equipment', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="referee-note-field">
            <label className="modal-label" htmlFor="note-severity">Severity <span className="required-star">*</span></label>
            <select
              id="note-severity"
              className="form-select"
              value={noteForm.severity}
              onChange={(e) => setNoteForm({ ...noteForm, severity: e.target.value, activeQuickAction: null })}
            >
              <option value="">— Chọn Severity —</option>
              {['Low', 'Medium', 'High', 'Critical'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="referee-note-field">
          <label className="modal-label" htmlFor="note-description">
            Mô tả <span className="required-star">*</span>
            <span className={`char-hint ${noteForm.description.trim().length > 0 && !isDescValid ? 'char-count-error' : noteForm.description.trim().length >= 10 ? 'char-count-ok' : ''}`}>
              {noteForm.description.trim().length}/10 ký tự tối thiểu
            </span>
          </label>
          <textarea
            id="note-description"
            className={`modal-textarea ${noteForm.description.trim().length > 0 && !isDescValid ? 'input-error' : ''}`}
            rows={3}
            placeholder="Mô tả chi tiết sự cố... (tối thiểu 10 ký tự)"
            value={noteForm.description}
            onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
          />
        </div>

        {savedMsg && (
          <div className={`referee-note-msg ${savedMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {savedMsg}
          </div>
        )}

        <div className="referee-note-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setNoteForm({ category: '', severity: '', description: '', registrationId: '', activeQuickAction: null })}
          >
            Xóa form
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSave || saving}
            id="btn-save-race-note"
          >
            <FiSend /> {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
          </button>
        </div>
      </form>
    </section>
  );
}

function RefereeDashboard({
  data,
  selectedRace,
  selectedRaceId,
  setSelectedRaceId,
  selectedRaceRegistrations,
  checkableRegistrations,
  liveTrackHorses,
  simulation,
  onCreateRace,
  onCheck,
  onStart,
  onSimulate,
  onConfirmResults,
}) {
  const assignedRaces = data.races.filter((race) => Number(race.refereeId) === 3 || race.refereeId == null);

  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<FiShield />} label="Assigned Races" value={assignedRaces.length} color="red" />
        <StatCard icon={<FiActivity />} label="Pending Checks" value={checkableRegistrations.length} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Cleared Horses" value={data.registrations.filter((item) => item.status === 'CLEARED_TO_RACE').length} color="green" />
        <StatCard icon={<FiAward />} label="Official Races" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>

      <div className="workflow-grid two">
        <CreateRaceForm onCreateRace={onCreateRace} />

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Race Control</h3>
            <FiActivity />
          </div>
          <div className="workflow-control-bar">
            <select className="form-select" value={selectedRaceId || ''} onChange={(e) => setSelectedRaceId(e.target.value)}>
              {data.races.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={onStart} disabled={!selectedRaceRegistrations.length}>Start Race</button>
            <button className="btn btn-outline" onClick={onSimulate} disabled={!selectedRaceRegistrations.length}>Simulate</button>
            <button className="btn btn-primary" onClick={onConfirmResults} disabled={!selectedRaceRegistrations.length}>Confirm Results</button>
          </div>
          {selectedRace && (
            <p className="workflow-muted inline">
              {selectedRace.name} - {statusLabel(selectedRace.status)} - {selectedRace.distanceM}m
            </p>
          )}
        </section>
      </div>

      {/* Quick-Action Panel */}
      <RefereeQuickActionPanel
        raceId={selectedRace?.id}
        registrations={selectedRaceRegistrations}
        horses={data.horses}
        users={data.users}
        onNoteSaved={() => {}}
      />

      {selectedRaceRegistrations.length > 0 && (
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Pre-race Checks</h3>
            <FiCheckCircle />
          </div>
          <div className="workflow-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th>Horse</th>
                  <th>Jockey</th>
                  <th>Status</th>
                  <th>Check</th>
                </tr>
              </thead>
              <tbody>
                {selectedRaceRegistrations.map((registration) => (
                  <tr key={registration.id}>
                    <td>{registration.laneNumber || '-'}</td>
                    <td>{nameOf(data.horses, registration.horseId, 'horseName', `Horse #${registration.horseId}`)}</td>
                    <td>{nameOf(data.users, registration.jockeyId, 'fullName', registration.jockeyId ? `Jockey #${registration.jockeyId}` : 'Unassigned')}</td>
                    <td><StatusBadge status={registration.status} /></td>
                    <td className="workflow-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => onCheck(registration.id, true)}><FiCheckCircle /> Fit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => onCheck(registration.id, false)}><FiXCircle /> Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {liveTrackHorses.length > 0 && (
        <section className="workflow-panel unframed">
          <RaceTrack horses={liveTrackHorses} duration={60} isLive={selectedRace?.status === 'IN_PROGRESS'} />
        </section>
      )}

      {simulation?.lanes?.length > 0 && (
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Simulation State</h3>
            <FiActivity />
          </div>
          <CompactTable
            headers={['Rank', 'Lane', 'Horse', 'Position']}
            rows={simulation.lanes.map((lane, index) => [
              index + 1,
              lane.laneNumber,
              lane.horseName,
              `${lane.position}%`,
            ])}
          />
        </section>
      )}
    </>
  );
}


function SpectatorDashboard({ data, predictionForm, setPredictionForm, onPrediction }) {
  const raceHorses = data.registrations
    .filter((registration) => Number(registration.raceId) === Number(predictionForm.raceId))
    .map((registration) => byId(data.horses, registration.horseId))
    .filter(Boolean);
  const selectableHorses = raceHorses.length ? raceHorses : data.horses;

  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<FiFlag />} label="Open Races" value={data.races.filter((race) => race.status === 'REGISTRATION_OPEN').length} color="red" />
        <StatCard icon={<FiActivity />} label="Predictions" value={data.predictions.length} color="green" />
        <StatCard icon={<FiAward />} label="Top Horse Points" value={data.horseLeaderboard[0]?.totalPoints || 0} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Official Races" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>

      <div className="workflow-grid two">
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Prediction</h3>
            <FiAward />
          </div>
          <form className="workflow-form" onSubmit={onPrediction}>
            <select className="form-select" value={predictionForm.raceId} onChange={(e) => setPredictionForm({ ...predictionForm, raceId: Number(e.target.value), predictedHorseId: selectableHorses[0]?.id || '' })}>
              {data.races.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
            </select>
            <select className="form-select" value={predictionForm.predictedHorseId || ''} onChange={(e) => setPredictionForm({ ...predictionForm, predictedHorseId: Number(e.target.value) })}>
              {selectableHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
            </select>
            <input className="form-input" type="number" min="1" value={predictionForm.wagerPoints} onChange={(e) => setPredictionForm({ ...predictionForm, wagerPoints: Number(e.target.value) })} />
            <button className="btn btn-primary" type="submit">Submit Prediction</button>
          </form>
        </section>

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>My Predictions</h3>
            <FiActivity />
          </div>
          <CompactTable
            headers={['Race', 'Horse', 'Points', 'Status']}
            rows={data.predictions.map((prediction) => [
              nameOf(data.races, prediction.raceId, 'name', `Race #${prediction.raceId}`),
              nameOf(data.horses, prediction.predictedHorseId, 'horseName', `Horse #${prediction.predictedHorseId}`),
              prediction.wagerPoints,
              statusLabel(prediction.status),
            ])}
            empty="No predictions yet"
          />
        </section>
      </div>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Horse Leaderboard</h3>
          <FiAward />
        </div>
        <CompactTable
          headers={['Rank', 'Horse', 'Wins', 'Top 3', 'Points']}
          rows={data.horseLeaderboard.map((row, index) => [
            index + 1,
            row.horseName,
            row.totalWins || 0,
            row.totalTop3 || 0,
            row.totalPoints || 0,
          ])}
          empty="No leaderboard data"
        />
      </section>
    </>
  );
}

function StatusBadge({ status }) {
  const positive = ['APPROVED', 'READY_FOR_CHECK', 'CLEARED_TO_RACE', 'ACCEPTED', 'OFFICIAL', 'WON'];
  const negative = ['WITHDRAWN', 'REJECTED_BY_REFEREE', 'JOCKEY_DECLINED', 'DECLINED', 'LOST', 'REJECTED'];
  const badgeClass = positive.includes(status) ? 'badge-green' : negative.includes(status) ? 'badge-red' : 'badge-yellow';
  return <span className={`badge ${badgeClass}`}>{statusLabel(status)}</span>;
}

function RaceStatusBadge({ status }) {
  const mapping = {
    DRAFT: 'badge-gray',
    REGISTRATION_OPEN: 'badge-green',
    REGISTRATION_CLOSED: 'badge-orange',
    STANDBY: 'badge-yellow',
    IN_PROGRESS: 'badge-purple',
    REPORT_READY: 'badge-yellow',
    OFFICIAL: 'badge-blue',
    COMPLETED: 'badge-emerald',
    CANCELLED: 'badge-red',
  };
  const badgeClass = mapping[status] || 'badge-gray';
  return <span className={`badge ${badgeClass}`}>{statusLabel(status)}</span>;
}

function RegistrationStatusBadge({ registration }) {
  if (!registration) return <StatusBadge status="UNKNOWN" />;
  
  if (registration.status === 'REJECTED' || registration.status === 'WITHDRAWN') {
    return <StatusBadge status={registration.status} />;
  }

  if (registration.status === 'PENDING_ADMIN') {
    return <span className="badge badge-yellow">Awaiting Admin</span>;
  }

  if (registration.status === 'APPROVED') {
    if (!registration.ownerConfirmed) {
      return <span className="badge badge-yellow">Awaiting Owner</span>;
    }
    if (!registration.jockeyConfirmed) {
      return <span className="badge badge-yellow">Awaiting Jockey</span>;
    }
    if (!registration.refereeApproved) {
      return <span className="badge badge-yellow">Awaiting Referee</span>;
    }
    return <span className="badge badge-green">Ready to Race</span>;
  }
  
  return <StatusBadge status={registration.status} />;
}

function CompactTable({ headers, rows, empty = 'No data' }) {
  return (
    <div className="workflow-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={headers.length}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CreateRaceForm({ onCreateRace }) {
  const [formData, setFormData] = useState({
    name: '',
    raceDate: '',
    registrationDeadline: '',
    prizePool: 0,
    distance: 1000,
    maxLanes: 8,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onCreateRace({
      ...formData,
      status: 'REGISTRATION_OPEN',
    });
    setLoading(false);
    if (success) {
      setFormData({ name: '', raceDate: '', registrationDeadline: '', prizePool: 0, distance: 1000, maxLanes: 8 });
    }
  };

  return (
    <section className="workflow-panel">
      <div className="workflow-panel-heading">
        <h3>Create Race</h3>
        <FiPlus />
      </div>
      <form className="workflow-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Race Name</label>
          <input className="form-input" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Enter race name" disabled={loading} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Start Time</label>
          <input className="form-input" type="datetime-local" value={formData.raceDate} onChange={e => setFormData({...formData, raceDate: e.target.value})} required disabled={loading} style={{ background: '#1e1e1e', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Registration Deadline</label>
          <input className="form-input" type="datetime-local" value={formData.registrationDeadline} onChange={e => setFormData({...formData, registrationDeadline: e.target.value})} required disabled={loading} style={{ background: '#1e1e1e', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Prize Pool (Points)</label>
          <input className="form-input" type="number" min="0" value={formData.prizePool} onChange={e => setFormData({...formData, prizePool: Number(e.target.value)})} required placeholder="e.g. 50000" disabled={loading} />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Distance</label>
            <select className="form-select" value={formData.distance} onChange={e => setFormData({...formData, distance: Number(e.target.value)})} required disabled={loading}>
              <option value={1000}>1000m</option>
              <option value={1200}>1200m</option>
              <option value={1400}>1400m</option>
              <option value={1600}>1600m</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Max Lanes</label>
            <select className="form-select" value={formData.maxLanes} onChange={e => setFormData({...formData, maxLanes: Number(e.target.value)})} required disabled={loading}>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Race'}
        </button>
      </form>
    </section>
  );
}

export default DashboardPage;
