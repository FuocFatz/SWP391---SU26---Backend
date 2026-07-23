import { translateText } from '../utils/vietnameseLocalization';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';

export function getRaceRealtimeUrl() {
  const fallbackOrigin = globalThis.location?.origin || 'http://localhost:5173';
  const apiUrl = new URL(API_BASE_URL, fallbackOrigin);
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  apiUrl.pathname = '/ws/races';
  apiUrl.search = '';
  return apiUrl.toString();
}

async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? null : localStorage.getItem('equix_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const sessionExpired = response.status === 401 && Boolean(token);
    if (sessionExpired) {
      localStorage.removeItem('equix_user');
      localStorage.removeItem('equix_token');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login?reason=session-expired');
      }
    }

    const error = new Error(translateText(sessionExpired
      ? 'Your session expired. Please sign in again.'
      : data?.message || data?.error || `Request failed (${response.status})`));
    error.status = response.status;
    throw error;
  }

  return data;
}

export function resolveAssetUrl(value) {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value || null;
  const fallbackOrigin = globalThis.location?.origin || 'http://localhost:5173';
  const apiOrigin = new URL(API_BASE_URL, fallbackOrigin).origin;
  return new URL(value, apiOrigin).toString();
}

export const api = {
  login: (payload) => request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  }),
  getQuickLoginAccounts: (role) => request(`/v1/auth/quick-login/accounts?role=${encodeURIComponent(role)}`, {
    skipAuth: true,
  }),
  quickLogin: (userId) => request('/v1/auth/quick-login', {
    method: 'POST',
    body: JSON.stringify({ userId }),
    skipAuth: true,
  }),
  register: (payload) => request('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  }),
  getMe: () => request('/v1/auth/me'),
  updateProfile: (payload) => request('/v1/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  changePassword: (payload) => request('/v1/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  requestEmailChange: (payload) => request('/v1/auth/me/email-change', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  confirmEmailChange: (token) => request('/v1/auth/email-change/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
    skipAuth: true,
  }),
  updateAvatar: (file) => {
    const body = new FormData();
    body.append('file', file);
    return request('/v1/auth/me/avatar', { method: 'POST', body });
  },
  removeAvatar: () => request('/v1/auth/me/avatar', { method: 'DELETE' }),
  getUsers: () => request('/v1/users'),
  getUsersByRole: (role) => request(`/v1/users/role/${role}`),
  updateUserStatus: (userId, payload) => request(`/v1/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  updateUserRole: (userId, payload) => request(`/v1/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteUser: (userId) => request(`/v1/users/${userId}`, {
    method: 'DELETE',
  }),
  createReferee: (payload) => request('/v1/users/referees', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getHorses: () => request('/horses'),
  getHorsesByOwner: (ownerId) => request(`/horses/owner/${ownerId}`),
  createHorse: (payload) => request('/horses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateHorse: (id, payload) => request(`/horses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteHorse: (id) => request(`/horses/${id}`, { method: 'DELETE' }),
  updateHorsePortrait: (id, file) => {
    const body = new FormData();
    body.append('file', file);
    return request(`/horses/${id}/portrait`, { method: 'POST', body });
  },
  deleteHorsePortrait: (id) => request(`/horses/${id}/portrait`, { method: 'DELETE' }),
  getTournaments: () => request('/tournaments'),
  createTournament: (payload) => request('/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateTournament: (tournamentId, payload) => request(`/tournaments/${tournamentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteTournament: (tournamentId) => request(`/tournaments/${tournamentId}`, {
    method: 'DELETE',
  }),
  getRaces: () => request('/races'),
  createRace: (payload) => request('/races', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  deleteRace: (raceId) => request(`/races/${raceId}`, {
    method: 'DELETE',
  }),
  updateRaceStatus: (raceId, status) => request(`/races/${raceId}/status?status=${status}`, {
    method: 'PATCH',
  }),
  cancelRace: (raceId, reason) => request(`/races/${raceId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  rescheduleRace: (raceId, payload) => request(`/races/${raceId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  reassignReferee: (raceId, payload) => request(`/races/${raceId}/referee`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRaceRegistrations: (raceId) => request(`/races/${raceId}/registrations`),
  registerHorse: (raceId, payload) => request(`/races/${raceId}/registrations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  startRace: (raceId) => request(`/races/${raceId}/start`, {
    method: 'POST',
  }),
  prepareRace: (raceId) => request(`/races/${raceId}/prepare`, {
    method: 'POST',
  }),
  completeRace: (raceId) => request(`/races/${raceId}/complete`, {
    method: 'POST',
  }),
  submitRaceReport: (raceId, payload) => request(`/races/${raceId}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  addRaceIncident: (raceId, payload) => request(`/races/${raceId}/incidents`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRaceNotes: (raceId) => request(`/races/${raceId}/notes`),
  requestReportRevision: (raceId, reason) => request(`/races/${raceId}/report/revision`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  simulateRace: (raceId, durationSeconds = 60) => request(`/races/${raceId}/simulate?durationSeconds=${durationSeconds}`),
  confirmResults: (raceId, payload) => request(`/races/${raceId}/results`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getResults: (raceId) => request(`/races/${raceId}/results`),
  getRegistrations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/registrations${query ? `?${query}` : ''}`);
  },
  approveRegistration: (registrationId) => request(`/registrations/${registrationId}/approve`, {
    method: 'PATCH',
  }),
  approveRegistrations: (registrationIds) => request('/registrations/bulk-approve', {
    method: 'POST',
    body: JSON.stringify({ registrationIds }),
  }),
  ownerConfirmRegistration: (registrationId) => request(`/registrations/${registrationId}/owner-confirm`, {
    method: 'PATCH',
  }),
  withdrawRegistration: (registrationId, reason) => request(`/registrations/${registrationId}/withdraw`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  }),
  refereeCheck: (registrationId, payload) => request(`/registrations/${registrationId}/referee-check`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  getInvitations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/invitations${query ? `?${query}` : ''}`);
  },
  inviteJockey: (payload) => request('/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  respondInvitation: (invitationId, payload) => request(`/invitations/${invitationId}/respond`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  createPrediction: (raceId, payload) => request(`/races/${raceId}/predictions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPredictions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/predictions${query ? `?${query}` : ''}`);
  },
  getHorseLeaderboard: () => request('/races/leaderboard/horses'),
  getJockeyLeaderboard: () => request('/races/leaderboard/jockeys'),
  getTournamentStandings: (tournamentId) => request(`/tournaments/${tournamentId}/standings`),
  getAdminAnalytics: () => request('/admin/analytics/overview'),
  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadNotificationCount: () => request('/notifications/unread-count'),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  }),
  markDnf: (registrationId, reason) => request(`/registrations/${registrationId}/dnf`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  }),
  markAllNotificationsRead: () => request('/notifications/read-all', {
    method: 'PATCH',
  }),
  // Password Reset
  requestPasswordReset: (email) => request('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuth: true,
  }),
  confirmPasswordReset: (token, newPassword) => request('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
    skipAuth: true,
  }),
  // Predictions (enhanced)
  placePrediction: (payload) => request('/predictions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRaceById: (raceId) => request(`/races/${raceId}`),
  // Spectator rewards
  getRewards: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rewards${query ? `?${query}` : ''}`);
  },
  getPointRewardCatalog: () => request('/rewards/catalog'),
  exchangeRewardPoints: (rewardTypeId) => request('/rewards/exchange', {
    method: 'POST',
    body: JSON.stringify({ rewardTypeId }),
  }),
  claimReward: (rewardId, payload = {}) => request(`/rewards/${rewardId}/claim`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  confirmRewardReceived: (rewardId) => request(`/rewards/${rewardId}/confirm-received`, {
    method: 'POST',
  }),
  redeemRewardCode: (redemptionCode) => request('/rewards/redeem-code', {
    method: 'POST',
    body: JSON.stringify({ redemptionCode }),
  }),
  // Admin reward fulfillment and catalog
  getAdminRewards: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/rewards${query ? `?${query}` : ''}`);
  },
  getRewardTypes: () => request('/admin/rewards/types'),
  updateRewardType: (rewardTypeId, payload) => request(`/admin/rewards/types/${rewardTypeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  updateRewardFulfillment: (rewardId, payload) => request(`/admin/rewards/${rewardId}/fulfillment`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  redeemReward: (payload) => request('/admin/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  createRewardCode: (payload) => request('/admin/rewards/codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

export default api;
