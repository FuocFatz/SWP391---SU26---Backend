const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';

async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? null : localStorage.getItem('equix_token');
  const headers = {
    'Content-Type': 'application/json',
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

    const error = new Error(sessionExpired
      ? 'Your session expired. Please sign in again.'
      : data?.message || data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (payload) => request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
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
  getUsers: () => request('/v1/users'),
  getUsersByRole: (role) => request(`/v1/users/role/${role}`),
  updateUserStatus: (userId, payload) => request(`/v1/users/${userId}/status`, {
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
  getTournaments: () => request('/tournaments'),
  createTournament: (payload) => request('/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateTournament: (tournamentId, payload) => request(`/tournaments/${tournamentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getRaces: () => request('/races'),
  createRace: (payload) => request('/races', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateRaceStatus: (raceId, status) => request(`/races/${raceId}/status?status=${status}`, {
    method: 'PATCH',
  }),
  getRaceRegistrations: (raceId) => request(`/races/${raceId}/registrations`),
  registerHorse: (raceId, payload) => request(`/races/${raceId}/registrations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  startRace: (raceId) => request(`/races/${raceId}/start`, {
    method: 'POST',
  }),
  completeRace: (raceId) => request(`/races/${raceId}/complete`, {
    method: 'POST',
  }),
  submitRaceReport: (raceId, payload) => request(`/races/${raceId}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
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
  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadNotificationCount: () => request('/notifications/unread-count'),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
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
};

export default api;
