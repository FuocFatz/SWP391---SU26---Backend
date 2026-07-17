import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiEye,
  FiFlag,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import { useAuth } from '../contexts/useAuth';
import { api } from '../services/api';
import './DashboardPage.css';
import './AdminSectionPage.css';

const SECTION_CONFIG = {
  accounts: {
    title: 'Account Management',
    subtitle: 'Review identities, approval state, roles and account access.',
    icon: <FiUsers />,
  },
  tournaments: {
    title: 'Tournament Management',
    subtitle: 'Create tournaments and control whether they are open or closed.',
    icon: <FiFlag />,
  },
  horses: {
    title: 'Horse Registry',
    subtitle: 'Inspect registered horses, ownership, health and competition status.',
    icon: <GiHorseHead />,
  },
  jockeys: {
    title: 'Jockey Management',
    subtitle: 'Review jockey profiles and control account access.',
    icon: <GiHorseshoe />,
  },
  referees: {
    title: 'Referee Management',
    subtitle: 'Create verified referee accounts and manage their access.',
    icon: <FiShield />,
  },
  results: {
    title: 'Official Results',
    subtitle: 'Review recorded finish positions, points and disqualifications.',
    icon: <FiCheckCircle />,
  },
  guesses: {
    title: 'Spectator Guesses',
    subtitle: 'Inspect spectator selections and settlement status across races.',
    icon: <FiEye />,
  },
};

const EMPTY_DATA = {
  users: [],
  tournaments: [],
  horses: [],
  races: [],
  results: [],
  predictions: [],
};

const INITIAL_TOURNAMENT = {
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  status: 'OPEN',
  gracePeriodHours: 120,
};

const INITIAL_REFEREE = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  phone: '',
};

function byId(items, id) {
  return items.find((item) => Number(item.id) === Number(id));
}

function displayUser(user) {
  return user?.fullName || user?.username || user?.email || 'Unknown user';
}

function displayDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
}

function searchable(...values) {
  return values.filter((value) => value !== null && value !== undefined).join(' ').toLowerCase();
}

function StatusPill({ value }) {
  const positive = ['VERIFIED', 'OPEN', 'OFFICIAL', 'WON', 'HEALTHY', 'AVAILABLE', 'CLEARED_TO_RACE'];
  const negative = ['SUSPENDED', 'REJECTED', 'CLOSED', 'LOST', 'INJURED', 'DISQUALIFIED'];
  const tone = positive.includes(value) ? 'positive' : negative.includes(value) ? 'negative' : 'neutral';
  return <span className={`admin-status ${tone}`}>{String(value || 'UNKNOWN').replaceAll('_', ' ')}</span>;
}

function EmptyRow({ columns, children }) {
  return <tr><td className="admin-empty-cell" colSpan={columns}>{children}</td></tr>;
}

