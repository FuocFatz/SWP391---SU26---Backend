import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FiActivity,
  FiAward,
  FiCheckCircle,
  FiFlag,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import StatCard from '../components/StatCard/StatCard';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import { api } from '../services/api';
import './DashboardPage.css';

const colors = ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'];

const demoUsers = [
  { id: 1, fullName: 'EquiX Owner', email: 'owner@equix.vn', role: 'OWNER', rewardPoints: 100 },
  { id: 2, fullName: 'EquiX Jockey', email: 'jockey@equix.vn', role: 'JOCKEY', rewardPoints: 100 },
  { id: 3, fullName: 'EquiX Referee', email: 'referee@equix.vn', role: 'REFEREE', rewardPoints: 100 },
  { id: 4, fullName: 'EquiX Spectator', email: 'spectator@equix.vn', role: 'SPECTATOR', rewardPoints: 100 },
  { id: 5, fullName: 'Admin EquiX', email: 'admin@equix.vn', role: 'ADMIN', rewardPoints: 100 },
];

const demoHorses = [
  { id: 1, horseName: 'Thunder Storm', breed: 'Thoroughbred', age: 4, speed: 88, stamina: 82, healthStatus: 'HEALTHY', ownerId: 1, totalWins: 1, totalPoints: 120, totalRaces: 2, totalTop3: 2 },
  { id: 2, horseName: 'Golden Arrow', breed: 'Arabian', age: 5, speed: 83, stamina: 90, healthStatus: 'HEALTHY', ownerId: 1, totalWins: 0, totalPoints: 60, totalRaces: 1, totalTop3: 1 },
];

const demoRaces = [
  { id: 1, name: 'Summer Thunder Sprint', type: 'Sprint', distanceM: 1200, surface: 'Turf', raceDate: '2026-07-20', raceTime: '14:00:00', maxParticipants: 8, prizePool: 75000, status: 'REGISTRATION_OPEN', refereeId: 3 },
  { id: 2, name: 'Golden Mile Classic', type: 'Mile', distanceM: 1600, surface: 'Dirt', raceDate: '2026-07-22', raceTime: '15:30:00', maxParticipants: 10, prizePool: 120000, status: 'REGISTRATION_OPEN', refereeId: 3 },
];

const demoRegistrations = [
  { id: 1, raceId: 1, horseId: 1, ownerId: 1, jockeyId: 2, laneNumber: 1, status: 'READY_FOR_CHECK', ownerConfirmed: true, jockeyConfirmed: true, refereeApproved: false, healthCheckStatus: 'PENDING' },
];

const demoInvitations = [
  { id: 1, raceId: 1, horseId: 1, ownerId: 1, jockeyId: 2, status: 'ACCEPTED', message: 'Ride Thunder Storm in Summer Thunder Sprint' },
];

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

function defaultData() {
  return {
    users: demoUsers,
    jockeys: demoUsers.filter((user) => user.role === 'JOCKEY'),
    races: demoRaces,
    horses: demoHorses,
    registrations: demoRegistrations,
    invitations: demoInvitations,
    predictions: [],
    horseLeaderboard: demoHorses.map((horse) => ({
      horseId: horse.id,
      horseName: horse.horseName,
      ownerId: horse.ownerId,
      totalRaces: horse.totalRaces,
      totalWins: horse.totalWins,
      totalTop3: horse.totalTop3,
      totalPoints: horse.totalPoints,
    })),
    jockeyLeaderboard: [{ jockeyId: 2, jockeyName: 'EquiX Jockey', totalRaces: 2, totalPoints: 140 }],
  };
}

