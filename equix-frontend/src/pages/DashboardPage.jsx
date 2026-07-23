import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  FiTrash2,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { GiHorseHead, GiHorseshoe } from 'react-icons/gi';
import StatCard from '../components/StatCard/StatCard';
import RaceTrack from '../components/RaceTrack/RaceTrack';
import { createTrackHorse } from '../utils/raceTrackMapping';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import { api, resolveAssetUrl } from '../services/api';
import { validateAvatarFile } from '../utils/avatarValidation';
import { subscribeRaceRealtime } from '../services/raceRealtime';
import { translateText } from '../utils/vietnameseLocalization';
import './DashboardPage.css';

const colors = ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'];
const DEFAULT_RACE_DATE = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

function statusLabel(status) {
  const labels = {
    REGISTRATION_OPEN: 'Đang mở đăng ký',
    REGISTRATION_CLOSED: 'Đã đóng đăng ký',
    DRAFT: 'Bản nháp',
    STANDBY: 'Chờ xuất phát',
    PENDING_ADMIN: 'Chờ Quản trị viên duyệt',
    APPROVED: 'Đã duyệt',
    READY_FOR_CHECK: 'Sẵn sàng kiểm tra',
    CLEARED_TO_RACE: 'Đủ điều kiện thi đấu',
    REJECTED_BY_REFEREE: 'Bị trọng tài từ chối',
    JOCKEY_DECLINED: 'Nài ngựa đã từ chối',
    WITHDRAWN: 'Đã rút lui',
    IN_PROGRESS: 'Đang diễn ra',
    OFFICIAL: 'Chính thức',
    COMPLETED: 'Đã hoàn thành',
    REPORT_READY: 'Đã có báo cáo',
    REVISION_REQUIRED: 'Cần chỉnh sửa',
    CANCELLED: 'Đã hủy',
    PENDING: 'Đang chờ',
    ACCEPTED: 'Đã chấp nhận',
    DECLINED: 'Đã từ chối',
    WON: 'Dự đoán đúng',
    LOST: 'Dự đoán sai',
    HEALTHY: 'Khỏe mạnh',
    FIT: 'Đủ điều kiện',
  };
  return labels[status] || status || 'Không xác định';
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
  const [messageType, setMessageType] = useState('success');
  const [selectedRaceId, setSelectedRaceId] = useState(1);
  const [selectedHorseByRace, setSelectedHorseByRace] = useState({});
  const [selectedJockeyByRace, setSelectedJockeyByRace] = useState({});
  const [simulation, setSimulation] = useState(null);
  const [horseForm, setHorseForm] = useState({ horseName: '', gender: 'STALLION', breed: 'Thoroughbred', age: 4, weightKg: 450, paceStyle: 'PACE', speed: 80, stamina: 80 });
  const [raceForm, setRaceForm] = useState({
    name: '',
    type: 'Sprint',
    distanceM: 1200,
    raceDate: DEFAULT_RACE_DATE,
    raceTime: '14:00',
    maxParticipants: 12,
    prizePool: 75000,
    tournamentId: '',
    refereeId: '',
  });
  const [predictionForm, setPredictionForm] = useState({ raceId: 1, predictedHorseId: 1, wagerPoints: 10 });

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
        jockeys: api.getUsersByRole('JOCKEY'),
        jockeyLeaderboard: api.getJockeyLeaderboard(),
      });
    } else if (currentRole === 'SPECTATOR') {
      requests.predictions = api.getPredictions({ spectatorId: userId });
      requests.users = api.getMe().then((profile) => [profile]);
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
    if (failures.length) setMessageType('warning');
    setMessage(failures.length ? 'Một số dữ liệu bảng điều khiển chưa tải được. Vui lòng làm mới để thử lại.' : '');
    if (next.races.length) {
      const visibleRaces = currentRole === 'REFEREE'
        ? next.races.filter((race) => Number(race.refereeId) === Number(userId))
        : next.races;
      setSelectedRaceId((current) => visibleRaces.some((race) => Number(race.id) === Number(current)) ? current : visibleRaces[0]?.id || '');
      setPredictionForm((form) => {
        const raceId = next.races.some((race) => Number(race.id) === Number(form.raceId))
          ? form.raceId
          : next.races[0].id;
        return { ...form, raceId, predictedHorseId: '' };
      });
    }
    setLoading(false);
  }, [currentRole, user, userId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => subscribeRaceRealtime((event) => {
    const payload = event?.payload;
    if (event?.type === 'RACE_STATE' && payload?.id) {
      setData((current) => {
        const exists = current.races.some((race) => Number(race.id) === Number(payload.id));
        return {
          ...current,
          races: exists
            ? current.races.map((race) => Number(race.id) === Number(payload.id) ? payload : race)
            : [...current.races, payload],
        };
      });
    }
    if (event?.type === 'RACE_SIMULATION') {
      setSimulation(payload);
    }
  }), []);

  useEffect(() => {
    let active = true;
    const raceId = predictionForm.raceId;
    const raceExists = data.races.some((race) => Number(race.id) === Number(raceId));

    if (currentRole !== 'SPECTATOR' || !raceId || !raceExists) return undefined;

    api.getRaceRegistrations(raceId)
      .then((entries) => {
        if (!active) return;
        setData((current) => ({
          ...current,
          registrations: Array.isArray(entries) ? entries : [],
        }));
      })
      .catch((error) => {
        if (active) {
          setMessageType('error');
          setMessage(translateText(error.message || 'Không thể tải các cặp đủ điều kiện cho cuộc đua này.'));
        }
      });

    return () => { active = false; };
  }, [currentRole, data.races, predictionForm.raceId]);

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
      await loadData();
      setMessageType('success');
      setMessage(`Đã hoàn tất: ${label}`);
    } catch (err) {
      setMessageType('error');
      setMessage(translateText(err.message || `Thao tác thất bại: ${label}`));
    }
  };

  const handleCreateHorse = (event) => {
    event.preventDefault();
    execute(
      'Tạo ngựa',
      () => api.createHorse({
        ...horseForm,
        ownerId: userId,
        healthStatus: 'HEALTHY',
      }),
      () => setDemoData((current) => ({
        horses: [
          ...current.horses,
          { id: Date.now(), ...horseForm, ownerId: userId, healthStatus: 'HEALTHY', totalPoints: 0, totalWins: 0, totalRaces: 0, totalTop3: 0 },
        ],
      })),
    );
    setHorseForm({ horseName: '', gender: 'STALLION', breed: 'Thoroughbred', age: 4, weightKg: 450, paceStyle: 'PACE', speed: 80, stamina: 80 });
  };

  const handleUpdateHorse = (horseId, payload) => execute('Cập nhật ngựa', () => api.updateHorse(horseId, payload));

  const handleDeleteHorse = (horseId) => {
    if (!window.confirm('Xóa ngựa này? Trước tiên cần xử lý các ghép cặp và đăng ký đang hoạt động.')) return;
    execute('Xóa ngựa', () => api.deleteHorse(horseId));
  };

  const handleHorsePortrait = (horseId, file) => {
    const validation = validateAvatarFile(file);
    if (validation) { setMessageType('warning'); setMessage(validation.replaceAll('Avatar', 'Portrait')); return; }
    execute('Cập nhật ảnh ngựa', () => api.updateHorsePortrait(horseId, file));
  };

  const handleRegisterHorse = (raceId) => {
    const horseId = selectedHorseByRace[raceId] || ownerHorses[0]?.id;
    if (!horseId) {
      setMessageType('warning');
      setMessage('Hãy tạo ngựa trước khi đăng ký cuộc đua');
      return;
    }

    execute(
      'Đăng ký cuộc đua',
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
      setMessageType('warning');
      setMessage('Hãy tạo một ngựa sẵn sàng trước khi mời nài ngựa');
      return;
    }
    if (!jockeyId) {
      setMessageType('warning');
      setMessage('Không có tài khoản nài ngựa khả dụng');
      return;
    }

    execute(
      'Lời mời nài ngựa',
      () => api.inviteJockey({
        raceId,
        horseId,
        jockeyId,
        message: `Lời mời dành cho ${nameOf(data.horses, horseId, 'horseName', 'ngựa')}`,
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
    if (Number(raceForm.prizePool) === 0
        && !window.confirm('Cuộc đua này không có tổng điểm thưởng. Bạn có chắc không?')) {
      return;
    }
    execute(
      'Tạo cuộc đua',
      () => api.createRace({ ...raceForm, status: 'REGISTRATION_OPEN' }),
      () => setDemoData((current) => ({
        races: [...current.races, { id: Date.now(), ...raceForm, status: 'REGISTRATION_OPEN', refereeId: 3 }],
      })),
    );
    setRaceForm({ ...raceForm, name: '' });
  };

  const handleDeleteRace = (race) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cuộc đua "${race.name}"? Thao tác này chỉ thực hiện được khi cuộc đua chưa có đăng ký hoặc hoạt động liên quan.`)) return;
    execute(`Xóa cuộc đua ${race.name}`, () => api.deleteRace(race.id));
  };

  const handleInvitationDecision = (invitation, status) => {
    execute(
      `${status === 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối'} lời mời`,
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
      'Mô phỏng cuộc đua',
      async () => {
        const response = await api.simulateRace(selectedRace.id, 60);
        setSimulation(response);
      },
    );
  };

  const handleConfirmResults = (race = selectedRace, reviewedResults = null) => {
    if (!race) return;
    const runners = data.registrations.filter((item) => Number(item.raceId) === Number(race.id) && item.status === 'CLEARED_TO_RACE');
    if (!runners.length) {
      setMessageType('warning');
      setMessage('Không có ngựa đua để xác nhận kết quả');
      return;
    }

    const ordered = Number(race.id) === Number(selectedRace?.id) && simulation?.lanes?.length
      ? simulation.lanes.map((lane) => runners.find((item) => Number(item.id) === Number(lane.registrationId))).filter(Boolean)
      : runners;

    execute(
      'Xác nhận kết quả',
      () => api.confirmResults(race.id, {
        results: reviewedResults || ordered.map((registration, index) => ({
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
            horseName: horse?.horseName || `Ngựa #${registration.horseId}`,
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
      'Dự đoán',
      () => api.createPrediction(predictionForm.raceId, predictionForm),
      () => setDemoData((current) => ({
        predictions: [
          ...current.predictions,
          { id: Date.now(), ...predictionForm, spectatorId: userId, status: 'PENDING', rewardPoints: 0 },
        ],
      })),
    );
  };

  const liveTrackHorses = selectedRaceRegistrations.map((registration, index) => createTrackHorse(
    registration,
    nameOf(data.horses, registration.horseId, 'horseName', `Ngựa #${registration.horseId}`),
    nameOf([...data.users, ...data.jockeys], registration.jockeyId, 'fullName', registration.jockeyId ? `Nài ngựa #${registration.jockeyId}` : 'Chưa phân công'),
    colors[index % colors.length],
  ));

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="dash-header">
          <h1 className="dash-title">Bảng điều khiển EquiX</h1>
          <p className="dash-subtitle">Đăng nhập hoặc dùng đăng nhập nhanh để mở bảng điều khiển theo vai trò.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" id="dashboard-page">
      <div className="dash-header dash-header-row">
        <div>
          <h1 className="dash-title">{section ? translateText(section.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')) : <>Chào mừng trở lại, <span className="text-primary-color">{user.name || user.email}</span></>}</h1>
          <p className="dash-subtitle">
            {section ? `Khu vực làm việc: ${translateText(currentRole)}` : `Bảng điều khiển nghiệp vụ: ${translateText(currentRole)}`}
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadData} disabled={loading}>
          <FiRefreshCw /> Làm mới
        </button>
      </div>

      {offline && <div className="dash-message warning">Dữ liệu bảng điều khiển hiện không khả dụng. Vui lòng thử lại.</div>}
      <ToastNotification message={message} type={messageType} onDismiss={() => setMessage('')} />

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
          onUpdateHorse={handleUpdateHorse}
          onDeleteHorse={handleDeleteHorse}
          onHorsePortrait={handleHorsePortrait}
          onRegisterHorse={handleRegisterHorse}
          onInviteJockey={handleInviteJockey}
          onWithdraw={(id) => handleRegistrationPatch('Rút đăng ký', id, () => api.withdrawRegistration(id, 'Ngựa hoặc nài ngựa không sẵn sàng'), { status: 'WITHDRAWN', withdrawReason: 'Ngựa hoặc nài ngựa không sẵn sàng' })}
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
          onDeleteRace={handleDeleteRace}
          onApprove={(id) => handleRegistrationPatch('Phê duyệt đăng ký', id, () => api.approveRegistration(id), { status: 'APPROVED' })}
          onBulkApprove={() => {
            if (!window.confirm(`Phê duyệt toàn bộ ${pendingAdminRegistrations.length} đăng ký đang chờ?`)) return;
            execute('Phê duyệt đăng ký hàng loạt', () => api.approveRegistrations(pendingAdminRegistrations.map((item) => item.id)));
          }}
          onStatus={(raceId, status) => execute(`Đổi trạng thái cuộc đua thành ${statusLabel(status)}`, () => api.updateRaceStatus(raceId, status))}
          onCancelRace={(raceId, reason) => execute('Hủy cuộc đua', () => api.cancelRace(raceId, reason))}
          onRescheduleRace={(raceId, scheduledAt, reason) => execute('Đổi lịch cuộc đua', () => api.rescheduleRace(raceId, { scheduledAt, reason }))}
          onConfirmResults={handleConfirmResults}
          onRequestRevision={(raceId, reason) => execute('Yêu cầu chỉnh sửa báo cáo', () => api.requestReportRevision(raceId, reason))}
          onReassignReferee={(raceId, refereeId, reason) => execute('Đổi trọng tài', () => api.reassignReferee(raceId, { refereeId, reason }))}
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
          onCheck={(id, payload) => handleRegistrationPatch(
            payload.approved ? 'Phê duyệt kiểm tra trước đua' : 'Loại đối tượng khỏi cuộc đua',
            id,
            () => api.refereeCheck(id, payload),
            { refereeApproved: payload.approved, healthCheckStatus: payload.approved ? 'FIT' : 'NOT_FIT', status: payload.approved ? 'CLEARED_TO_RACE' : 'REJECTED_BY_REFEREE' },
          )}
          onPrepare={() => execute('Chuyển cuộc đua sang chờ xuất phát', () => api.prepareRace(selectedRace.id))}
          onStart={() => handleRegistrationPatch('Bắt đầu cuộc đua', selectedRace.id, () => api.startRace(selectedRace.id), {})}
          onComplete={() => execute('Kết thúc cuộc đua', () => api.completeRace(selectedRace.id))}
          onSubmitReport={(raceId, payload) => execute('Gửi báo cáo cuộc đua đã ký', () => api.submitRaceReport(raceId || selectedRace?.id, payload))}
          onIncident={(raceId, payload) => execute('Ghi nhận sự cố cuộc đua', () => api.addRaceIncident(raceId, payload))}
          onDnf={(registrationId, reason) => execute('Đánh dấu không về đích', () => api.markDnf(registrationId, reason))}
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
          userId={userId}
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
  onUpdateHorse,
  onDeleteHorse,
  onHorsePortrait,
  onRegisterHorse,
  onInviteJockey,
  onWithdraw,
  section,
}) {
  const readyCount = ownerRegistrations.filter((item) => ['READY_FOR_CHECK', 'CLEARED_TO_RACE'].includes(item.status)).length;
  const [editingHorse, setEditingHorse] = useState(null);
  const editingOriginal = editingHorse ? byId(ownerHorses, editingHorse.id) : null;

  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<GiHorseHead />} label="Ngựa của tôi" value={ownerHorses.length} color="red" />
        <StatCard icon={<FiFlag />} label="Lượt đăng ký" value={ownerRegistrations.length} color="green" />
        <StatCard icon={<GiHorseshoe />} label="Cặp sẵn sàng" value={readyCount} color="yellow" />
        <StatCard icon={<FiAward />} label="Point thưởng" value={nameOf(data.users, userId, 'rewardPoints', 0)} />
      </div>}

      {(!section || section === 'horses') && <div className="workflow-grid two">
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Tạo ngựa</h3>
            <FiPlus />
          </div>
          <form className="workflow-form" onSubmit={onCreateHorse}>
            <label className="form-field">
              <span className="form-field-label">Tên ngựa</span>
              <input className="form-input" placeholder="Ví dụ: Tia Chớp" value={horseForm.horseName} onChange={(e) => setHorseForm({ ...horseForm, horseName: e.target.value })} required />
            </label>
            <label className="form-field">
              <span className="form-field-label">Giới tính</span>
              <select className="form-select" value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value })}>
                <option value="STALLION">Ngựa đực</option>
                <option value="MARE">Ngựa cái</option>
                <option value="GELDING">Ngựa đực thiến</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-field-label">Giống ngựa</span>
              <input className="form-input" placeholder="Ví dụ: Thuần chủng" value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
            </label>
            <div className="workflow-form-row">
              <label className="form-field"><span className="form-field-label">Cân nặng (kg)</span><input className="form-input" type="number" min="1" value={horseForm.weightKg} onChange={(e) => setHorseForm({ ...horseForm, weightKg: Number(e.target.value) })} /></label>
              <label className="form-field"><span className="form-field-label">Chiến thuật chạy</span><select className="form-select" value={horseForm.paceStyle} onChange={(e) => setHorseForm({ ...horseForm, paceStyle: e.target.value })}><option value="FRONT">Dẫn đầu</option><option value="PACE">Giữ nhịp</option><option value="LATE">Tăng tốc cuối</option><option value="END">Nước rút</option></select><span className="workflow-muted">Chỉ dùng để hiển thị, không ảnh hưởng kết quả cuộc đua.</span></label>
            </div>
            <div className="workflow-form-row">
              <label className="form-field">
                <span className="form-field-label">Tuổi</span>
                <input className="form-input" type="number" min="1" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
              </label>
              <label className="form-field">
                <span className="form-field-label">Tốc độ (1–100)</span>
                <input className="form-input" type="number" min="1" max="100" value={horseForm.speed} onChange={(e) => setHorseForm({ ...horseForm, speed: Number(e.target.value) })} />
              </label>
              <label className="form-field">
                <span className="form-field-label">Thể lực (1–100)</span>
                <input className="form-input" type="number" min="1" max="100" value={horseForm.stamina} onChange={(e) => setHorseForm({ ...horseForm, stamina: Number(e.target.value) })} />
              </label>
            </div>
            <button className="btn btn-primary" type="submit">Tạo ngựa</button>
          </form>
        </section>

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Ngựa của tôi</h3>
            <GiHorseHead />
          </div>
          <div className="workflow-table-wrap"><table className="data-table"><thead><tr><th>Ảnh ngựa</th><th>Ngựa</th><th>Trạng thái</th><th>Vị trí</th><th>Point</th><th>Thao tác</th></tr></thead><tbody>
            {ownerHorses.map((horse) => <tr key={horse.id}>
              <td>{horse.imageUrl ? <img className="horse-portrait-thumb" src={resolveAssetUrl(horse.imageUrl)} alt={`Ảnh ngựa ${horse.horseName}`} /> : <span className="horse-portrait-placeholder"><GiHorseHead /></span>}</td>
              <td><strong>{horse.horseName}</strong><span className="workflow-muted">{horse.breed || '-'}</span></td>
              <td><StatusBadge status={horse.status} /><span className="workflow-muted">Sức khỏe: {statusLabel(horse.healthStatus)}</span></td>
              <td>{translateText(horse.paceStyle || 'PACE')}</td><td>{horse.totalPoints || 0}</td>
              <td className="workflow-actions"><button className="btn btn-outline btn-sm" onClick={() => setEditingHorse({ ...horse, fitConfirmation: false })}>Chỉnh sửa</button><label className="btn btn-ghost btn-sm">Ảnh ngựa<input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onHorsePortrait(horse.id, file); event.target.value = ''; }} /></label><button className="btn btn-ghost btn-sm" onClick={() => onDeleteHorse(horse.id)} disabled={['PAIRED', 'REGISTERED'].includes(horse.status)}>Xóa</button></td>
            </tr>)}
            {!ownerHorses.length && <tr><td colSpan="6">Chưa có ngựa</td></tr>}
          </tbody></table></div>
        </section>
      </div>}

      {(!section || section === 'horses') && editingHorse && <section className="workflow-panel">
        <div className="workflow-panel-heading"><div><h3>Chỉnh sửa ngựa</h3><p>Trạng thái đã ghép cặp hoặc đã đăng ký chỉ thay đổi theo quy trình cuộc đua.</p></div><GiHorseHead /></div>
        <form className="workflow-form" onSubmit={(event) => { event.preventDefault(); onUpdateHorse(editingHorse.id, editingHorse); setEditingHorse(null); }}>
          <div className="workflow-form-row">
            <label className="form-field"><span className="form-field-label">Tên ngựa</span><input className="form-input" value={editingHorse.horseName || ''} onChange={(event) => setEditingHorse({ ...editingHorse, horseName: event.target.value })} required /></label>
            <label className="form-field"><span className="form-field-label">Giống ngựa</span><input className="form-input" value={editingHorse.breed || ''} onChange={(event) => setEditingHorse({ ...editingHorse, breed: event.target.value })} /></label>
            <label className="form-field"><span className="form-field-label">Giới tính</span><select className="form-select" value={editingHorse.gender || 'STALLION'} onChange={(event) => setEditingHorse({ ...editingHorse, gender: event.target.value })}><option value="STALLION">Ngựa đực</option><option value="MARE">Ngựa cái</option><option value="GELDING">Ngựa đực thiến</option></select></label>
          </div>
          <div className="workflow-form-row">
            <label className="form-field"><span className="form-field-label">Tuổi</span><input className="form-input" type="number" min="1" value={editingHorse.age || ''} onChange={(event) => setEditingHorse({ ...editingHorse, age: Number(event.target.value) })} /></label>
            <label className="form-field"><span className="form-field-label">Cân nặng (kg)</span><input className="form-input" type="number" min="1" value={editingHorse.weightKg || ''} onChange={(event) => setEditingHorse({ ...editingHorse, weightKg: Number(event.target.value) })} /></label>
            <label className="form-field"><span className="form-field-label">Chiến thuật chạy</span><select className="form-select" value={editingHorse.paceStyle || 'PACE'} onChange={(event) => setEditingHorse({ ...editingHorse, paceStyle: event.target.value })}><option value="FRONT">Dẫn đầu</option><option value="PACE">Giữ nhịp</option><option value="LATE">Tăng tốc cuối</option><option value="END">Nước rút</option></select></label>
          </div>
          <div className="workflow-form-row">
            <label className="form-field"><span className="form-field-label">Trạng thái do chủ ngựa quản lý</span><select className="form-select" value={editingHorse.status || 'AVAILABLE'} onChange={(event) => setEditingHorse({ ...editingHorse, status: event.target.value, fitConfirmation: false })} disabled={['PAIRED', 'REGISTERED'].includes(editingOriginal?.status)}><option value="AVAILABLE">Sẵn sàng</option><option value="TRAINING">Đang huấn luyện</option><option value="UNAVAILABLE">Không sẵn sàng</option></select></label>
            <label className="form-field"><span className="form-field-label">Tốc độ (1–100)</span><input className="form-input" type="number" min="1" max="100" value={editingHorse.speed || ''} onChange={(event) => setEditingHorse({ ...editingHorse, speed: Number(event.target.value) })} /></label>
            <label className="form-field"><span className="form-field-label">Thể lực (1–100)</span><input className="form-input" type="number" min="1" max="100" value={editingHorse.stamina || ''} onChange={(event) => setEditingHorse({ ...editingHorse, stamina: Number(event.target.value) })} /></label>
          </div>
          {editingOriginal?.status === 'UNAVAILABLE' && editingHorse.status === 'AVAILABLE' && <label className="workflow-confirm"><input type="checkbox" checked={Boolean(editingHorse.fitConfirmation)} onChange={(event) => setEditingHorse({ ...editingHorse, fitConfirmation: event.target.checked })} /><span>Tôi xác nhận ngựa đủ thể lực và sẵn sàng thi đấu.</span></label>}
          <div className="workflow-actions"><button className="btn btn-primary" type="submit" disabled={editingOriginal?.status === 'UNAVAILABLE' && editingHorse.status === 'AVAILABLE' && !editingHorse.fitConfirmation}>Lưu ngựa</button><button className="btn btn-ghost" type="button" onClick={() => setEditingHorse(null)}>Hủy</button></div>
        </form>
      </section>}

      {(!section || section === 'jockeys' || section === 'races') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Cuộc đua đang mở</h3>
          <FiFlag />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cuộc đua</th>
                <th>Ngày</th>
                <th>Giải thưởng</th>
                <th>Ngựa</th>
                <th>Nài ngựa</th>
                <th>Thao tác</th>
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
                  <td>{money(race.prizePool)} point</td>
                  <td>
                    <select className="form-select compact" aria-label={`Ngựa cho ${race.name}`} value={selectedHorseByRace[race.id] || ownerHorses[0]?.id || ''} onChange={(e) => setSelectedHorseByRace({ ...selectedHorseByRace, [race.id]: e.target.value })}>
                      {ownerHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="form-select compact" aria-label={`Nài ngựa cho ${race.name}`} value={selectedJockeyByRace[race.id] || invitation?.jockeyId || data.jockeys[0]?.id || ''} onChange={(e) => setSelectedJockeyByRace({ ...selectedJockeyByRace, [race.id]: e.target.value })} disabled={Boolean(invitation)}>
                      {data.jockeys.map((jockey) => <option key={jockey.id} value={jockey.id}>{jockey.fullName || jockey.username || jockey.email}</option>)}
                    </select>
                    {invitation && <span className="workflow-muted">Lời mời: {statusLabel(invitation.status)}</span>}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => paired ? onRegisterHorse(race.id) : onInviteJockey(race.id)} disabled={race.status !== 'REGISTRATION_OPEN' || !ownerHorses.length || registered || invitation?.status === 'PENDING'}>
                      {registered ? 'Đã đăng ký' : paired ? 'Đăng ký cặp' : invitation?.status === 'PENDING' ? 'Đang chờ nài ngựa' : 'Mời nài ngựa'}
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
          <h3>Các cặp đã đăng ký</h3>
          <GiHorseshoe />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cuộc đua</th>
                <th>Ngựa</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {ownerRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{nameOf(data.races, registration.raceId, 'name', `Cuộc đua #${registration.raceId}`)}</td>
                  <td>{nameOf(data.horses, registration.horseId, 'horseName', `Ngựa #${registration.horseId}`)}</td>
                  <td><StatusBadge status={registration.status} /></td>
                  <td className="workflow-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => onWithdraw(registration.id)}>
                      Rút đăng ký
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>}

      {section === 'leaderboard' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Bảng xếp hạng ngựa</h3><FiAward /></div>
        <CompactTable
          headers={['Hạng', 'Ngựa', 'Chủ ngựa', 'Cuộc đua', 'Trận thắng', 'Top 3', 'Point']}
          rows={data.horseLeaderboard.map((row, index) => [index + 1, row.horseName, row.ownerName || `Chủ ngựa #${row.ownerId}`, row.totalRaces || 0, row.totalWins || 0, row.totalTop3 || 0, row.totalPoints || 0])}
          empty="Chưa có dữ liệu bảng xếp hạng"
        />
      </section>}
    </>
  );
}