function AdminSectionPage({ section }) {
  const { user } = useAuth();
  const config = SECTION_CONFIG[section];
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionKey, setActionKey] = useState('');
  const [tournamentForm, setTournamentForm] = useState(INITIAL_TOURNAMENT);
  const [refereeForm, setRefereeForm] = useState(INITIAL_REFEREE);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = { ...EMPTY_DATA };
      if (section === 'accounts') {
        next.users = await api.getUsers();
      } else if (section === 'tournaments') {
        next.tournaments = await api.getTournaments();
      } else if (section === 'horses') {
        [next.horses, next.users] = await Promise.all([api.getHorses(), api.getUsers()]);
      } else if (section === 'jockeys') {
        next.users = await api.getUsersByRole('JOCKEY');
      } else if (section === 'referees') {
        next.users = await api.getUsersByRole('REFEREE');
      } else if (section === 'results') {
        [next.races, next.horses, next.users] = await Promise.all([
          api.getRaces(),
          api.getHorses(),
          api.getUsers(),
        ]);
        const resultGroups = await Promise.all(next.races.map((race) => api.getResults(race.id)));
        next.results = resultGroups.flat();
      } else if (section === 'guesses') {
        [next.predictions, next.races, next.horses, next.users] = await Promise.all([
          api.getPredictions(),
          api.getRaces(),
          api.getHorses(),
          api.getUsers(),
        ]);
      }
      setData(next);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this admin section.');
      setData({ ...EMPTY_DATA });
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const runAction = async (key, successMessage, action) => {
    setActionKey(key);
    setError('');
    setSuccess('');
    try {
      await action();
      setSuccess(successMessage);
      await loadData();
    } catch (actionError) {
      setError(actionError.message || 'The requested action could not be completed.');
    } finally {
      setActionKey('');
    }
  };

  const updateAccountStatus = (account, status) => runAction(
    `user-${account.id}`,
    `${displayUser(account)} is now ${status.toLowerCase()}.`,
    () => api.updateUserStatus(account.id, { status, reason: status === 'REJECTED' ? 'Rejected by administrator' : '' }),
  );

  const deleteAccount = (account) => {
    if (!window.confirm(`Remove ${displayUser(account)} from active accounts?`)) return;
    runAction(
      `user-${account.id}`,
      `${displayUser(account)} was removed from active accounts.`,
      () => api.deleteUser(account.id),
    );
  };

  const submitTournament = (event) => {
    event.preventDefault();
    runAction('create-tournament', 'Tournament created.', async () => {
      await api.createTournament(tournamentForm);
      setTournamentForm(INITIAL_TOURNAMENT);
    });
  };

  const toggleTournament = (tournament) => {
    const status = tournament.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    runAction(
      `tournament-${tournament.id}`,
      `${tournament.name} is now ${status.toLowerCase()}.`,
      () => api.updateTournament(tournament.id, { ...tournament, status }),
    );
  };

  const submitReferee = (event) => {
    event.preventDefault();
    runAction('create-referee', 'Verified referee account created.', async () => {
      await api.createReferee(refereeForm);
      setRefereeForm(INITIAL_REFEREE);
    });
  };

  const visibleUsers = useMemo(() => data.users.filter((account) => {
    const matchesQuery = searchable(account.fullName, account.username, account.email, account.role, account.status).includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'ALL' || account.status === statusFilter);
  }), [data.users, query, statusFilter]);

  const visibleTournaments = useMemo(() => data.tournaments.filter((tournament) => (
    searchable(tournament.name, tournament.location, tournament.status, tournament.description).includes(query.toLowerCase())
      && (statusFilter === 'ALL' || tournament.status === statusFilter)
  )), [data.tournaments, query, statusFilter]);

  const visibleHorses = useMemo(() => data.horses.filter((horse) => {
    const owner = byId(data.users, horse.ownerId);
    return searchable(horse.horseName, horse.registrationNumber, horse.breed, horse.status, horse.healthStatus, displayUser(owner)).includes(query.toLowerCase())
      && (statusFilter === 'ALL' || horse.status === statusFilter || horse.healthStatus === statusFilter);
  }), [data.horses, data.users, query, statusFilter]);

  const visibleResults = useMemo(() => data.results.filter((result) => {
    const race = byId(data.races, result.raceId);
    const horse = byId(data.horses, result.horseId);
    return searchable(race?.name, horse?.horseName, result.finishPosition, result.pointsAwarded, result.violationNotes).includes(query.toLowerCase());
  }), [data.results, data.races, data.horses, query]);

  const visiblePredictions = useMemo(() => data.predictions.filter((prediction) => {
    const race = byId(data.races, prediction.raceId);
    const horse = byId(data.horses, prediction.predictedHorseId);
    const spectator = byId(data.users, prediction.spectatorId);
    return searchable(race?.name, horse?.horseName, displayUser(spectator), prediction.status).includes(query.toLowerCase())
      && (statusFilter === 'ALL' || prediction.status === statusFilter);
  }), [data.predictions, data.races, data.horses, data.users, query, statusFilter]);

  const statusOptions = section === 'tournaments'
    ? ['ALL', 'OPEN', 'CLOSED']
    : section === 'horses'
      ? ['ALL', 'AVAILABLE', 'REGISTERED', 'RACING', 'HEALTHY', 'INJURED']
      : section === 'guesses'
        ? ['ALL', 'ACTIVE', 'WON', 'LOST']
        : ['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'];

  return (
    <div className="dashboard-page admin-section-page" id={`admin-${section}-page`}>
      <div className="dash-header dash-header-row">
        <div className="admin-title-wrap">
          <span className="admin-title-icon">{config.icon}</span>
          <div>
            <h1 className="dash-title">{config.title}</h1>
            <p className="dash-subtitle">{config.subtitle}</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={loadData} disabled={loading}>
          <FiRefreshCw className={loading ? 'admin-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="dash-message warning" role="alert">{error}</div>}
      {success && <div className="dash-message success" role="status">{success}</div>}

      {(section === 'tournaments' || section === 'referees') && (
        <div className="workflow-grid two admin-create-grid">
          {section === 'tournaments' && (
            <section className="workflow-panel">
              <div className="workflow-panel-heading"><h3>Create Tournament</h3><FiPlus /></div>
              <form className="workflow-form" onSubmit={submitTournament}>
                <input className="form-input" placeholder="Tournament name" value={tournamentForm.name} onChange={(event) => setTournamentForm({ ...tournamentForm, name: event.target.value })} required />
                <input className="form-input" placeholder="Location" value={tournamentForm.location} onChange={(event) => setTournamentForm({ ...tournamentForm, location: event.target.value })} required />
                <textarea className="form-input admin-textarea" placeholder="Description" value={tournamentForm.description} onChange={(event) => setTournamentForm({ ...tournamentForm, description: event.target.value })} />
                <div className="workflow-form-row">
                  <label className="admin-field-label">Start date<input className="form-input" type="date" value={tournamentForm.startDate} onChange={(event) => setTournamentForm({ ...tournamentForm, startDate: event.target.value })} required /></label>
                  <label className="admin-field-label">End date<input className="form-input" type="date" value={tournamentForm.endDate} onChange={(event) => setTournamentForm({ ...tournamentForm, endDate: event.target.value })} required /></label>
                </div>
                <button className="btn btn-primary" disabled={actionKey === 'create-tournament'}>{actionKey === 'create-tournament' ? 'Creating…' : 'Create Tournament'}</button>
              </form>
            </section>
          )}

          {section === 'referees' && (
            <section className="workflow-panel">
              <div className="workflow-panel-heading"><h3>Create Referee</h3><FiPlus /></div>
              <form className="workflow-form" onSubmit={submitReferee}>
                <div className="workflow-form-row">
                  <input className="form-input" placeholder="Username" value={refereeForm.username} onChange={(event) => setRefereeForm({ ...refereeForm, username: event.target.value })} minLength="3" required />
                  <input className="form-input" placeholder="Full name" value={refereeForm.fullName} onChange={(event) => setRefereeForm({ ...refereeForm, fullName: event.target.value })} required />
                </div>
                <input className="form-input" type="email" placeholder="Email" value={refereeForm.email} onChange={(event) => setRefereeForm({ ...refereeForm, email: event.target.value })} required />
                <input className="form-input" type="password" placeholder="Temporary password (letter + number)" value={refereeForm.password} onChange={(event) => setRefereeForm({ ...refereeForm, password: event.target.value })} minLength="8" required />
                <input className="form-input" placeholder="Phone (optional)" value={refereeForm.phone} onChange={(event) => setRefereeForm({ ...refereeForm, phone: event.target.value })} />
                <button className="btn btn-primary" disabled={actionKey === 'create-referee'}>{actionKey === 'create-referee' ? 'Creating…' : 'Create Verified Referee'}</button>
              </form>
            </section>
          )}

          <section className="workflow-panel admin-summary-panel">
            <div className="workflow-panel-heading"><h3>Section Summary</h3>{config.icon}</div>
            <strong>{section === 'tournaments' ? data.tournaments.length : data.users.length}</strong>
            <p>{section === 'tournaments' ? 'tournaments currently recorded' : 'referee accounts currently active'}</p>
          </section>
        </div>
      )}

      <section className="workflow-panel unframed admin-data-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <FiSearch />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} aria-label={`Search ${config.title}`} />
          </label>
          {section !== 'results' && (
            <select className="form-select compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
              {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="admin-loading"><span className="spinner spinner-lg" /><span>Loading {config.title.toLowerCase()}…</span></div>
        ) : (
          <div className="workflow-table-wrap">
            {(section === 'accounts' || section === 'jockeys' || section === 'referees') && (
              <table className="data-table admin-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Points</th><th>Actions</th></tr></thead>
                <tbody>
                  {visibleUsers.map((account) => (
                    <tr key={account.id}>
                      <td><strong>{displayUser(account)}</strong><small>@{account.username}</small></td>
                      <td>{account.email}</td>
                      <td>{account.role?.replaceAll('_', ' ')}</td>
                      <td><StatusPill value={account.status} /></td>
                      <td>{Number(account.rewardPoints || 0).toLocaleString()}</td>
                      <td><div className="workflow-actions">
                        {account.status !== 'VERIFIED' && <button className="btn btn-secondary btn-sm" disabled={actionKey === `user-${account.id}`} onClick={() => updateAccountStatus(account, 'VERIFIED')}>Verify</button>}
                        {account.status === 'VERIFIED' && account.id !== user?.id && <button className="btn btn-outline btn-sm" disabled={actionKey === `user-${account.id}`} onClick={() => updateAccountStatus(account, 'SUSPENDED')}>Suspend</button>}
                        {section === 'accounts' && account.id !== user?.id && <button className="btn btn-danger btn-sm admin-icon-button" disabled={actionKey === `user-${account.id}`} onClick={() => deleteAccount(account)} aria-label={`Delete ${displayUser(account)}`}><FiTrash2 /></button>}
                      </div></td>
                    </tr>
                  ))}
                  {!visibleUsers.length && <EmptyRow columns={6}>No matching accounts.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'tournaments' && (
              <table className="data-table admin-table">
                <thead><tr><th>Tournament</th><th>Location</th><th>Dates</th><th>Status</th><th>Grace period</th><th>Action</th></tr></thead>
                <tbody>
                  {visibleTournaments.map((tournament) => (
                    <tr key={tournament.id}>
                      <td><strong>{tournament.name}</strong><small>{tournament.description || 'No description'}</small></td>
                      <td>{tournament.location || '—'}</td>
                      <td>{displayDate(tournament.startDate)} – {displayDate(tournament.endDate)}</td>
                      <td><StatusPill value={tournament.status} /></td>
                      <td>{tournament.gracePeriodHours ?? 120} hours</td>
                      <td><button className="btn btn-outline btn-sm" disabled={actionKey === `tournament-${tournament.id}`} onClick={() => toggleTournament(tournament)}>{tournament.status === 'OPEN' ? 'Close' : 'Open'}</button></td>
                    </tr>
                  ))}
                  {!visibleTournaments.length && <EmptyRow columns={6}>No matching tournaments.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'horses' && (
              <table className="data-table admin-table">
                <thead><tr><th>Horse</th><th>Owner</th><th>Breed</th><th>Age</th><th>Health</th><th>Status</th><th>Record</th></tr></thead>
                <tbody>
                  {visibleHorses.map((horse) => (
                    <tr key={horse.id}>
                      <td><strong>{horse.horseName}</strong><small>{horse.registrationNumber || `Horse #${horse.id}`}</small></td>
                      <td>{displayUser(byId(data.users, horse.ownerId))}</td>
                      <td>{horse.breed || '—'}</td>
                      <td>{horse.age ?? '—'}</td>
                      <td><StatusPill value={horse.healthStatus} /></td>
                      <td><StatusPill value={horse.status} /></td>
                      <td>{horse.totalWins || 0} wins / {horse.totalRaces || 0} races</td>
                    </tr>
                  ))}
                  {!visibleHorses.length && <EmptyRow columns={7}>No matching horses.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'results' && (
              <table className="data-table admin-table">
                <thead><tr><th>Race</th><th>Position</th><th>Horse</th><th>Jockey</th><th>Finish time</th><th>Points</th><th>Decision</th></tr></thead>
                <tbody>
                  {visibleResults.map((result) => (
                    <tr key={result.id}>
                      <td>{byId(data.races, result.raceId)?.name || `Race #${result.raceId}`}</td>
                      <td><strong>#{result.finishPosition || '—'}</strong></td>
                      <td>{byId(data.horses, result.horseId)?.horseName || `Horse #${result.horseId}`}</td>
                      <td>{displayUser(byId(data.users, result.jockeyId))}</td>
                      <td>{result.finishTimeSeconds ? `${result.finishTimeSeconds}s` : '—'}</td>
                      <td>{result.pointsAwarded || 0}</td>
                      <td>{result.disqualified ? <StatusPill value="DISQUALIFIED" /> : <StatusPill value={result.official ? 'OFFICIAL' : 'PROVISIONAL'} />}{result.violationNotes && <small>{result.violationNotes}</small>}</td>
                    </tr>
                  ))}
                  {!visibleResults.length && <EmptyRow columns={7}>No official results have been recorded.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'guesses' && (
              <table className="data-table admin-table">
                <thead><tr><th>Spectator</th><th>Race</th><th>Selected horse</th><th>Status</th><th>Reward</th><th>Created</th></tr></thead>
                <tbody>
                  {visiblePredictions.map((prediction) => (
                    <tr key={prediction.id}>
                      <td>{displayUser(byId(data.users, prediction.spectatorId))}</td>
                      <td>{byId(data.races, prediction.raceId)?.name || `Race #${prediction.raceId}`}</td>
                      <td>{byId(data.horses, prediction.predictedHorseId)?.horseName || `Horse #${prediction.predictedHorseId}`}</td>
                      <td><StatusPill value={prediction.status} /></td>
                      <td>{prediction.rewardPoints || 0}</td>
                      <td>{displayDate(prediction.createdAt)}</td>
                    </tr>
                  ))}
                  {!visiblePredictions.length && <EmptyRow columns={6}>No matching spectator guesses.</EmptyRow>}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminSectionPage;