function DashboardPage() {
  const { user, currentRole } = useAuth();
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState(1);
  const [selectedHorseByRace, setSelectedHorseByRace] = useState({});
  const [selectedJockeyByRegistration, setSelectedJockeyByRegistration] = useState({});
  const [simulation, setSimulation] = useState(null);
  const [horseForm, setHorseForm] = useState({ horseName: '', breed: 'Thoroughbred', age: 4, speed: 80, stamina: 80 });
  const [raceForm, setRaceForm] = useState({
    name: '',
    type: 'Sprint',
    distanceM: 1200,
    raceDate: '2026-07-20',
    raceTime: '14:00',
    maxParticipants: 8,
    prizePool: 75000,
  });
  const [predictionForm, setPredictionForm] = useState({ raceId: 1, predictedHorseId: 1, wagerPoints: 10 });

  const userId = user?.id || 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        users,
        jockeys,
        races,
        horses,
        registrations,
        invitations,
        predictions,
        horseLeaderboard,
        jockeyLeaderboard,
      ] = await Promise.all([
        api.getUsers(),
        api.getUsersByRole('JOCKEY'),
        api.getRaces(),
        api.getHorses(),
        api.getRegistrations(),
        api.getInvitations(),
        api.getPredictions(user?.role === 'SPECTATOR' ? { spectatorId: userId } : {}),
        api.getHorseLeaderboard(),
        api.getJockeyLeaderboard(),
      ]);

      setData({
        users,
        jockeys,
        races,
        horses,
        registrations,
        invitations,
        predictions,
        horseLeaderboard,
        jockeyLeaderboard,
      });
      setOffline(false);
      if (races.length && !races.some((race) => Number(race.id) === Number(selectedRaceId))) {
        setSelectedRaceId(races[0].id);
        setPredictionForm((form) => ({ ...form, raceId: races[0].id }));
      }
    } catch (err) {
      setData(defaultData());
      setOffline(true);
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

  const ownerHorses = data.horses.filter((horse) => Number(horse.ownerId) === Number(userId));
  const ownerRegistrations = data.registrations.filter((registration) => Number(registration.ownerId) === Number(userId));
  const jockeyInvitations = data.invitations.filter((invitation) => Number(invitation.jockeyId) === Number(userId));
  const jockeyAssignments = data.registrations.filter((registration) => Number(registration.jockeyId) === Number(userId));
  const selectedRaceRegistrations = data.registrations.filter((registration) => Number(registration.raceId) === Number(selectedRace?.id));
  const pendingAdminRegistrations = data.registrations.filter((registration) => registration.status === 'PENDING_ADMIN');
  const checkableRegistrations = data.registrations.filter((registration) => ['READY_FOR_CHECK', 'CLEARED_TO_RACE', 'APPROVED'].includes(registration.status));

  const setDemoData = (updater) => {
    setData((current) => {
      const next = updater(current);
      return { ...current, ...next };
    });
  };

  const execute = async (label, action, demoAction) => {
    setMessage('');
    if (offline) {
      demoAction?.();
      setMessage(`${label} completed in demo mode`);
      return;
    }

    try {
      await action();
      setMessage(`${label} completed`);
      await loadData();
    } catch (err) {
      setMessage(err.message || `${label} failed`);
    }
  };

  const handleCreateHorse = (event) => {
    event.preventDefault();
    execute(
      'Create horse',
      () => api.createHorse({
        ...horseForm,
        ownerId: userId,
        gender: 'UNKNOWN',
        healthStatus: 'HEALTHY',
      }),
      () => setDemoData((current) => ({
        horses: [
          ...current.horses,
          { id: Date.now(), ...horseForm, ownerId: userId, healthStatus: 'HEALTHY', totalPoints: 0, totalWins: 0, totalRaces: 0, totalTop3: 0 },
        ],
      })),
    );
    setHorseForm({ horseName: '', breed: 'Thoroughbred', age: 4, speed: 80, stamina: 80 });
  };

  const handleRegisterHorse = (raceId) => {
    const horseId = selectedHorseByRace[raceId] || ownerHorses[0]?.id;
    if (!horseId) {
      setMessage('Create a horse before registering for a race');
      return;
    }

    execute(
      'Race registration',
      () => api.registerHorse(raceId, { horseId, ownerId: userId }),
      () => setDemoData((current) => ({
        registrations: [
          ...current.registrations,
          {
            id: Date.now(),
            raceId,
            horseId,
            ownerId: userId,
            laneNumber: current.registrations.filter((item) => Number(item.raceId) === Number(raceId)).length + 1,
            status: 'PENDING_ADMIN',
            ownerConfirmed: true,
            jockeyConfirmed: false,
            refereeApproved: false,
            healthCheckStatus: 'PENDING',
          },
        ],
      })),
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
      }),
      () => setDemoData((current) => ({
        invitations: [
          ...current.invitations,
          { id: Date.now(), raceId: registration.raceId, horseId: registration.horseId, ownerId: registration.ownerId, jockeyId, status: 'PENDING' },
        ],
        registrations: current.registrations.map((item) => (
          item.id === registration.id ? { ...item, jockeyId } : item
        )),
      })),
    );
  };

  const handleCreateRace = (event) => {
    event.preventDefault();
    execute(
      'Create race',
      () => api.createRace({ ...raceForm, status: 'REGISTRATION_OPEN', refereeId: 3 }),
      () => setDemoData((current) => ({
        races: [...current.races, { id: Date.now(), ...raceForm, status: 'REGISTRATION_OPEN', refereeId: 3 }],
      })),
    );
    setRaceForm({ ...raceForm, name: '' });
  };

  const handleInvitationDecision = (invitation, status) => {
    execute(
      `${status === 'ACCEPTED' ? 'Accept' : 'Decline'} invitation`,
      () => api.respondInvitation(invitation.id, { status }),
      () => setDemoData((current) => ({
        invitations: current.invitations.map((item) => item.id === invitation.id ? { ...item, status } : item),
        registrations: current.registrations.map((item) => (
          Number(item.raceId) === Number(invitation.raceId) && Number(item.horseId) === Number(invitation.horseId)
            ? { ...item, jockeyConfirmed: status === 'ACCEPTED', status: status === 'ACCEPTED' ? 'READY_FOR_CHECK' : 'JOCKEY_DECLINED' }
            : item
        )),
      })),
    );
  };

  const handleRegistrationPatch = (label, registrationId, action, patch) => {
    execute(
      label,
      action,
      () => setDemoData((current) => ({
        registrations: current.registrations.map((item) => item.id === registrationId ? { ...item, ...patch } : item),
      })),
    );
  };

  const handleSimulate = () => {
    if (!selectedRace) return;
    if (offline) {
      const lanes = selectedRaceRegistrations.map((registration, index) => ({
        registrationId: registration.id,
        laneNumber: registration.laneNumber || index + 1,
        horseId: registration.horseId,
        horseName: nameOf(data.horses, registration.horseId, 'horseName', `Horse #${registration.horseId}`),
        jockeyId: registration.jockeyId,
        position: Math.min(100, 45 + index * 8 + Math.floor(Math.random() * 20)),
        status: 'IN_PROGRESS',
      })).sort((a, b) => b.position - a.position);
      setSimulation({ raceId: selectedRace.id, lanes });
      setMessage('Race simulation completed in demo mode');
      return;
    }

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
      () => api.confirmResults(selectedRace.id, {
        results: ordered.map((registration, index) => ({
          registrationId: registration.id,
          finishPosition: index + 1,
          finishTimeSeconds: Number((68 + index * 2.4).toFixed(2)),
          violationNotes: '',
        })),
      }),
      () => setDemoData((current) => ({
        races: current.races.map((race) => race.id === selectedRace.id ? { ...race, status: 'OFFICIAL' } : race),
        horseLeaderboard: ordered.map((registration, index) => {
          const horse = byId(current.horses, registration.horseId);
          return {
            horseId: registration.horseId,
            horseName: horse?.horseName || `Horse #${registration.horseId}`,
            ownerId: registration.ownerId,
            totalRaces: (horse?.totalRaces || 0) + 1,
            totalWins: index === 0 ? (horse?.totalWins || 0) + 1 : horse?.totalWins || 0,
            totalTop3: index < 3 ? (horse?.totalTop3 || 0) + 1 : horse?.totalTop3 || 0,
            totalPoints: (horse?.totalPoints || 0) + (index === 0 ? 100 : index === 1 ? 60 : index === 2 ? 30 : 10),
          };
        }),
      })),
    );
  };

  const handlePrediction = (event) => {
    event.preventDefault();
    execute(
      'Prediction',
      () => api.createPrediction(predictionForm.raceId, { ...predictionForm, spectatorId: userId }),
      () => setDemoData((current) => ({
        predictions: [
          ...current.predictions,
          { id: Date.now(), ...predictionForm, spectatorId: userId, status: 'PENDING', rewardPoints: 0 },
        ],
      })),
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

      {(offline || message) && (
        <div className={`dash-message ${offline ? 'warning' : 'success'}`}>
          {offline ? 'Backend is offline. Demo data is being shown.' : message}
          {offline && message ? ` ${message}` : ''}
        </div>
      )}

      {currentRole === 'OWNER' && (
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
          onCreateHorse={handleCreateHorse}
          onRegisterHorse={handleRegisterHorse}
          onInviteJockey={handleInviteJockey}
          onWithdraw={(id) => handleRegistrationPatch('Withdraw registration', id, () => api.withdrawRegistration(id, 'Horse or jockey unavailable'), { status: 'WITHDRAWN', withdrawReason: 'Horse or jockey unavailable' })}
        />
      )}

      {currentRole === 'ADMIN' && (
        <AdminDashboard
          data={data}
          raceForm={raceForm}
          setRaceForm={setRaceForm}
          pendingAdminRegistrations={pendingAdminRegistrations}
          onCreateRace={handleCreateRace}
          onApprove={(id) => handleRegistrationPatch('Approve registration', id, () => api.approveRegistration(id), { status: 'APPROVED' })}
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
          onCheck={(id, approved) => handleRegistrationPatch(
            approved ? 'Approve race check' : 'Reject race check',
            id,
            () => api.refereeCheck(id, { approved, healthCheckStatus: approved ? 'FIT' : 'NOT_FIT', notes: approved ? 'Ready to race' : 'Health check failed' }),
            { refereeApproved: approved, healthCheckStatus: approved ? 'FIT' : 'NOT_FIT', status: approved ? 'CLEARED_TO_RACE' : 'REJECTED_BY_REFEREE' },
          )}
          onStart={() => handleRegistrationPatch('Start race', selectedRace.id, () => api.startRace(selectedRace.id), {})}
          onSimulate={handleSimulate}
          onConfirmResults={handleConfirmResults}
          setDemoData={setDemoData}
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
  onCreateHorse,
  onRegisterHorse,
  onInviteJockey,
  onWithdraw,
}) {
  const readyCount = ownerRegistrations.filter((item) => ['READY_FOR_CHECK', 'CLEARED_TO_RACE'].includes(item.status)).length;

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
            <input className="form-input" placeholder="Horse name" value={horseForm.horseName} onChange={(e) => setHorseForm({ ...horseForm, horseName: e.target.value })} required />
            <input className="form-input" placeholder="Breed" value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
            <div className="workflow-form-row">
              <input className="form-input" type="number" min="1" placeholder="Age" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
              <input className="form-input" type="number" min="1" max="100" placeholder="Speed" value={horseForm.speed} onChange={(e) => setHorseForm({ ...horseForm, speed: Number(e.target.value) })} />
              <input className="form-input" type="number" min="1" max="100" placeholder="Stamina" value={horseForm.stamina} onChange={(e) => setHorseForm({ ...horseForm, stamina: Number(e.target.value) })} />
            </div>
            <button className="btn btn-primary" type="submit">Create Horse</button>
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
              {data.races.map((race) => (
                <tr key={race.id}>
                  <td>{race.name}<span className="workflow-muted">{statusLabel(race.status)}</span></td>
                  <td>{race.raceDate} {shortTime(race.raceTime)}</td>
                  <td>${money(race.prizePool)}</td>
                  <td>
                    <select className="form-select compact" value={selectedHorseByRace[race.id] || ownerHorses[0]?.id || ''} onChange={(e) => setSelectedHorseByRace({ ...selectedHorseByRace, [race.id]: e.target.value })}>
                      {ownerHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => onRegisterHorse(race.id)} disabled={race.status !== 'REGISTRATION_OPEN' || !ownerHorses.length}>
                      Register
                    </button>
                  </td>
                </tr>
              ))}
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
                  <td><StatusBadge status={registration.status} /></td>
                  <td>
                    <select className="form-select compact" value={selectedJockeyByRegistration[registration.id] || registration.jockeyId || data.jockeys[0]?.id || ''} onChange={(e) => setSelectedJockeyByRegistration({ ...selectedJockeyByRegistration, [registration.id]: e.target.value })}>
                      {data.jockeys.map((jockey) => <option key={jockey.id} value={jockey.id}>{jockey.fullName || jockey.username || jockey.email}</option>)}
                    </select>
                  </td>
                  <td className="workflow-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => onInviteJockey(registration)} disabled={!['APPROVED', 'READY_FOR_CHECK', 'CLEARED_TO_RACE'].includes(registration.status)}>
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

function AdminDashboard({ data, raceForm, setRaceForm, pendingAdminRegistrations, onCreateRace, onApprove }) {
  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<FiUsers />} label="Accounts" value={data.users.length} color="red" />
        <StatCard icon={<FiFlag />} label="Races" value={data.races.length} color="green" />
        <StatCard icon={<FiCheckCircle />} label="Pending Approvals" value={pendingAdminRegistrations.length} color="yellow" />
        <StatCard icon={<GiHorseHead />} label="Horses" value={data.horses.length} />
      </div>

      <div className="workflow-grid two">
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Create Race</h3>
            <FiPlus />
          </div>
          <form className="workflow-form" onSubmit={onCreateRace}>
            <input className="form-input" placeholder="Race name" value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })} required />
            <div className="workflow-form-row">
              <select className="form-select" value={raceForm.type} onChange={(e) => setRaceForm({ ...raceForm, type: e.target.value })}>
                <option>Sprint</option>
                <option>Mile</option>
                <option>Medium</option>
                <option>Long</option>
              </select>
              <input className="form-input" type="number" min="400" value={raceForm.distanceM} onChange={(e) => setRaceForm({ ...raceForm, distanceM: Number(e.target.value) })} />
            </div>
            <div className="workflow-form-row">
              <input className="form-input" type="date" value={raceForm.raceDate} onChange={(e) => setRaceForm({ ...raceForm, raceDate: e.target.value })} />
              <input className="form-input" type="time" value={raceForm.raceTime} onChange={(e) => setRaceForm({ ...raceForm, raceTime: e.target.value })} />
            </div>
            <div className="workflow-form-row">
              <input className="form-input" type="number" min="2" value={raceForm.maxParticipants} onChange={(e) => setRaceForm({ ...raceForm, maxParticipants: Number(e.target.value) })} />
              <input className="form-input" type="number" min="0" value={raceForm.prizePool} onChange={(e) => setRaceForm({ ...raceForm, prizePool: Number(e.target.value) })} />
            </div>
            <button className="btn btn-primary" type="submit">Create Race</button>
          </form>
        </section>

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Race List</h3>
            <FiFlag />
          </div>
          <CompactTable
            headers={['Race', 'Date', 'Distance', 'Status']}
            rows={data.races.map((race) => [
              race.name,
              `${race.raceDate} ${shortTime(race.raceTime)}`,
              `${race.distanceM || '-'}m`,
              statusLabel(race.status),
            ])}
            empty="No races"
          />
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

