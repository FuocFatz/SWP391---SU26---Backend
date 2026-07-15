const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('equix_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data;
}

export const api = {
  login: (payload) => request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  register: (payload) => request('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getUsers: () => request('/v1/users'),
  getUsersByRole: (role) => request(`/v1/users/role/${role}`),
  getHorses: () => request('/v1/horses'),
  getHorsesByOwner: () => request('/v1/horses/my-horses'),
  createHorse: (payload) => request('/v1/horses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateHorse: (id, payload) => request(`/v1/horses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getTournaments: () => request('/v1/tournaments'),
  createTournament: (payload) => request('/v1/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRaces: () => request('/v1/races'),
  createRace: (payload) => request('/v1/races', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateRaceStatus: (raceId, status) => request(`/v1/races/${raceId}/status?status=${status}`, {
    method: 'PUT',
  }),
  getRaceRegistrations: (raceId) => request(`/v1/races/${raceId}/registrations`),
  registerHorse: (payload) => request('/v1/race-registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  startRace: (raceId) => request(`/v1/races/${raceId}/start`, {
    method: 'POST',
  }),
  simulateRace: (raceId, durationSeconds = 60) => request(`/v1/races/${raceId}/simulate?durationSeconds=${durationSeconds}`),
  confirmResults: (payload) => request('/v1/race-results', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getResults: (raceId) => request(`/v1/races/${raceId}/results`),
  getRaceNotes: (raceId) => request(`/v1/races/${raceId}/notes`),
  getRegistrations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/race-registrations${query ? `?${query}` : ''}`);
  },
  approveRegistration: (registrationId) => request(`/v1/race-registrations/${registrationId}/approve`, {
    method: 'PUT',
  }),
  ownerConfirmRegistration: (registrationId) => request(`/v1/race-registrations/${registrationId}/owner-confirm`, {
    method: 'PUT',
  }),
  withdrawRegistration: (registrationId, reason) => request(`/v1/race-registrations/${registrationId}/withdraw`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  }),
  refereeCheck: (registrationId, payload) => request(`/v1/race-registrations/${registrationId}/review`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getInvitations: (params = {}) => {
    if (params.myInvitations) return request('/v1/jockey-invitations/my-invitations');
    const query = new URLSearchParams(params).toString();
    return request(`/v1/jockey-invitations${query ? `?${query}` : ''}`);
  },
  inviteJockey: (payload) => request('/v1/jockey-invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  respondInvitation: (invitationId, payload) => request(`/v1/jockey-invitations/${invitationId}/respond`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  createPrediction: (payload) => request(`/v1/predictions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPredictions: (params = {}) => {
    if (params.myHistory) return request('/v1/predictions/my-history');
    const query = new URLSearchParams(params).toString();
    return request(`/v1/predictions${query ? `?${query}` : ''}`);
  },
  settlePredictions: (raceId) => request(`/v1/predictions/races/${raceId}/settle`, {
    method: 'PUT',
  }),
  getHorseLeaderboard: () => request('/v1/races/leaderboard/horses'),
  getJockeyLeaderboard: () => request('/v1/races/leaderboard/jockeys'),
  // Notifications
  getNotifications: (userId) => request(`/v1/notifications?userId=${userId}`),
  markNotificationRead: (notificationId) => request(`/v1/notifications/${notificationId}/read`, {
    method: 'PUT',
  }),
  markAllNotificationsRead: () => request('/v1/notifications/read-all', {
    method: 'PUT',
  }),
  // Password Reset
  requestPasswordReset: (email) => request('/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  confirmPasswordReset: (token, newPassword) => request('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  }),
  // Predictions (enhanced)
  placePrediction: (payload) => request('/v1/predictions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRaceById: (raceId) => request(`/v1/races/${raceId}`),
  // System Settings
  getSystemSettings: () => request('/v1/system-settings'),
  getSystemSetting: (key) => request(`/v1/system-settings/${key}`),
  updateSystemSetting: (key, payload) => request(`/v1/system-settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/audit-logs${query ? `?${query}` : ''}`);
  },

  // Users & Profile
  getUserProfile: () => request('/v1/users/profile'),
  updateUserProfile: (payload) => request('/v1/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  updateUserStatus: (id, status) => request(`/v1/users/${id}/status?status=${status}`, {
    method: 'PUT',
  }),

  // Jockeys
  getJockeys: () => request('/v1/jockeys'),
  getJockey: (id) => request(`/v1/jockeys/${id}`),

  // Achievements
  getAchievements: () => request('/v1/achievements'),
  createAchievement: (payload) => request('/v1/achievements', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  awardAchievement: (jockeyId, payload) => request(`/v1/jockeys/${jockeyId}/achievements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Horses (missing)
  getHorse: (id) => request(`/v1/horses/${id}`),
  deleteHorse: (id) => request(`/v1/horses/${id}`, {
    method: 'DELETE',
  }),

  // Tournaments (missing)
  getTournament: (id) => request(`/v1/tournaments/${id}`),
  updateTournament: (id, payload) => request(`/v1/tournaments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getTournamentRaces: (id) => request(`/v1/tournaments/${id}/races`),

  // Pairing Contracts
  getPairingContracts: () => request('/v1/pairing-contracts'),
  dissolvePairingContract: (id) => request(`/v1/pairing-contracts/${id}/dissolve`, {
    method: 'PUT',
  }),

  // Race Notes
  createRaceNote: (payload) => request('/v1/race-notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Rewards
  getRewardTypes: () => request('/v1/rewards/types'),
  createRewardType: (payload) => request('/v1/rewards/types', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  redeemReward: (payload) => request('/v1/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRewardHistory: () => request('/v1/rewards/my-history'),
};

export default api;
