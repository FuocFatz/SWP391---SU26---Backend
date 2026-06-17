const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getUsers: () => request('/v1/users'),
  getUsersByRole: (role) => request(`/v1/users/role/${role}`),
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
};

export default api;
