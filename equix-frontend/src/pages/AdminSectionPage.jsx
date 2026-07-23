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
  FiXCircle,
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import { useAuth } from '../contexts/useAuth';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { api } from '../services/api';
import { translateText } from '../utils/vietnameseLocalization';
import './DashboardPage.css';
import './AdminSectionPage.css';

const SECTION_CONFIG = {
  accounts: {
    title: 'Quản lý tài khoản',
    subtitle: 'Kiểm tra danh tính, trạng thái phê duyệt, vai trò và quyền truy cập tài khoản.',
    icon: <FiUsers />,
  },
  tournaments: {
    title: 'Quản lý giải đấu',
    subtitle: 'Tạo giải đấu và quản lý trạng thái mở hoặc đóng.',
    icon: <FiFlag />,
  },
  horses: {
    title: 'Danh mục ngựa',
    subtitle: 'Kiểm tra ngựa đã đăng ký, chủ sở hữu, sức khỏe và trạng thái thi đấu.',
    icon: <GiHorseHead />,
  },
  jockeys: {
    title: 'Quản lý nài ngựa',
    subtitle: 'Kiểm tra hồ sơ nài ngựa và quản lý quyền truy cập tài khoản.',
    icon: <GiHorseshoe />,
  },
  referees: {
    title: 'Quản lý trọng tài',
    subtitle: 'Tạo tài khoản trọng tài đã xác minh và quản lý quyền truy cập.',
    icon: <FiShield />,
  },
  results: {
    title: 'Kết quả chính thức',
    subtitle: 'Xem lại thứ hạng về đích, điểm và các trường hợp bị loại.',
    icon: <FiCheckCircle />,
  },
  guesses: {
    title: 'Dự đoán của khán giả',
    subtitle: 'Kiểm tra lựa chọn của khán giả và trạng thái quyết toán theo từng cuộc đua.',
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
  return user?.fullName || user?.username || user?.email || 'Người dùng không xác định';
}

function displayDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('vi-VN');
}

function searchable(...values) {
  return values.filter((value) => value !== null && value !== undefined).join(' ').toLowerCase();
}

