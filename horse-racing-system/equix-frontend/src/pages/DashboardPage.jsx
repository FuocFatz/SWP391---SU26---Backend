import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
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
const DEFAULT_RACE_DATE = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

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

function emptyData() {
  return {
    users: [],
    jockeys: [],
    referees: [],
    tournaments: [],
    races: [],
    horses: [],
    registrations: [],
    invitations: [],
    predictions: [],
    horseLeaderboard: [],
    jockeyLeaderboard: [],
  };
}

function DashboardPage({ section = '' }) {
  const { user, currentRole } = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState(1);
  const [selectedHorseByRace, setSelectedHorseByRace] = useState({});
  const [selectedJockeyByRace, setSelectedJockeyByRace] = useState({});
  const [simulation, setSimulation] = useState(null);
  const [horseForm, setHorseForm] = useState({ horseName: '', breed: 'Thoroughbred', age: 4, speed: 80, stamina: 80 });
  const [raceForm, setRaceForm] = useState({
    name: '',
    type: 'Sprint',
    distanceM: 1200,
    raceDate: DEFAULT_RACE_DATE,
    raceTime: '14:00',
    maxParticipants: 8,
    prizePool: 75000,
    tournamentId: '',
    refereeId: '',
  });
  const [predictionForm, setPredictionForm] = useState({ raceId: 1, predictedHorseId: 1 });

  const userId = user?.id;

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const requests = {
      races: api.getRaces(),
      horses: currentRole === 'HORSE_OWNER' ? api.getHorsesByOwner(userId) : api.getHorses(),
      horseLeaderboard: api.getHorseLeaderboard(),
    };

    if (currentRole === 'ADMIN') {
      Object.assign(requests, {
        users: api.getUsers(),
        jockeys: api.getUsersByRole('JOCKEY'),
        registrations: api.getRegistrations(),
        invitations: api.getInvitations(),
        referees: api.getUsersByRole('REFEREE'),
        tournaments: api.getTournaments(),
      });
    } else if (currentRole === 'HORSE_OWNER') {
      Object.assign(requests, {
        jockeys: api.getUsersByRole('JOCKEY'),
        registrations: api.getRegistrations({ ownerId: userId }),
        invitations: api.getInvitations({ ownerId: userId }),
      });
    } else if (currentRole === 'JOCKEY') {
      Object.assign(requests, {
        registrations: api.getRegistrations({ jockeyId: userId }),
        invitations: api.getInvitations({ jockeyId: userId }),
        jockeyLeaderboard: api.getJockeyLeaderboard(),
      });
    } else if (currentRole === 'REFEREE') {
      Object.assign(requests, {
        registrations: api.getRegistrations(),
        jockeyLeaderboard: api.getJockeyLeaderboard(),
      });
    } else if (currentRole === 'SPECTATOR') {
      requests.predictions = api.getPredictions({ spectatorId: userId });
    }

    const entries = Object.entries(requests);
    const results = await Promise.allSettled(entries.map(([, request]) => request));
    const next = emptyData();
    const failures = [];
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === 'fulfilled') next[key] = Array.isArray(result.value) ? result.value : [];
      else failures.push(key);
    });
    next.users = next.users.length ? next.users : [user];

    setData(next);
    setOffline(failures.length === entries.length);
    setMessage(failures.length ? `Some dashboard data could not be loaded: ${failures.join(', ')}.` : '');
    if (next.races.length) {
      const visibleRaces = currentRole === 'REFEREE'
        ? next.races.filter((race) => Number(race.refereeId) === Number(userId))
        : next.races;
      setSelectedRaceId((current) => visibleRaces.some((race) => Number(race.id) === Number(current)) ? current : visibleRaces[0]?.id || '');
      setPredictionForm((form) => ({ ...form, raceId: form.raceId || next.races[0].id }));
    }
    setLoading(false);
  }, [currentRole, user, userId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

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
  const checkableRegistrations = data.registrations.filter((registration) => ['READY_FOR_CHECK', 'APPROVED'].includes(registration.status));

  const setDemoData = (updater) => {
    setData((current) => {
      const next = updater(current);
      return { ...current, ...next };
    });
  };

  const execute = async (label, action) => {
    setMessage('');
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

  const handleInviteJockey = (raceId) => {
    const horseId = selectedHorseByRace[raceId] || ownerHorses[0]?.id;
    const jockeyId = selectedJockeyByRace[raceId] || data.jockeys[0]?.id;
    if (!horseId) {
      setMessage('Create an available horse before inviting a jockey');
      return;
    }
    if (!jockeyId) {
      setMessage('No jockey account available');
      return;
    }

    execute(
      'Jockey invitation',
      () => api.inviteJockey({
        raceId,
        horseId,
        jockeyId,
        message: `Invitation for ${nameOf(data.horses, horseId, 'horseName', 'horse')}`,
      }),
      () => setDemoData((current) => ({
        invitations: [
          ...current.invitations,
          { id: Date.now(), raceId, horseId, ownerId: userId, jockeyId, status: 'PENDING' },
        ],
      })),
    );
  };

  const handleCreateRace = (event) => {
    event.preventDefault();
    execute(
      'Create race',
      () => api.createRace({ ...raceForm, status: 'REGISTRATION_OPEN' }),
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
    execute(
      'Race simulation',
      async () => {
        const response = await api.simulateRace(selectedRace.id, 60);
        setSimulation(response);
      },
    );
  };

  const handleConfirmResults = (race = selectedRace) => {
    if (!race) return;
    const runners = data.registrations.filter((item) => Number(item.raceId) === Number(race.id) && !['WITHDRAWN', 'REJECTED_BY_REFEREE'].includes(item.status));
    if (!runners.length) {
      setMessage('No runners available for result confirmation');
      return;
    }

    const ordered = Number(race.id) === Number(selectedRace?.id) && simulation?.lanes?.length
      ? simulation.lanes.map((lane) => runners.find((item) => Number(item.id) === Number(lane.registrationId))).filter(Boolean)
      : runners;

    execute(
      'Confirm results',
      () => api.confirmResults(race.id, {
        results: ordered.map((registration, index) => ({
          registrationId: registration.id,
          finishPosition: index + 1,
          finishTimeSeconds: Number((68 + index * 2.4).toFixed(2)),
          violationNotes: '',
        })),
      }),
      () => setDemoData((current) => ({
        races: current.races.map((item) => item.id === race.id ? { ...item, status: 'OFFICIAL' } : item),
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
          <h1 className="dash-title">{section ? section.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : <>Welcome back, <span className="text-primary-color">{user.name || user.email}</span></>}</h1>
          <p className="dash-subtitle">
            {section ? `${currentRole} workspace` : `${currentRole} workflow dashboard`}
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadData} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {(offline || message) && (
        <div className={`dash-message ${offline ? 'warning' : 'success'}`}>
          {offline ? 'Dashboard data is currently unavailable. Please retry.' : message}
          {offline && message ? ` ${message}` : ''}
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
          selectedJockeyByRace={selectedJockeyByRace}
          setSelectedJockeyByRace={setSelectedJockeyByRace}
          onCreateHorse={handleCreateHorse}
          onRegisterHorse={handleRegisterHorse}
          onInviteJockey={handleInviteJockey}
          onWithdraw={(id) => handleRegistrationPatch('Withdraw registration', id, () => api.withdrawRegistration(id, 'Horse or jockey unavailable'), { status: 'WITHDRAWN', withdrawReason: 'Horse or jockey unavailable' })}
          section={section}
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
          onStatus={(raceId, status) => execute(`Set race ${status}`, () => api.updateRaceStatus(raceId, status))}
          onConfirmResults={handleConfirmResults}
        />
      )}

      {currentRole === 'JOCKEY' && (
        <JockeyDashboard
          data={data}
          invitations={jockeyInvitations}
          assignments={jockeyAssignments}
          onDecision={handleInvitationDecision}
          section={section}
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
          onComplete={() => execute('Complete race', () => api.completeRace(selectedRace.id))}
          onSubmitReport={(raceId = selectedRace?.id) => execute('Submit clean race report', () => api.submitRaceReport(raceId, { description: 'Clean race execution; no incidents observed.', severity: 'INFO', actionTaken: 'No action required' }))}
          onSimulate={handleSimulate}
          userId={userId}
          section={section}
        />
      )}

      {currentRole === 'SPECTATOR' && (
        <SpectatorDashboard
          data={data}
          predictionForm={predictionForm}
          setPredictionForm={setPredictionForm}
          onPrediction={handlePrediction}
          section={section}
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
  selectedJockeyByRace,
  setSelectedJockeyByRace,
  onCreateHorse,
  onRegisterHorse,
  onInviteJockey,
  onWithdraw,
  section,
}) {
  const readyCount = ownerRegistrations.filter((item) => ['READY_FOR_CHECK', 'CLEARED_TO_RACE'].includes(item.status)).length;

  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<GiHorseHead />} label="My Horses" value={ownerHorses.length} color="red" />
        <StatCard icon={<FiFlag />} label="Registrations" value={ownerRegistrations.length} color="green" />
        <StatCard icon={<GiHorseshoe />} label="Ready Pairings" value={readyCount} color="yellow" />
        <StatCard icon={<FiAward />} label="Reward Points" value={nameOf(data.users, userId, 'rewardPoints', 100)} />
      </div>}

      {(!section || section === 'horses') && <div className="workflow-grid two">
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
      </div>}

      {(!section || section === 'jockeys' || section === 'races') && <section className="workflow-panel">
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
                <th>Jockey</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.races.map((race) => {
                const horseId = selectedHorseByRace[race.id] || ownerHorses[0]?.id;
                const invitation = data.invitations.find((item) => Number(item.raceId) === Number(race.id) && Number(item.horseId) === Number(horseId));
                const paired = invitation?.status === 'ACCEPTED';
                const registered = ownerRegistrations.some((item) => Number(item.raceId) === Number(race.id) && Number(item.horseId) === Number(horseId) && item.status !== 'WITHDRAWN');
                return <tr key={race.id}>
                  <td>{race.name}<span className="workflow-muted">{statusLabel(race.status)}</span></td>
                  <td>{race.raceDate} {shortTime(race.raceTime)}</td>
                  <td>${money(race.prizePool)}</td>
                  <td>
                    <select className="form-select compact" value={selectedHorseByRace[race.id] || ownerHorses[0]?.id || ''} onChange={(e) => setSelectedHorseByRace({ ...selectedHorseByRace, [race.id]: e.target.value })}>
                      {ownerHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="form-select compact" value={selectedJockeyByRace[race.id] || data.jockeys[0]?.id || ''} onChange={(e) => setSelectedJockeyByRace({ ...selectedJockeyByRace, [race.id]: e.target.value })} disabled={Boolean(invitation)}>
                      {data.jockeys.map((jockey) => <option key={jockey.id} value={jockey.id}>{jockey.fullName || jockey.username || jockey.email}</option>)}
                    </select>
                    {invitation && <span className="workflow-muted">Invitation: {statusLabel(invitation.status)}</span>}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => paired ? onRegisterHorse(race.id) : onInviteJockey(race.id)} disabled={race.status !== 'REGISTRATION_OPEN' || !ownerHorses.length || registered || invitation?.status === 'PENDING'}>
                      {registered ? 'Registered' : paired ? 'Register pair' : invitation?.status === 'PENDING' ? 'Awaiting jockey' : 'Invite jockey'}
                    </button>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>}

      {(!section || section === 'pairings') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Registered Pairs</h3>
          <GiHorseshoe />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Race</th>
                <th>Horse</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ownerRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{nameOf(data.races, registration.raceId, 'name', `Race #${registration.raceId}`)}</td>
                  <td>{nameOf(data.horses, registration.horseId, 'horseName', `Horse #${registration.horseId}`)}</td>
                  <td><StatusBadge status={registration.status} /></td>
                  <td className="workflow-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => onWithdraw(registration.id)}>
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>}

      {section === 'leaderboard' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Horse Leaderboard</h3><FiAward /></div>
        <CompactTable
          headers={['Rank', 'Horse', 'Owner', 'Races', 'Wins', 'Top 3', 'Points']}
          rows={data.horseLeaderboard.map((row, index) => [index + 1, row.horseName, row.ownerName || `Owner #${row.ownerId}`, row.totalRaces || 0, row.totalWins || 0, row.totalTop3 || 0, row.totalPoints || 0])}
          empty="No leaderboard data"
        />
      </section>}
    </>
  );
}

function AdminDashboard({ data, raceForm, setRaceForm, pendingAdminRegistrations, onCreateRace, onApprove, onStatus, onConfirmResults }) {
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
              <select className="form-select" value={raceForm.tournamentId} onChange={(e) => setRaceForm({ ...raceForm, tournamentId: Number(e.target.value) })} required>
                <option value="">Tournament</option>
                {data.tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
              </select>
              <select className="form-select" value={raceForm.refereeId} onChange={(e) => setRaceForm({ ...raceForm, refereeId: Number(e.target.value) })} required>
                <option value="">Assigned referee</option>
                {data.referees.map((referee) => <option key={referee.id} value={referee.id}>{referee.fullName || referee.email}</option>)}
              </select>
            </div>
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
              <input className="form-input" type="number" min="6" max="18" value={raceForm.maxParticipants} onChange={(e) => setRaceForm({ ...raceForm, maxParticipants: Number(e.target.value) })} />
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
            headers={['Race', 'Date', 'Distance', 'Status', 'Action']}
            rows={data.races.map((race) => [
              race.name,
              `${race.raceDate} ${shortTime(race.raceTime)}`,
              `${race.distanceM || '-'}m`,
              statusLabel(race.status),
              <div className="workflow-actions" key={`race-action-${race.id}`}>
                {race.status === 'DRAFT' && <button className="btn btn-secondary btn-sm" onClick={() => onStatus(race.id, 'REGISTRATION_OPEN')}>Open</button>}
                {race.status === 'REGISTRATION_OPEN' && <button className="btn btn-outline btn-sm" onClick={() => onStatus(race.id, 'REGISTRATION_CLOSED')}>Close</button>}
                {race.status === 'REGISTRATION_CLOSED' && <button className="btn btn-secondary btn-sm" onClick={() => onStatus(race.id, 'STANDBY')}>Standby</button>}
                {race.status === 'REPORT_READY' && <button className="btn btn-primary btn-sm" onClick={() => onConfirmResults(race)}>Finalize</button>}
              </div>,
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

function JockeyDashboard({ data, invitations, assignments, onDecision, section }) {
  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<FiMail />} label="Invitations" value={invitations.length} color="red" />
        <StatCard icon={<GiHorseHead />} label="Assignments" value={assignments.length} color="green" />
        <StatCard icon={<FiFlag />} label="Upcoming Races" value={assignments.filter((item) => item.status !== 'WITHDRAWN').length} color="yellow" />
        <StatCard icon={<FiAward />} label="Career Points" value={data.jockeyLeaderboard[0]?.totalPoints || 0} />
      </div>}

      {(!section || section === 'invitations') && <section className="workflow-panel">
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
      </section>}

      {(!section || section === 'horse' || section === 'races') && <section className="workflow-panel">
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
      </section>}

      {section === 'achievements' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Jockey Achievements</h3><FiAward /></div>
        <CompactTable
          headers={['Rank', 'Jockey', 'Official Races', 'Points']}
          rows={data.jockeyLeaderboard.map((row, index) => [index + 1, row.jockeyName, row.totalRaces || 0, row.totalPoints || 0])}
          empty="No official jockey results yet"
        />
      </section>}
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
  onComplete,
  onSubmitReport,
  userId,
  section,
}) {
  const assignedRaces = data.races.filter((race) => Number(race.refereeId) === Number(userId));

  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<FiShield />} label="Assigned Races" value={assignedRaces.length} color="red" />
        <StatCard icon={<FiActivity />} label="Pending Checks" value={checkableRegistrations.length} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Cleared Horses" value={data.registrations.filter((item) => item.status === 'CLEARED_TO_RACE').length} color="green" />
        <StatCard icon={<FiAward />} label="Official Races" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>}

      {section === 'assigned-races' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Assigned Races</h3><FiFlag /></div>
        <CompactTable
          headers={['Race', 'Date', 'Distance', 'Status']}
          rows={assignedRaces.map((race) => [race.name, `${race.raceDate} ${shortTime(race.raceTime)}`, `${race.distanceM || '-'}m`, statusLabel(race.status)])}
          empty="No assigned races"
        />
      </section>}

      {section === 'reports' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Race Reports</h3><FiAward /></div>
        <CompactTable
          headers={['Race', 'Status', 'Report Action']}
          rows={assignedRaces.filter((race) => ['COMPLETED', 'REPORT_READY', 'OFFICIAL'].includes(race.status)).map((race) => [
            race.name,
            statusLabel(race.status),
            race.status === 'COMPLETED' ? <button key={race.id} className="btn btn-primary btn-sm" onClick={() => onSubmitReport(race.id)}>Submit Clean Report</button> : 'Submitted',
          ])}
          empty="No races are ready for reporting"
        />
      </section>}

      {(!section || section === 'monitor') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Race Control</h3>
          <FiActivity />
        </div>
        <div className="workflow-control-bar">
          <select className="form-select" value={selectedRaceId || ''} onChange={(e) => setSelectedRaceId(e.target.value)}>
            {assignedRaces.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={onStart} disabled={selectedRace?.status !== 'STANDBY'}>Start Race</button>
          <button className="btn btn-outline" onClick={onSimulate} disabled={!['IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'OFFICIAL'].includes(selectedRace?.status)}>Simulate</button>
          <button className="btn btn-outline" onClick={onComplete} disabled={selectedRace?.status !== 'IN_PROGRESS'}>Complete</button>
          <button className="btn btn-primary" onClick={onSubmitReport} disabled={selectedRace?.status !== 'COMPLETED'}>Submit Report</button>
        </div>
        {selectedRace && (
          <p className="workflow-muted inline">
            {selectedRace.name} - {statusLabel(selectedRace.status)} - {selectedRace.distanceM}m
          </p>
        )}
      </section>}

      {(!section || section === 'monitor') && selectedRaceRegistrations.length > 0 && (
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
                      {['READY_FOR_CHECK', 'APPROVED'].includes(registration.status) ? <>
                        <button className="btn btn-secondary btn-sm" onClick={() => onCheck(registration.id, true)}><FiCheckCircle /> Fit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => onCheck(registration.id, false)}><FiXCircle /> Reject</button>
                      </> : <span className="workflow-muted">Check completed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(!section || section === 'monitor') && liveTrackHorses.length > 0 && (
        <section className="workflow-panel unframed">
          <RaceTrack horses={liveTrackHorses} duration={60} isLive={selectedRace?.status === 'IN_PROGRESS'} />
        </section>
      )}

      {(!section || section === 'monitor') && simulation?.lanes?.length > 0 && (
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

function SpectatorDashboard({ data, predictionForm, setPredictionForm, onPrediction, section }) {
  const raceHorses = data.registrations
    .filter((registration) => Number(registration.raceId) === Number(predictionForm.raceId))
    .map((registration) => byId(data.horses, registration.horseId))
    .filter(Boolean);
  const selectableHorses = raceHorses.length ? raceHorses : data.horses;

  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<FiFlag />} label="Open Races" value={data.races.filter((race) => race.status === 'REGISTRATION_OPEN').length} color="red" />
        <StatCard icon={<FiActivity />} label="Predictions" value={data.predictions.length} color="green" />
        <StatCard icon={<FiAward />} label="Top Horse Points" value={data.horseLeaderboard[0]?.totalPoints || 0} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Official Races" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>}

      {(!section || section === 'races' || section === 'guesses') && <div className="workflow-grid two">
        {(!section || section === 'races') && <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Race Guess</h3>
            <FiAward />
          </div>
          <form className="workflow-form" onSubmit={onPrediction}>
            <select className="form-select" value={predictionForm.raceId} onChange={(e) => setPredictionForm({ ...predictionForm, raceId: Number(e.target.value), predictedHorseId: selectableHorses[0]?.id || '' })}>
              {data.races.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
            </select>
            <select className="form-select" value={predictionForm.predictedHorseId || ''} onChange={(e) => setPredictionForm({ ...predictionForm, predictedHorseId: Number(e.target.value) })}>
              {selectableHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
            </select>
            <button className="btn btn-primary" type="submit">Save Guess</button>
          </form>
        </section>}

        {(!section || section === 'guesses') && <section className="workflow-panel">
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
        </section>}
      </div>}

      {(!section || section === 'leaderboard') && <section className="workflow-panel">
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
      </section>}
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