function RefereeDashboard({
  data,
  selectedRace,
  selectedRaceId,
  setSelectedRaceId,
  selectedRaceRegistrations,
  checkableRegistrations,
  liveTrackHorses,
  simulation,
  onCheck,
  onStart,
  onSimulate,
  onConfirmResults,
  setDemoData,
}) {
  const assignedRaces = data.races.filter((race) => Number(race.refereeId) === 3 || race.refereeId == null);

  const handleDemoStart = () => {
    if (!selectedRace) return;
    setDemoData((current) => ({
      races: current.races.map((race) => Number(race.id) === Number(selectedRace.id) ? { ...race, status: 'IN_PROGRESS' } : race),
    }));
    onStart();
  };

  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<FiShield />} label="Assigned Races" value={assignedRaces.length} color="red" />
        <StatCard icon={<FiActivity />} label="Pending Checks" value={checkableRegistrations.length} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Cleared Horses" value={data.registrations.filter((item) => item.status === 'CLEARED_TO_RACE').length} color="green" />
        <StatCard icon={<FiAward />} label="Official Races" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Race Control</h3>
          <FiActivity />
        </div>
        <div className="workflow-control-bar">
          <select className="form-select" value={selectedRaceId || ''} onChange={(e) => setSelectedRaceId(e.target.value)}>
            {data.races.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={handleDemoStart} disabled={!selectedRaceRegistrations.length}>Start Race</button>
          <button className="btn btn-outline" onClick={onSimulate} disabled={!selectedRaceRegistrations.length}>Simulate</button>
          <button className="btn btn-primary" onClick={onConfirmResults} disabled={!selectedRaceRegistrations.length}>Confirm Results</button>
        </div>
        {selectedRace && (
          <p className="workflow-muted inline">
            {selectedRace.name} - {statusLabel(selectedRace.status)} - {selectedRace.distanceM}m
          </p>
        )}
      </section>

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
  const negative = ['WITHDRAWN', 'REJECTED_BY_REFEREE', 'JOCKEY_DECLINED', 'DECLINED', 'LOST'];
  const badgeClass = positive.includes(status) ? 'badge-green' : negative.includes(status) ? 'badge-red' : 'badge-yellow';
  return <span className={`badge ${badgeClass}`}>{statusLabel(status)}</span>;
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

export default DashboardPage;