function AdminDashboard({ data, raceForm, setRaceForm, pendingAdminRegistrations, onCreateRace, onDeleteRace, onApprove, onBulkApprove, onStatus, onCancelRace, onRescheduleRace, onConfirmResults, onRequestRevision, onReassignReferee }) {
  const [scheduleRaceId, setScheduleRaceId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [reportReviewRaceId, setReportReviewRaceId] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [refereeRaceId, setRefereeRaceId] = useState('');
  const [nextRefereeId, setNextRefereeId] = useState('');
  const [refereeReason, setRefereeReason] = useState('');
  const refereePanelRef = useRef(null);
  const [resultRace, setResultRace] = useState(null);
  const [resultDraft, setResultDraft] = useState([]);
  const scheduleRace = byId(data.races, scheduleRaceId) || data.races[0];
  const effectiveScheduleDate = scheduleDate || scheduleRace?.raceDate || '';
  const currentScheduleTime = shortTime(scheduleRace?.raceTime);
  const effectiveScheduleTime = scheduleTime || (currentScheduleTime === '--:--' ? '' : currentScheduleTime);
  const reassignmentRace = byId(data.races, refereeRaceId);
  const replacementReferees = data.referees.filter((referee) => (
    Number(referee.id) !== Number(reassignmentRace?.refereeId)
    && ['VERIFIED', 'ACTIVE'].includes(referee.status)
  ));

  useEffect(() => {
    if (!refereeRaceId || !refereePanelRef.current) return;
    refereePanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    refereePanelRef.current.querySelector('select')?.focus({ preventScroll: true });
  }, [refereeRaceId]);

  const scheduleLocked = ['IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'REVISION_REQUIRED', 'OFFICIAL'].includes(scheduleRace?.status);
  const submitReschedule = (event) => {
    event.preventDefault();
    if (!scheduleRace || !effectiveScheduleDate || !effectiveScheduleTime || !scheduleReason.trim()) return;
    onRescheduleRace(scheduleRace.id, `${effectiveScheduleDate}T${effectiveScheduleTime}:00`, scheduleReason.trim());
  };
  const openFinalization = async (race) => {
    const provisional = await api.getResults(race.id);
    const rows = (Array.isArray(provisional) ? provisional : []).map((result) => ({
      registrationId: result.registrationId,
      finishPosition: result.finishPosition ?? '',
      finishTimeSeconds: result.finishTimeSeconds ?? '',
      dnf: Boolean(result.dnf),
      disqualified: Boolean(result.disqualified),
      violationNotes: result.violationNotes || '',
    }));
    setResultRace(race); setResultDraft(rows);
  };
  const updateResultRow = (registrationId, patch) => setResultDraft((rows) => rows.map((row) => Number(row.registrationId) === Number(registrationId) ? { ...row, ...patch } : row));
  const resultsValid = resultDraft.length > 0 && resultDraft.every((row) => {
    const positionValid = row.dnf || row.disqualified || Number(row.finishPosition) >= 1;
    const reasonValid = !row.disqualified || row.violationNotes.trim().length >= 20;
    return positionValid && reasonValid;
  });

  return (
    <>
      <div className="dash-stats-grid">
        <StatCard icon={<FiUsers />} label="Tài khoản" value={data.users.length} color="red" />
        <StatCard icon={<FiFlag />} label="Cuộc đua" value={data.races.length} color="green" />
        <StatCard icon={<FiCheckCircle />} label="Chờ phê duyệt" value={pendingAdminRegistrations.length} color="yellow" />
        <StatCard icon={<GiHorseHead />} label="Ngựa" value={data.horses.length} />
      </div>

      <div className="workflow-grid two">
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Tạo cuộc đua</h3>
            <FiPlus />
          </div>
          <form className="workflow-form" onSubmit={onCreateRace}>
            <label className="form-field">
              <span className="form-field-label">Tên cuộc đua</span>
              <input className="form-input" placeholder="Ví dụ: Cúp Nước Rút Sài Gòn" value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })} required />
            </label>
            <div className="workflow-form-row">
              <label className="form-field">
                <span className="form-field-label">Giải đấu</span>
                <select className="form-select" value={raceForm.tournamentId} onChange={(e) => setRaceForm({ ...raceForm, tournamentId: Number(e.target.value) })} required>
                  <option value="">Chọn giải đấu</option>
                  {data.tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span className="form-field-label">Trọng tài được phân công</span>
                <select className="form-select" value={raceForm.refereeId} onChange={(e) => setRaceForm({ ...raceForm, refereeId: Number(e.target.value) })} required>
                  <option value="">Chọn trọng tài</option>
                  {data.referees.map((referee) => <option key={referee.id} value={referee.id}>{referee.fullName || referee.email}</option>)}
                </select>
              </label>
            </div>
            <div className="workflow-form-row">
              <label className="form-field">
                <span className="form-field-label">Loại cuộc đua</span>
                <select className="form-select" value={raceForm.type} onChange={(e) => {
                  const defaults = { Sprint: 1200, Mile: 1600, Medium: 2000, Long: 2600 };
                  setRaceForm({ ...raceForm, type: e.target.value, distanceM: defaults[e.target.value] });
                }}>
                  <option value="Sprint">Nước rút</option>
                  <option value="Mile">Một dặm</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Long">Đường dài</option>
                </select>
              </label>
              <label className="form-field">
                <span className="form-field-label">Cự ly (mét)</span>
                <input className="form-input" type="number" min="1000" value={raceForm.distanceM} onChange={(e) => setRaceForm({ ...raceForm, distanceM: Number(e.target.value) })} />
                <span className="workflow-muted">Nước rút 1000–1400m, Một dặm 1401–1800m, Trung bình 1801–2400m, Đường dài từ 2401m</span>
              </label>
            </div>
            <div className="workflow-form-row">
              <label className="form-field">
                <span className="form-field-label">Ngày đua</span>
                <input className="form-input" type="date" value={raceForm.raceDate} onChange={(e) => setRaceForm({ ...raceForm, raceDate: e.target.value })} />
              </label>
              <label className="form-field">
                <span className="form-field-label">Giờ bắt đầu</span>
                <input className="form-input" type="time" value={raceForm.raceTime} onChange={(e) => setRaceForm({ ...raceForm, raceTime: e.target.value })} />
              </label>
            </div>
            <div className="workflow-form-row">
              <label className="form-field">
                <span className="form-field-label">Số người tham gia tối đa</span>
                <input className="form-input" type="number" min="6" max="18" value={raceForm.maxParticipants} onChange={(e) => setRaceForm({ ...raceForm, maxParticipants: Number(e.target.value) })} />
              </label>
              <label className="form-field">
                <span className="form-field-label">Tổng điểm thưởng (point)</span>
                <input className="form-input" type="number" min="0" value={raceForm.prizePool} onChange={(e) => setRaceForm({ ...raceForm, prizePool: Number(e.target.value) })} />
              </label>
            </div>
            <button className="btn btn-primary" type="submit">Tạo cuộc đua</button>
          </form>
        </section>

        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <div>
              <h3>Danh sách cuộc đua</h3>
              <p>Quản trị viên quản lý trạng thái đăng ký; trạng thái đang đua và chính thức tiếp tục theo quy trình của Trọng tài.</p>
            </div>
            <FiFlag />
          </div>
          <CompactTable
            headers={['Cuộc đua', 'Ngày', 'Cự ly', 'Trọng tài', 'Số ngựa', 'Trạng thái', 'Thao tác']}
            rows={data.races.map((race) => [
              race.name,
              `${race.raceDate} ${shortTime(race.raceTime)}`,
              `${race.distanceM || '-'}m`,
              nameOf(data.referees, race.refereeId, 'fullName', race.refereeId ? `Trọng tài #${race.refereeId}` : 'Chưa phân công'),
              data.registrations.filter((entry) => Number(entry.raceId) === Number(race.id)
                && !['WITHDRAWN', 'CANCELLED', 'REJECTED_BY_REFEREE', 'JOCKEY_DECLINED'].includes(entry.status)).length,
              <span key={`race-status-${race.id}`}><StatusBadge status={race.status} />{race.adminReviewRequired && <span className="workflow-muted">Quản trị viên xem xét: {race.reviewReason}</span>}</span>,
              <div className="workflow-actions" key={`race-action-${race.id}`}>
                {race.status === 'DRAFT' && <button className="btn btn-secondary btn-sm" onClick={() => onStatus(race.id, 'REGISTRATION_OPEN')}>Mở đăng ký</button>}
                {['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'STANDBY'].includes(race.status) && <button type="button" className="btn btn-ghost btn-sm" aria-expanded={Number(refereeRaceId) === Number(race.id)} aria-controls="referee-reassignment-panel" onClick={() => { setRefereeRaceId(race.id); setNextRefereeId(''); setRefereeReason(''); }}>Đổi trọng tài</button>}
                {race.status === 'REGISTRATION_OPEN' && <>
                  <button className="btn btn-outline btn-sm" onClick={() => onStatus(race.id, 'REGISTRATION_CLOSED')}>Đóng đăng ký</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onStatus(race.id, 'DRAFT')}>Chuyển về bản nháp</button>
                </>}
                {race.status === 'REGISTRATION_CLOSED' && <>
                  <button className="btn btn-outline btn-sm" onClick={() => onStatus(race.id, 'REGISTRATION_OPEN')}>Mở lại đăng ký</button>
                </>}
                {race.status === 'STANDBY' && <span className="workflow-muted race-status-locked">Trọng tài đã chuẩn bị</span>}
                {race.status === 'REPORT_READY' && <>
                  <button className="btn btn-primary btn-sm" onClick={() => openFinalization(race)}>Kiểm tra và công bố</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setReportReviewRaceId(race.id)}>Yêu cầu chỉnh sửa</button>
                </>}
                {race.status === 'REVISION_REQUIRED' && <span className="workflow-muted race-status-locked">Đang chờ báo cáo chỉnh sửa</span>}
                {['IN_PROGRESS', 'COMPLETED', 'OFFICIAL', 'CANCELLED'].includes(race.status) && <span className="workflow-muted race-status-locked">Quy trình đã khóa</span>}
                {['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'CANCELLED'].includes(race.status) && <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteRace(race)} title="Chỉ xóa được cuộc đua chưa có đăng ký hoặc hoạt động liên quan"><FiTrash2 /> Xóa</button>}
              </div>,
            ])}
            empty="Chưa có cuộc đua"
          />
        </section>
      </div>

      {reportReviewRaceId && <section className="workflow-panel">
        <div className="workflow-panel-heading"><div><h3>Trả lại báo cáo trọng tài</h3><p>Bắt buộc nhập lý do cụ thể tối thiểu 20 ký tự; lý do sẽ được lưu trong nhật ký kiểm tra.</p></div><FiXCircle /></div>
        <form className="workflow-form" onSubmit={(event) => {
          event.preventDefault();
          onRequestRevision(reportReviewRaceId, revisionReason.trim());
          setReportReviewRaceId(''); setRevisionReason('');
        }}>
          <label className="form-field">
            <span className="form-field-label">Lý do yêu cầu chỉnh sửa</span>
            <textarea className="form-input" rows="3" minLength="20" maxLength="2000" value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} placeholder="Nêu rõ nội dung trọng tài cần sửa" required />
          </label>
          <div className="workflow-actions">
            <button className="btn btn-primary" type="submit" disabled={revisionReason.trim().length < 20}>Gửi yêu cầu chỉnh sửa</button>
            <button className="btn btn-ghost" type="button" onClick={() => { setReportReviewRaceId(''); setRevisionReason(''); }}>Hủy</button>
          </div>
        </form>
      </section>}

      {refereeRaceId && <section ref={refereePanelRef} id="referee-reassignment-panel" className="workflow-panel" tabIndex="-1">
        <div className="workflow-panel-heading"><div><h3>Thay trọng tài</h3><p>Đang đổi trọng tài cho <strong>{reassignmentRace?.name || `Cuộc đua #${refereeRaceId}`}</strong>. Hệ thống tự động kiểm tra trùng lịch.</p></div><FiShield /></div>
        {!replacementReferees.length && <div className="dash-message warning" role="status">Không có trọng tài đã xác minh nào khác. Hãy tạo hoặc xác minh trọng tài trong Quản trị → Trọng tài rồi thử lại.</div>}
        <form className="workflow-form" onSubmit={(event) => { event.preventDefault(); onReassignReferee(refereeRaceId, Number(nextRefereeId), refereeReason.trim()); setRefereeRaceId(''); setNextRefereeId(''); setRefereeReason(''); }}>
          <div className="workflow-form-row"><label className="form-field"><span className="form-field-label">Trọng tài thay thế</span><select className="form-select" value={nextRefereeId} onChange={(event) => setNextRefereeId(event.target.value)} disabled={!replacementReferees.length} required><option value="">Chọn trọng tài đã xác minh khác</option>{replacementReferees.map((referee) => <option key={referee.id} value={referee.id}>{referee.fullName || referee.email}</option>)}</select></label><label className="form-field"><span className="form-field-label">Lý do (tối thiểu 20 ký tự)</span><textarea className="form-input" rows="3" minLength="20" maxLength="1000" value={refereeReason} onChange={(event) => setRefereeReason(event.target.value)} disabled={!replacementReferees.length} required /></label></div>
          <div className="workflow-actions"><button className="btn btn-primary" type="submit" disabled={!replacementReferees.length || !nextRefereeId || refereeReason.trim().length < 20}>Phân công người thay thế</button><button className="btn btn-ghost" type="button" onClick={() => { setRefereeRaceId(''); setNextRefereeId(''); setRefereeReason(''); }}>Hủy</button></div>
        </form>
      </section>}

      {resultRace && <section className="workflow-panel">
        <div className="workflow-panel-heading"><div><h3>Kiểm tra kết quả chính thức</h3><p>{resultRace.name}: có thể sửa thứ hạng tạm thời; hỗ trợ đồng hạng, không về đích và loại sau cuộc đua.</p></div><FiCheckCircle /></div>
        <div className="workflow-table-wrap"><table className="data-table"><thead><tr><th>Đối tượng</th><th>Ngựa</th><th>Vị trí</th><th>Thời gian (giây)</th><th>Không về đích</th><th>Bị loại</th><th>Lý do vi phạm</th></tr></thead><tbody>
          {resultDraft.map((row) => {
            const entry = data.registrations.find((item) => Number(item.id) === Number(row.registrationId));
            return <tr key={row.registrationId}><td>#{row.registrationId}</td><td>{nameOf(data.horses, entry?.horseId, 'horseName', `Ngựa #${entry?.horseId}`)}</td><td><input className="form-input result-input" type="number" min="1" value={row.finishPosition} disabled={row.dnf || row.disqualified} onChange={(event) => updateResultRow(row.registrationId, { finishPosition: event.target.value === '' ? '' : Number(event.target.value) })} aria-label={`Vị trí của đối tượng ${row.registrationId}`} /></td><td><input className="form-input result-input" type="number" min="0" step="0.01" value={row.finishTimeSeconds} onChange={(event) => updateResultRow(row.registrationId, { finishTimeSeconds: event.target.value === '' ? null : Number(event.target.value) })} aria-label={`Thời gian về đích của đối tượng ${row.registrationId}`} /></td><td><input type="checkbox" checked={row.dnf} onChange={(event) => updateResultRow(row.registrationId, { dnf: event.target.checked, disqualified: event.target.checked ? false : row.disqualified, finishPosition: event.target.checked ? '' : row.finishPosition })} /></td><td><input type="checkbox" checked={row.disqualified} onChange={(event) => updateResultRow(row.registrationId, { disqualified: event.target.checked, dnf: event.target.checked ? false : row.dnf, finishPosition: event.target.checked ? '' : row.finishPosition })} /></td><td><textarea className="form-input result-reason" rows="2" minLength={row.disqualified ? 20 : undefined} value={row.violationNotes} onChange={(event) => updateResultRow(row.registrationId, { violationNotes: event.target.value })} placeholder={row.disqualified ? 'Bắt buộc, tối thiểu 20 ký tự' : 'Không bắt buộc'} /></td></tr>;
          })}
        </tbody></table></div>
        <p className="workflow-muted inline">Đồng hạng: đặt cùng vị trí cho các ngựa bằng hạng. Phần thưởng của các vị trí liên quan sẽ được gộp và chia đều.</p>
        <div className="workflow-actions"><button className="btn btn-primary" disabled={!resultsValid} onClick={() => { onConfirmResults(resultRace, resultDraft.map((row) => ({ ...row, finishPosition: row.finishPosition === '' ? null : Number(row.finishPosition), finishTimeSeconds: row.finishTimeSeconds === '' ? null : Number(row.finishTimeSeconds) }))); setResultRace(null); setResultDraft([]); }}>Công bố kết quả chính thức</button><button className="btn btn-ghost" onClick={() => { setResultRace(null); setResultDraft([]); }}>Hủy</button></div>
      </section>}

      <section className="workflow-panel race-schedule-panel">
        <div className="workflow-panel-heading">
          <div><h3>Điều chỉnh lịch cuộc đua</h3><p>Đổi lịch cuộc đua tương lai hoặc hủy cuộc đua; hệ thống tự động hoàn tác đăng ký và dự đoán.</p></div>
          <FiActivity />
        </div>
        <form className="race-schedule-grid" onSubmit={submitReschedule}>
          <label className="form-field">
            <span className="form-field-label">Cuộc đua</span>
            <select className="form-select" value={scheduleRace?.id || ''} onChange={(event) => {
              const nextRace = byId(data.races, event.target.value);
              setScheduleRaceId(event.target.value);
              setScheduleDate(nextRace?.raceDate || '');
              setScheduleTime(shortTime(nextRace?.raceTime) === '--:--' ? '' : shortTime(nextRace?.raceTime));
            }}>
              {data.races.map((race) => <option key={race.id} value={race.id}>{race.name} — {statusLabel(race.status)}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span className="form-field-label">Ngày đua mới</span>
            <input className="form-input" type="date" value={effectiveScheduleDate} onChange={(event) => setScheduleDate(event.target.value)} disabled={scheduleLocked} />
          </label>
          <label className="form-field">
            <span className="form-field-label">Giờ bắt đầu mới</span>
            <input className="form-input" type="time" value={effectiveScheduleTime} onChange={(event) => setScheduleTime(event.target.value)} disabled={scheduleLocked} />
          </label>
          <label className="form-field race-schedule-reason">
            <span className="form-field-label">Lý do</span>
            <input className="form-input" value={scheduleReason} onChange={(event) => setScheduleReason(event.target.value)} placeholder="Bắt buộc khi hủy hoặc đổi lịch" maxLength="1000" disabled={scheduleLocked} />
          </label>
          <div className="workflow-actions race-schedule-actions">
            <button className="btn btn-secondary" type="submit" disabled={!scheduleRace || scheduleLocked || !scheduleReason.trim() || !effectiveScheduleDate || !effectiveScheduleTime}>Đổi lịch cuộc đua</button>
            <button className="btn btn-outline" type="button" disabled={!scheduleRace || scheduleLocked || scheduleRace?.status === 'CANCELLED' || !scheduleReason.trim()} onClick={() => onCancelRace(scheduleRace.id, scheduleReason.trim())}>Hủy cuộc đua</button>
          </div>
        </form>
        {scheduleRace?.cancellationReason && <p className="workflow-muted inline"><strong>Lý do hủy:</strong> {scheduleRace.cancellationReason}</p>}
        {scheduleRace?.rescheduleReason && <p className="workflow-muted inline"><strong>Cập nhật lịch gần nhất:</strong> {scheduleRace.rescheduleReason}</p>}
      </section>

      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <div><h3>Phê duyệt đăng ký</h3><p>Duyệt từng cặp hoặc phê duyệt hàng loạt danh sách đang chờ.</p></div>
          <div className="workflow-actions">{pendingAdminRegistrations.length > 0 && <button className="btn btn-secondary btn-sm" onClick={onBulkApprove}>Phê duyệt tất cả ({pendingAdminRegistrations.length})</button>}<FiCheckCircle /></div>
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cuộc đua</th>
                <th>Ngựa</th>
                <th>Chủ ngựa</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingAdminRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{nameOf(data.races, registration.raceId, 'name', `Cuộc đua #${registration.raceId}`)}</td>
                  <td>{nameOf(data.horses, registration.horseId, 'horseName', `Ngựa #${registration.horseId}`)}</td>
                  <td>{nameOf(data.users, registration.ownerId, 'fullName', `Chủ ngựa #${registration.ownerId}`)}</td>
                  <td><StatusBadge status={registration.status} /></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => onApprove(registration.id)}>Phê duyệt</button></td>
                </tr>
              ))}
              {!pendingAdminRegistrations.length && (
                <tr><td colSpan="5">Không có đăng ký đang chờ</td></tr>
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
        <StatCard icon={<FiMail />} label="Lời mời" value={invitations.length} color="red" />
        <StatCard icon={<GiHorseHead />} label="Phân công" value={assignments.length} color="green" />
        <StatCard icon={<FiFlag />} label="Cuộc đua sắp tới" value={assignments.filter((item) => item.status !== 'WITHDRAWN').length} color="yellow" />
        <StatCard icon={<FiAward />} label="Point sự nghiệp" value={data.jockeyLeaderboard[0]?.totalPoints || 0} />
      </div>}

      {(!section || section === 'invitations') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Lời mời</h3>
          <FiMail />
        </div>
        <div className="workflow-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cuộc đua</th>
                <th>Ngựa</th>
                <th>Chủ ngựa</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>{nameOf(data.races, invitation.raceId, 'name', `Cuộc đua #${invitation.raceId}`)}</td>
                  <td>{nameOf(data.horses, invitation.horseId, 'horseName', `Ngựa #${invitation.horseId}`)}</td>
                  <td>{nameOf(data.users, invitation.ownerId, 'fullName', `Chủ ngựa #${invitation.ownerId}`)}</td>
                  <td><StatusBadge status={invitation.status} /></td>
                  <td className="workflow-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => onDecision(invitation, 'ACCEPTED')} disabled={invitation.status !== 'PENDING'}><FiCheckCircle /> Chấp nhận</button>
                    <button className="btn btn-outline btn-sm" onClick={() => onDecision(invitation, 'DECLINED')} disabled={invitation.status !== 'PENDING'}><FiXCircle /> Từ chối</button>
                  </td>
                </tr>
              ))}
              {!invitations.length && (
                <tr><td colSpan="5">Chưa có lời mời</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>}

      {(!section || section === 'horse' || section === 'races') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Phân công cuộc đua</h3>
          <GiHorseshoe />
        </div>
        <CompactTable
          headers={['Cuộc đua', 'Ngựa', 'Làn đua', 'Trạng thái']}
          rows={assignments.map((assignment) => [
            nameOf(data.races, assignment.raceId, 'name', `Cuộc đua #${assignment.raceId}`),
            nameOf(data.horses, assignment.horseId, 'horseName', `Ngựa #${assignment.horseId}`),
            assignment.laneNumber || '-',
            statusLabel(assignment.status),
          ])}
          empty="Chưa có phân công"
        />
      </section>}

      {section === 'achievements' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Thành tích nài ngựa</h3><FiAward /></div>
        <CompactTable
          headers={['Hạng', 'Nài ngựa', 'Cuộc đua chính thức', 'Point']}
          rows={data.jockeyLeaderboard.map((row, index) => [index + 1, row.jockeyName, row.totalRaces || 0, row.totalPoints || 0])}
          empty="Chưa có kết quả chính thức của nài ngựa"
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
  onPrepare,
  onStart,
  onSimulate,
  onComplete,
  onSubmitReport,
  onIncident,
  onDnf,
  userId,
  section,
}) {
  const assignedRaces = data.races.filter((race) => Number(race.refereeId) === Number(userId));
  const [disqualificationId, setDisqualificationId] = useState('');
  const [disqualificationForm, setDisqualificationForm] = useState({
    reason: '', category: 'MEDICAL', severity: 'MAJOR', notes: '', confirmationText: '',
  });
  const [reportRaceId, setReportRaceId] = useState('');
  const [reportForm, setReportForm] = useState({
    description: '', actionTaken: '', severity: 'INFO', reviewedIncidents: false, signature: '',
  });
  const [incidentForm, setIncidentForm] = useState({
    registrationId: '', category: 'OTHER', severity: 'INFO', description: '', actionTaken: '', raceTimeSeconds: '', markDnf: false,
  });
  const reportableRaces = assignedRaces.filter((race) => ['COMPLETED', 'REVISION_REQUIRED'].includes(race.status));
  const reportTarget = byId(reportableRaces, reportRaceId) || reportableRaces[0];
  const currentReportRace = section === 'reports'
    ? reportTarget
    : (['COMPLETED', 'REVISION_REQUIRED'].includes(selectedRace?.status) ? selectedRace : null);
  const clearedSelectedCount = selectedRaceRegistrations.filter((entry) => entry.status === 'CLEARED_TO_RACE').length;

  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<FiShield />} label="Cuộc đua được phân công" value={assignedRaces.length} color="red" />
        <StatCard icon={<FiActivity />} label="Chờ kiểm tra" value={checkableRegistrations.length} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Ngựa đủ điều kiện" value={data.registrations.filter((item) => item.status === 'CLEARED_TO_RACE').length} color="green" />
        <StatCard icon={<FiAward />} label="Cuộc đua chính thức" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>}

      {section === 'assigned-races' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Cuộc đua được phân công</h3><FiFlag /></div>
        <CompactTable
          headers={['Cuộc đua', 'Ngày', 'Cự ly', 'Trạng thái']}
          rows={assignedRaces.map((race) => [race.name, `${race.raceDate} ${shortTime(race.raceTime)}`, `${race.distanceM || '-'}m`, statusLabel(race.status)])}
          empty="Chưa có cuộc đua được phân công"
        />
      </section>}

      {section === 'reports' && <section className="workflow-panel">
        <div className="workflow-panel-heading"><h3>Báo cáo cuộc đua</h3><FiAward /></div>
        <CompactTable
          headers={['Cuộc đua', 'Trạng thái', 'Thao tác báo cáo']}
          rows={assignedRaces.filter((race) => ['COMPLETED', 'REPORT_READY', 'REVISION_REQUIRED', 'OFFICIAL'].includes(race.status)).map((race) => [
            race.name,
            statusLabel(race.status),
            ['COMPLETED', 'REVISION_REQUIRED'].includes(race.status)
              ? <button key={race.id} className="btn btn-primary btn-sm" onClick={() => setReportRaceId(race.id)}>Mở biểu mẫu báo cáo</button>
              : 'Đã gửi',
          ])}
          empty="Chưa có cuộc đua nào sẵn sàng để báo cáo"
        />
      </section>}

      {(!section || section === 'monitor') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Điều khiển cuộc đua</h3>
          <FiActivity />
        </div>
        <div className="workflow-control-bar">
          <label className="form-field">
            <span className="form-field-label">Cuộc đua được phân công</span>
            <select className="form-select" value={selectedRaceId || ''} onChange={(e) => setSelectedRaceId(e.target.value)}>
              {assignedRaces.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
            </select>
          </label>
          <button className="btn btn-secondary" onClick={onPrepare} disabled={selectedRace?.status !== 'REGISTRATION_CLOSED' || clearedSelectedCount < 6}>Chuyển sang chờ xuất phát</button>
          <button className="btn btn-secondary" onClick={onStart} disabled={selectedRace?.status !== 'STANDBY'}>Bắt đầu cuộc đua</button>
          <button className="btn btn-outline" onClick={onSimulate} disabled={!['IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'REVISION_REQUIRED', 'OFFICIAL'].includes(selectedRace?.status)}>Mô phỏng</button>
          <button className="btn btn-outline" onClick={onComplete} disabled={selectedRace?.status !== 'IN_PROGRESS'}>Kết thúc</button>
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
            <h3>Kiểm tra trước cuộc đua</h3>
            <FiCheckCircle />
          </div>
          <div className="workflow-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Làn đua</th>
                  <th>Ngựa</th>
                  <th>Nài ngựa</th>
                  <th>Trạng thái</th>
                  <th>Kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {selectedRaceRegistrations.map((registration) => (
                  <tr key={registration.id}>
                    <td>{registration.laneNumber || '-'}</td>
                    <td>{nameOf(data.horses, registration.horseId, 'horseName', `Ngựa #${registration.horseId}`)}</td>
                    <td>{nameOf([...data.users, ...data.jockeys], registration.jockeyId, 'fullName', registration.jockeyId ? `Nài ngựa #${registration.jockeyId}` : 'Chưa phân công')}</td>
                    <td><StatusBadge status={registration.status} /></td>
                    <td className="workflow-actions">
                      {['READY_FOR_CHECK', 'APPROVED'].includes(registration.status) ? <>
                        <button className="btn btn-secondary btn-sm" onClick={() => onCheck(registration.id, { approved: true, healthCheckStatus: 'FIT', notes: 'Đã đạt kiểm tra trước cuộc đua' })}><FiCheckCircle /> Đủ điều kiện</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setDisqualificationId(registration.id)}><FiXCircle /> Loại</button>
                      </> : <span className="workflow-muted">Đã kiểm tra</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {disqualificationId && <form className="workflow-form referee-decision-form" onSubmit={(event) => {
            event.preventDefault();
            onCheck(disqualificationId, {
              approved: false,
              healthCheckStatus: 'NOT_FIT',
              notes: disqualificationForm.notes,
              disqualificationReason: disqualificationForm.reason.trim(),
              category: disqualificationForm.category,
              severity: disqualificationForm.severity,
              confirmationText: disqualificationForm.confirmationText,
            });
            setDisqualificationId('');
            setDisqualificationForm({ reason: '', category: 'MEDICAL', severity: 'MAJOR', notes: '', confirmationText: '' });
          }}>
            <h4>Loại đối tượng #{disqualificationId}</h4>
            <label className="form-field"><span className="form-field-label">Lý do loại (tối thiểu 20 ký tự)</span><textarea className="form-input" rows="3" minLength="20" maxLength="1000" value={disqualificationForm.reason} onChange={(event) => setDisqualificationForm({ ...disqualificationForm, reason: event.target.value })} required /></label>
            <div className="workflow-form-row">
              <label className="form-field"><span className="form-field-label">Phân loại</span><select className="form-select" value={disqualificationForm.category} onChange={(event) => setDisqualificationForm({ ...disqualificationForm, category: event.target.value })}><option value="MEDICAL">Y tế</option><option value="RULE_VIOLATION">Vi phạm quy tắc</option><option value="EQUIPMENT_FAILURE">Lỗi thiết bị</option><option value="ADMINISTRATIVE">Hành chính</option><option value="OTHER">Khác</option></select></label>
              <label className="form-field"><span className="form-field-label">Mức độ</span><select className="form-select" value={disqualificationForm.severity} onChange={(event) => setDisqualificationForm({ ...disqualificationForm, severity: event.target.value })}><option value="MINOR">Nhẹ</option><option value="MAJOR">Nghiêm trọng</option><option value="CRITICAL">Đặc biệt nghiêm trọng</option></select></label>
              <label className="form-field"><span className="form-field-label">Nhập XACNHAN để xác nhận</span><input className="form-input" value={disqualificationForm.confirmationText} onChange={(event) => setDisqualificationForm({ ...disqualificationForm, confirmationText: event.target.value })} required /></label>
            </div>
            <label className="form-field"><span className="form-field-label">Ghi chú bổ sung của trọng tài (không bắt buộc)</span><input className="form-input" value={disqualificationForm.notes} onChange={(event) => setDisqualificationForm({ ...disqualificationForm, notes: event.target.value })} /></label>
            <div className="workflow-actions"><button className="btn btn-primary" type="submit" disabled={disqualificationForm.reason.trim().length < 20 || disqualificationForm.confirmationText !== 'XACNHAN'}>Xác nhận loại</button><button className="btn btn-ghost" type="button" onClick={() => setDisqualificationId('')}>Hủy</button></div>
          </form>}
        </section>
      )}

      {(section === 'reports' || !section || section === 'monitor') && currentReportRace && <section className="workflow-panel">
        <div className="workflow-panel-heading"><div><h3>Báo cáo đã ký của trọng tài</h3><p>{currentReportRace.name} — {statusLabel(currentReportRace.status)}</p></div><FiAward /></div>
        {section === 'reports' && reportableRaces.length > 1 && <label className="form-field">
          <span className="form-field-label">Cuộc đua đang chờ báo cáo</span>
          <select className="form-select" value={currentReportRace.id} onChange={(event) => setReportRaceId(event.target.value)}>{reportableRaces.map((race) => <option key={race.id} value={race.id}>{race.name} — {statusLabel(race.status)}</option>)}</select>
        </label>}
        <form className="workflow-form" onSubmit={(event) => {
          event.preventDefault();
          onSubmitReport(currentReportRace.id, { ...reportForm, description: reportForm.description.trim(), signature: reportForm.signature.trim() });
        }}>
          <label className="form-field"><span className="form-field-label">Tóm tắt cuộc đua chính thức (tối thiểu 20 ký tự)</span><textarea className="form-input" rows="4" minLength="20" maxLength="4000" value={reportForm.description} onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })} placeholder="Tóm tắt cuộc đua và đề cập mọi sự cố đã ghi nhận" required /></label>
          <div className="workflow-form-row">
            <label className="form-field"><span className="form-field-label">Mức độ báo cáo</span><select className="form-select" value={reportForm.severity} onChange={(event) => setReportForm({ ...reportForm, severity: event.target.value })}><option value="INFO">Thông tin</option><option value="WARNING">Cảnh báo</option><option value="CRITICAL">Đặc biệt nghiêm trọng</option></select></label>
            <label className="form-field"><span className="form-field-label">Biện pháp đã thực hiện</span><input className="form-input" value={reportForm.actionTaken} onChange={(event) => setReportForm({ ...reportForm, actionTaken: event.target.value })} placeholder="Không cần xử lý / chi tiết xử lý" /></label>
            <label className="form-field"><span className="form-field-label">Chữ ký trọng tài</span><input className="form-input" maxLength="150" value={reportForm.signature} onChange={(event) => setReportForm({ ...reportForm, signature: event.target.value })} placeholder="Nhập họ và tên của bạn" required /></label>
          </div>
          <label className="workflow-confirm"><input type="checkbox" checked={reportForm.reviewedIncidents} onChange={(event) => setReportForm({ ...reportForm, reviewedIncidents: event.target.checked })} /><span>Tôi đã kiểm tra mọi sự cố và ghi chú, đồng thời xác nhận báo cáo đã đầy đủ.</span></label>
          <button className="btn btn-primary" type="submit" disabled={reportForm.description.trim().length < 20 || !reportForm.signature.trim() || !reportForm.reviewedIncidents}>Gửi báo cáo đã ký</button>
        </form>
      </section>}

      {(!section || section === 'monitor') && selectedRace && ['IN_PROGRESS', 'COMPLETED', 'REVISION_REQUIRED'].includes(selectedRace.status) && <section className="workflow-panel">
        <div className="workflow-panel-heading"><div><h3>Nhật ký sự cố cuộc đua</h3><p>Sự cố giữa cuộc đua chỉ là ghi chú; quyết định loại được chốt trong kết quả sau cuộc đua.</p></div><FiActivity /></div>
        <form className="workflow-form" onSubmit={(event) => {
          event.preventDefault();
          if (incidentForm.markDnf) {
            onDnf(Number(incidentForm.registrationId), incidentForm.description.trim());
          } else {
            onIncident(selectedRace.id, {
              registrationId: incidentForm.registrationId ? Number(incidentForm.registrationId) : null,
              category: incidentForm.category,
              severity: incidentForm.severity,
              description: incidentForm.description.trim(),
              actionTaken: incidentForm.actionTaken,
              raceTimeSeconds: incidentForm.raceTimeSeconds === '' ? null : Number(incidentForm.raceTimeSeconds),
            });
          }
          setIncidentForm({ registrationId: '', category: 'OTHER', severity: 'INFO', description: '', actionTaken: '', raceTimeSeconds: '', markDnf: false });
        }}>
          <div className="workflow-form-row">
            <label className="form-field"><span className="form-field-label">Loại sự cố</span><select className="form-select" value={incidentForm.category} onChange={(event) => setIncidentForm({ ...incidentForm, category: event.target.value })}><option value="START">Xuất phát</option><option value="POSITION_CHANGE">Thay đổi vị trí</option><option value="INCIDENT">Sự cố / vấp ngã</option><option value="WEATHER">Thời tiết</option><option value="EQUIPMENT">Thiết bị</option><option value="INJURY">Chấn thương</option><option value="INTERFERENCE">Cản trở</option><option value="OTHER">Quan sát khác</option></select></label>
            <label className="form-field"><span className="form-field-label">Mức độ</span><select className="form-select" value={incidentForm.severity} onChange={(event) => setIncidentForm({ ...incidentForm, severity: event.target.value })}><option value="INFO">Thông tin</option><option value="WARNING">Cảnh báo</option><option value="CRITICAL">Đặc biệt nghiêm trọng</option></select></label>
            <label className="form-field"><span className="form-field-label">Đối tượng bị ảnh hưởng (không bắt buộc)</span><select className="form-select" value={incidentForm.registrationId} onChange={(event) => setIncidentForm({ ...incidentForm, registrationId: event.target.value })}><option value="">Sự cố chung của cuộc đua</option>{selectedRaceRegistrations.map((entry) => <option key={entry.id} value={entry.id}>Làn {entry.laneNumber} — {nameOf(data.horses, entry.horseId, 'horseName', `Ngựa #${entry.horseId}`)}</option>)}</select></label>
          </div>
          <label className="form-field"><span className="form-field-label">Mô tả sự cố (tối thiểu 10 ký tự)</span><textarea className="form-input" rows="3" minLength="10" maxLength="4000" value={incidentForm.description} onChange={(event) => setIncidentForm({ ...incidentForm, description: event.target.value })} required /></label>
          <div className="workflow-form-row">
            <label className="form-field"><span className="form-field-label">Biện pháp đã thực hiện</span><input className="form-input" value={incidentForm.actionTaken} onChange={(event) => setIncidentForm({ ...incidentForm, actionTaken: event.target.value })} /></label>
            <label className="form-field"><span className="form-field-label">Thời điểm trong cuộc đua (giây)</span><input className="form-input" type="number" min="0" value={incidentForm.raceTimeSeconds} onChange={(event) => setIncidentForm({ ...incidentForm, raceTimeSeconds: event.target.value })} /></label>
          </div>
          <label className="workflow-confirm"><input type="checkbox" checked={incidentForm.markDnf} disabled={!incidentForm.registrationId} onChange={(event) => setIncidentForm({ ...incidentForm, markDnf: event.target.checked, severity: event.target.checked ? 'CRITICAL' : incidentForm.severity, category: event.target.checked ? 'INJURY' : incidentForm.category })} /><span>Đánh dấu đối tượng này không về đích, xóa khỏi theo dõi trực tiếp và chuyển ngựa sang không sẵn sàng.</span></label>
          <button className="btn btn-outline" type="submit" disabled={incidentForm.description.trim().length < 10 || (incidentForm.markDnf && !incidentForm.registrationId)}>{incidentForm.markDnf ? 'Xác nhận không về đích' : 'Ghi nhận sự cố'}</button>
        </form>
      </section>}

      {(!section || section === 'monitor') && liveTrackHorses.length > 0 && (selectedRace?.status === 'IN_PROGRESS' || simulation?.lanes?.length > 0) && (
        <section className="workflow-panel unframed">
          <RaceTrack
            horses={liveTrackHorses}
            duration={Number(simulation?.raceId) === Number(selectedRace?.id) ? simulation?.durationSeconds || 60 : 60}
            remainingSeconds={Number(simulation?.raceId) === Number(selectedRace?.id) ? simulation?.remainingSeconds : null}
            livePositions={Number(simulation?.raceId) === Number(selectedRace?.id) ? simulation?.lanes || [] : []}
            isLive={selectedRace?.status === 'IN_PROGRESS'}
          />
        </section>
      )}

      {(!section || section === 'monitor') && simulation?.lanes?.length > 0 && (
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Trạng thái mô phỏng</h3>
            <FiActivity />
          </div>
          <CompactTable
            headers={['Hạng', 'Làn đua', 'Ngựa', 'Vị trí']}
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

function SpectatorDashboard({ data, predictionForm, setPredictionForm, onPrediction, userId, section }) {
  const selectableHorses = data.registrations
    .filter((registration) => Number(registration.raceId) === Number(predictionForm.raceId) && ['READY_FOR_CHECK', 'APPROVED', 'CLEARED_TO_RACE'].includes(registration.status))
    .map((registration) => byId(data.horses, registration.horseId))
    .filter(Boolean);
  const currentPrediction = data.predictions.find((prediction) => Number(prediction.raceId) === Number(predictionForm.raceId));
  const pointBalance = Number(nameOf(data.users, userId, 'rewardPoints', 0));
  const availablePoints = pointBalance + Number(currentPrediction?.wagerPoints || 0);

  return (
    <>
      {!section && <div className="dash-stats-grid">
        <StatCard icon={<FiFlag />} label="Cuộc đua đang mở" value={data.races.filter((race) => race.status === 'REGISTRATION_OPEN').length} color="red" />
        <StatCard icon={<FiActivity />} label="Dự đoán" value={data.predictions.length} color="green" />
        <StatCard icon={<FiAward />} label="Point ngựa cao nhất" value={data.horseLeaderboard[0]?.totalPoints || 0} color="yellow" />
        <StatCard icon={<FiCheckCircle />} label="Cuộc đua chính thức" value={data.races.filter((race) => race.status === 'OFFICIAL').length} />
      </div>}

      {(!section || section === 'races' || section === 'guesses') && <div className="workflow-grid two">
        {(!section || section === 'races') && <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <div><h3>Dự đoán cuộc đua</h3><p>{pointBalance.toLocaleString()} point khả dụng</p></div>
            <FiAward />
          </div>
          <form className="workflow-form" onSubmit={onPrediction}>
            <label className="form-field">
              <span className="form-field-label">Cuộc đua</span>
              <select className="form-select" value={predictionForm.raceId} onChange={(e) => setPredictionForm({ ...predictionForm, raceId: Number(e.target.value), predictedHorseId: '' })}>
                {data.races.filter((race) => ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED'].includes(race.status)).map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span className="form-field-label">Cặp ngựa–nài ngựa</span>
              <select className="form-select" value={predictionForm.predictedHorseId || ''} onChange={(e) => setPredictionForm({ ...predictionForm, predictedHorseId: Number(e.target.value) })} disabled={!selectableHorses.length} required>
                <option value="">{selectableHorses.length ? 'Chọn một cặp ngựa–nài ngựa đã đăng ký' : 'Không có cặp đủ điều kiện cho cuộc đua này'}</option>
                {selectableHorses.map((horse) => <option key={horse.id} value={horse.id}>{horse.horseName}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span className="form-field-label">Point dự đoán</span>
              <input className="form-input" type="number" min="1" max={Math.max(availablePoints, 1)} step="1"
                value={predictionForm.wagerPoints} onChange={(e) => setPredictionForm({ ...predictionForm, wagerPoints: Number(e.target.value) })} required />
              <span className="workflow-muted">Tối đa: {availablePoints.toLocaleString()} point. Dự đoán thắng nhận gấp 2 lần point đã đặt.</span>
            </label>
            <button className="btn btn-primary" type="submit" disabled={!predictionForm.predictedHorseId || predictionForm.wagerPoints < 1 || predictionForm.wagerPoints > availablePoints}>Lưu dự đoán</button>
          </form>
        </section>}

        {(!section || section === 'guesses') && <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Dự đoán của tôi</h3>
            <FiActivity />
          </div>
          <CompactTable
            headers={['Cuộc đua', 'Ngựa', 'Point đã đặt', 'Point nhận được', 'Trạng thái']}
            rows={data.predictions.map((prediction) => [
              nameOf(data.races, prediction.raceId, 'name', `Cuộc đua #${prediction.raceId}`),
              nameOf(data.horses, prediction.predictedHorseId, 'horseName', `Ngựa #${prediction.predictedHorseId}`),
              prediction.wagerPoints ?? 0,
              prediction.rewardPoints ?? 0,
              statusLabel(prediction.status),
            ])}
            empty="Chưa có dự đoán"
          />
        </section>}
      </div>}

      {(!section || section === 'leaderboard') && <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Bảng xếp hạng ngựa</h3>
          <FiAward />
        </div>
        <CompactTable
          headers={['Hạng', 'Ngựa', 'Trận thắng', 'Top 3', 'Point']}
          rows={data.horseLeaderboard.map((row, index) => [
            index + 1,
            row.horseName,
            row.totalWins || 0,
            row.totalTop3 || 0,
            row.totalPoints || 0,
          ])}
          empty="Chưa có dữ liệu bảng xếp hạng"
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

function CompactTable({ headers, rows, empty = 'Chưa có dữ liệu' }) {
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