function StatusPill({ value }) {
  const positive = ['VERIFIED', 'OPEN', 'OFFICIAL', 'WON', 'HEALTHY', 'AVAILABLE', 'CLEARED_TO_RACE'];
  const negative = ['SUSPENDED', 'REJECTED', 'CLOSED', 'LOST', 'INJURED', 'DISQUALIFIED'];
  const tone = positive.includes(value) ? 'positive' : negative.includes(value) ? 'negative' : 'neutral';
  return <span className={`admin-status ${tone}`}>{translateText(String(value || 'Không xác định').replaceAll('_', ' '))}</span>;
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
  const [rejectAccount, setRejectAccount] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [roleAccount, setRoleAccount] = useState(null);
  const [roleForm, setRoleForm] = useState({ role: 'HORSE_OWNER', reason: '' });

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
      setError(translateText(requestError.message || 'Không thể tải khu vực quản trị này.'));
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
      setError(translateText(actionError.message || 'Không thể hoàn thành thao tác đã yêu cầu.'));
    } finally {
      setActionKey('');
    }
  };

  const updateAccountStatus = (account, status, reason = '') => runAction(
    `user-${account.id}`,
    `${displayUser(account)} hiện có trạng thái ${translateText(status)}.`,
    () => api.updateUserStatus(account.id, { status, reason }),
  );

  const deleteAccount = (account) => {
    if (!window.confirm(`Xóa ${displayUser(account)} khỏi danh sách tài khoản đang hoạt động?`)) return;
    runAction(
      `user-${account.id}`,
      `Đã xóa ${displayUser(account)} khỏi danh sách tài khoản đang hoạt động.`,
      () => api.deleteUser(account.id),
    );
  };

  const openRoleChange = (account) => {
    const role = ['HORSE_OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'].find((value) => value !== account.role) || 'SPECTATOR';
    setRoleAccount(account);
    setRoleForm({ role, reason: '' });
  };

  const submitRoleChange = (event) => {
    event.preventDefault();
    runAction(`user-${roleAccount.id}`, `${displayUser(roleAccount)} hiện có vai trò ${translateText(roleForm.role)}.`, async () => {
      await api.updateUserRole(roleAccount.id, { role: roleForm.role, reason: roleForm.reason.trim() });
      setRoleAccount(null);
      setRoleForm({ role: 'HORSE_OWNER', reason: '' });
    });
  };

  const submitTournament = (event) => {
    event.preventDefault();
    runAction('create-tournament', 'Đã tạo giải đấu.', async () => {
      await api.createTournament(tournamentForm);
      setTournamentForm(INITIAL_TOURNAMENT);
    });
  };

  const toggleTournament = (tournament) => {
    const status = tournament.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    runAction(
      `tournament-${tournament.id}`,
      `${tournament.name} hiện có trạng thái ${translateText(status)}.`,
      () => api.updateTournament(tournament.id, { ...tournament, status }),
    );
  };

  const deleteTournament = (tournament) => {
    if (!window.confirm(`Xóa giải đấu “${tournament.name}”? Chỉ giải chưa mở đăng ký hoặc đã hủy mới được phép xóa.`)) return;
    runAction(
      `tournament-${tournament.id}`,
      `Đã xóa giải đấu ${tournament.name}.`,
      () => api.deleteTournament(tournament.id),
    );
  };

  const deleteHorse = (horse) => {
    if (!window.confirm(`Xóa ngựa “${horse.horseName}”? Hãy rút đăng ký đang hoạt động trước khi xóa.`)) return;
    runAction(
      `horse-${horse.id}`,
      `Đã xóa ngựa ${horse.horseName}.`,
      () => api.deleteHorse(horse.id),
    );
  };

  const submitReferee = (event) => {
    event.preventDefault();
    runAction('create-referee', 'Đã tạo tài khoản trọng tài và xác minh.', async () => {
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
          <FiRefreshCw className={loading ? 'admin-spin' : ''} /> Làm mới
        </button>
      </div>

      <ToastNotification
        message={error || success}
        type={error ? 'error' : 'success'}
        onDismiss={() => { setError(''); setSuccess(''); }}
      />

      {rejectAccount && <section className="workflow-panel admin-rejection-panel">
        <div className="workflow-panel-heading"><div><h3>Từ chối tài khoản</h3><p>Cần nhập lý do cụ thể cho {displayUser(rejectAccount)}.</p></div><FiXCircle /></div>
        <form className="workflow-form" onSubmit={(event) => { event.preventDefault(); updateAccountStatus(rejectAccount, 'REJECTED', rejectReason.trim()); setRejectAccount(null); setRejectReason(''); }}>
          <label className="form-field"><span className="form-field-label">Lý do từ chối (tối thiểu 20 ký tự)</span><textarea className="form-input admin-textarea" minLength="20" maxLength="1000" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} required /></label>
          <div className="workflow-actions"><button className="btn btn-danger" type="submit" disabled={rejectReason.trim().length < 20}>Từ chối tài khoản</button><button className="btn btn-ghost" type="button" onClick={() => { setRejectAccount(null); setRejectReason(''); }}>Hủy</button></div>
        </form>
      </section>}

      {section === 'accounts' && roleAccount && <section className="workflow-panel admin-rejection-panel">
        <div className="workflow-panel-heading"><div><h3>Đổi vai trò</h3><p>{displayUser(roleAccount)} hiện có vai trò {translateText(roleAccount.role)}.</p></div><FiUsers /></div>
        <form className="workflow-form" onSubmit={submitRoleChange}>
          <label className="form-field"><span className="form-field-label">Vai trò mới</span><select className="form-select" value={roleForm.role} onChange={(event) => setRoleForm({ ...roleForm, role: event.target.value })}>{['HORSE_OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR'].filter((role) => role !== roleAccount.role).map((role) => <option key={role} value={role}>{translateText(role)}</option>)}</select></label>
          <label className="form-field"><span className="form-field-label">Lý do (tối thiểu 20 ký tự)</span><textarea className="form-input admin-textarea" minLength="20" maxLength="1000" value={roleForm.reason} onChange={(event) => setRoleForm({ ...roleForm, reason: event.target.value })} required /></label>
          <div className="workflow-actions"><button className="btn btn-primary" type="submit" disabled={roleForm.reason.trim().length < 20}>Đổi vai trò</button><button className="btn btn-ghost" type="button" onClick={() => setRoleAccount(null)}>Hủy</button></div>
        </form>
      </section>}

      {(section === 'tournaments' || section === 'referees') && (
        <div className="workflow-grid two admin-create-grid">
          {section === 'tournaments' && (
            <section className="workflow-panel">
              <div className="workflow-panel-heading"><h3>Tạo giải đấu</h3><FiPlus /></div>
              <form className="workflow-form" onSubmit={submitTournament}>
                <label className="form-field">
                  <span className="form-field-label">Tên giải đấu</span>
                  <input className="form-input" placeholder="Ví dụ: Cúp Đua Ngựa Quốc Gia" value={tournamentForm.name} onChange={(event) => setTournamentForm({ ...tournamentForm, name: event.target.value })} required />
                </label>
                <label className="form-field">
                  <span className="form-field-label">Địa điểm</span>
                  <input className="form-input" placeholder="Ví dụ: Thành phố Hồ Chí Minh" value={tournamentForm.location} onChange={(event) => setTournamentForm({ ...tournamentForm, location: event.target.value })} required />
                </label>
                <label className="form-field">
                  <span className="form-field-label">Mô tả</span>
                  <textarea className="form-input admin-textarea" placeholder="Thông tin giải đấu (không bắt buộc)" value={tournamentForm.description} onChange={(event) => setTournamentForm({ ...tournamentForm, description: event.target.value })} />
                </label>
                <div className="workflow-form-row">
                  <label className="form-field"><span className="form-field-label">Ngày bắt đầu</span><input className="form-input" type="date" value={tournamentForm.startDate} onChange={(event) => setTournamentForm({ ...tournamentForm, startDate: event.target.value })} required /></label>
                  <label className="form-field"><span className="form-field-label">Ngày kết thúc</span><input className="form-input" type="date" value={tournamentForm.endDate} onChange={(event) => setTournamentForm({ ...tournamentForm, endDate: event.target.value })} required /></label>
                  <label className="form-field"><span className="form-field-label">Hạn rút đăng ký</span><select className="form-select" value={tournamentForm.gracePeriodHours} onChange={(event) => setTournamentForm({ ...tournamentForm, gracePeriodHours: Number(event.target.value) })}><option value="72">3 ngày (72 giờ)</option><option value="120">5 ngày (mặc định)</option><option value="168">7 ngày (168 giờ)</option></select></label>
                </div>
                <button className="btn btn-primary" disabled={actionKey === 'create-tournament'}>{actionKey === 'create-tournament' ? 'Đang tạo...' : 'Tạo giải đấu'}</button>
              </form>
            </section>
          )}

          {section === 'referees' && (
            <section className="workflow-panel">
              <div className="workflow-panel-heading"><h3>Tạo trọng tài</h3><FiPlus /></div>
              <form className="workflow-form" onSubmit={submitReferee}>
                <div className="workflow-form-row">
                  <label className="form-field">
                    <span className="form-field-label">Tên đăng nhập</span>
                    <input className="form-input" placeholder="Ví dụ: trongtai.an" value={refereeForm.username} onChange={(event) => setRefereeForm({ ...refereeForm, username: event.target.value })} minLength="3" required />
                  </label>
                  <label className="form-field">
                    <span className="form-field-label">Họ và tên</span>
                    <input className="form-input" placeholder="Ví dụ: Nguyễn Văn An" value={refereeForm.fullName} onChange={(event) => setRefereeForm({ ...refereeForm, fullName: event.target.value })} required />
                  </label>
                </div>
                <label className="form-field">
                  <span className="form-field-label">Địa chỉ email</span>
                  <input className="form-input" type="email" placeholder="referee@equix.com" value={refereeForm.email} onChange={(event) => setRefereeForm({ ...refereeForm, email: event.target.value })} required />
                </label>
                <label className="form-field">
                  <span className="form-field-label">Mật khẩu tạm thời</span>
                  <input className="form-input" type="password" placeholder="Ít nhất 8 ký tự, gồm một chữ cái và một chữ số" value={refereeForm.password} onChange={(event) => setRefereeForm({ ...refereeForm, password: event.target.value })} minLength="8" required />
                </label>
                <label className="form-field">
                  <span className="form-field-label">Số điện thoại (không bắt buộc)</span>
                  <input className="form-input" placeholder="e.g. 0901234567" value={refereeForm.phone} onChange={(event) => setRefereeForm({ ...refereeForm, phone: event.target.value })} />
                </label>
                <button className="btn btn-primary" disabled={actionKey === 'create-referee'}>{actionKey === 'create-referee' ? 'Đang tạo...' : 'Tạo trọng tài đã xác minh'}</button>
              </form>
            </section>
          )}

          <section className="workflow-panel admin-summary-panel">
             <div className="workflow-panel-heading"><h3>Tóm tắt khu vực</h3>{config.icon}</div>
            <strong>{section === 'tournaments' ? data.tournaments.length : data.users.length}</strong>
             <p>{section === 'tournaments' ? 'giải đấu hiện có' : 'tài khoản trọng tài đang hoạt động'}</p>
          </section>
        </div>
      )}

      <section className="workflow-panel unframed admin-data-panel">
        <div className="admin-toolbar">
          <label className="form-field admin-toolbar-field admin-search-field">
            <span className="form-field-label">Tìm kiếm</span>
            <span className="admin-search">
              <FiSearch aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm trong ${config.title.toLowerCase()}`} />
            </span>
          </label>
          {section !== 'results' && (
            <label className="form-field admin-toolbar-field">
              <span className="form-field-label">Trạng thái</span>
              <select className="form-select compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((status) => <option key={status} value={status}>{translateText(status.replaceAll('_', ' '))}</option>)}
              </select>
            </label>
          )}
        </div>

        {loading ? (
          <div className="admin-loading"><span className="spinner spinner-lg" /><span>Đang tải {config.title.toLowerCase()}...</span></div>
        ) : (
          <div className="workflow-table-wrap">
            {(section === 'accounts' || section === 'jockeys' || section === 'referees') && (
              <table className="data-table admin-table">
                <thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Point</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {visibleUsers.map((account) => (
                    <tr key={account.id}>
                      <td><strong>{displayUser(account)}</strong><small>@{account.username}</small></td>
                      <td>{account.email}</td>
                      <td>{translateText(account.role)}</td>
                      <td><StatusPill value={account.status} /></td>
                      <td>{Number(account.rewardPoints || 0).toLocaleString()}</td>
                      <td><div className="workflow-actions">
                        {account.status !== 'VERIFIED' && <button className="btn btn-secondary btn-sm" disabled={actionKey === `user-${account.id}`} onClick={() => updateAccountStatus(account, 'VERIFIED')}>Xác minh</button>}
                        {account.status === 'PENDING' && <button className="btn btn-outline btn-sm" disabled={actionKey === `user-${account.id}`} onClick={() => setRejectAccount(account)}>Từ chối</button>}
                        {account.status === 'VERIFIED' && account.id !== user?.id && <button className="btn btn-outline btn-sm" disabled={actionKey === `user-${account.id}`} onClick={() => updateAccountStatus(account, 'SUSPENDED')}>Tạm khóa</button>}
                        {section === 'accounts' && account.role !== 'ADMIN' && <button className="btn btn-outline btn-sm" disabled={actionKey === `user-${account.id}`} onClick={() => openRoleChange(account)}>Đổi vai trò</button>}
                        {section === 'accounts' && account.id !== user?.id && <button className="btn btn-danger btn-sm admin-icon-button" disabled={actionKey === `user-${account.id}`} onClick={() => deleteAccount(account)} aria-label={`Xóa ${displayUser(account)}`}><FiTrash2 /></button>}
                      </div></td>
                    </tr>
                  ))}
                  {!visibleUsers.length && <EmptyRow columns={6}>Không có tài khoản phù hợp.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'tournaments' && (
              <table className="data-table admin-table">
                <thead><tr><th>Giải đấu</th><th>Địa điểm</th><th>Thời gian</th><th>Trạng thái</th><th>Thời hạn rút</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {visibleTournaments.map((tournament) => (
                    <tr key={tournament.id}>
                      <td><strong>{tournament.name}</strong><small>{tournament.description || 'Không có mô tả'}</small></td>
                      <td>{tournament.location || '—'}</td>
                      <td>{displayDate(tournament.startDate)} – {displayDate(tournament.endDate)}</td>
                      <td><StatusPill value={tournament.status} /></td>
                      <td>{tournament.gracePeriodHours ?? 120} giờ</td>
                      <td><div className="workflow-actions">
                        <button className="btn btn-outline btn-sm" disabled={actionKey === `tournament-${tournament.id}`} onClick={() => toggleTournament(tournament)}>{tournament.status === 'OPEN' ? 'Đóng' : 'Mở'}</button>
                        <button className="btn btn-danger btn-sm admin-icon-button" disabled={actionKey === `tournament-${tournament.id}`} onClick={() => deleteTournament(tournament)} aria-label={`Xóa giải đấu ${tournament.name}`} title="Chỉ xóa được khi các cuộc đua còn ở bản nháp hoặc đã hủy"><FiTrash2 /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!visibleTournaments.length && <EmptyRow columns={6}>Không có giải đấu phù hợp.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'horses' && (
              <table className="data-table admin-table">
                <thead><tr><th>Ngựa</th><th>Chủ ngựa</th><th>Giống</th><th>Tuổi</th><th>Sức khỏe</th><th>Trạng thái</th><th>Thành tích</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {visibleHorses.map((horse) => (
                    <tr key={horse.id}>
                      <td><strong>{horse.horseName}</strong><small>{horse.registrationNumber || `Ngựa #${horse.id}`}</small></td>
                      <td>{displayUser(byId(data.users, horse.ownerId))}</td>
                      <td>{horse.breed || '—'}</td>
                      <td>{horse.age ?? '—'}</td>
                      <td><StatusPill value={horse.healthStatus} /></td>
                      <td><StatusPill value={horse.status} /></td>
                      <td>{horse.totalWins || 0} trận thắng / {horse.totalRaces || 0} cuộc đua</td>
                      <td><button className="btn btn-danger btn-sm admin-icon-button" disabled={actionKey === `horse-${horse.id}`} onClick={() => deleteHorse(horse)} aria-label={`Xóa ngựa ${horse.horseName}`} title="Ngựa phải được rút khỏi đăng ký và ghép cặp đang hoạt động trước khi xóa"><FiTrash2 /></button></td>
                    </tr>
                  ))}
                  {!visibleHorses.length && <EmptyRow columns={8}>Không có ngựa phù hợp.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'results' && (
              <table className="data-table admin-table">
                <thead><tr><th>Cuộc đua</th><th>Vị trí</th><th>Ngựa</th><th>Nài ngựa</th><th>Thời gian về đích</th><th>Point</th><th>Quyết định</th></tr></thead>
                <tbody>
                  {visibleResults.map((result) => (
                    <tr key={result.id}>
                      <td>{byId(data.races, result.raceId)?.name || `Cuộc đua #${result.raceId}`}</td>
                      <td><strong>#{result.finishPosition || '—'}</strong></td>
                      <td>{byId(data.horses, result.horseId)?.horseName || `Ngựa #${result.horseId}`}</td>
                      <td>{displayUser(byId(data.users, result.jockeyId))}</td>
                      <td>{result.finishTimeSeconds ? `${result.finishTimeSeconds}s` : '—'}</td>
                      <td>{result.pointsAwarded || 0}</td>
                      <td>{result.disqualified ? <StatusPill value="DISQUALIFIED" /> : <StatusPill value={result.official ? 'OFFICIAL' : 'PROVISIONAL'} />}{result.violationNotes && <small>{result.violationNotes}</small>}</td>
                    </tr>
                  ))}
                  {!visibleResults.length && <EmptyRow columns={7}>Chưa ghi nhận kết quả chính thức.</EmptyRow>}
                </tbody>
              </table>
            )}

            {section === 'guesses' && (
              <table className="data-table admin-table">
                <thead><tr><th>Khán giả</th><th>Cuộc đua</th><th>Ngựa đã chọn</th><th>Trạng thái</th><th>Phần thưởng</th><th>Ngày tạo</th></tr></thead>
                <tbody>
                  {visiblePredictions.map((prediction) => (
                    <tr key={prediction.id}>
                      <td>{displayUser(byId(data.users, prediction.spectatorId))}</td>
                      <td>{byId(data.races, prediction.raceId)?.name || `Cuộc đua #${prediction.raceId}`}</td>
                      <td>{byId(data.horses, prediction.predictedHorseId)?.horseName || `Ngựa #${prediction.predictedHorseId}`}</td>
                      <td><StatusPill value={prediction.status} /></td>
                      <td>{prediction.rewardPoints || 0}</td>
                      <td>{displayDate(prediction.createdAt)}</td>
                    </tr>
                  ))}
                  {!visiblePredictions.length && <EmptyRow columns={6}>Không có dự đoán khán giả phù hợp.</EmptyRow>}
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
