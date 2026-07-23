export const ROLES = Object.freeze({
  GUEST: 'GUEST',
  HORSE_OWNER: 'HORSE_OWNER',
  JOCKEY: 'JOCKEY',
  REFEREE: 'REFEREE',
  SPECTATOR: 'SPECTATOR',
  ADMIN: 'ADMIN',
});

export const ROLE_LABELS = Object.freeze({
  HORSE_OWNER: 'Chủ ngựa',
  JOCKEY: 'Nài ngựa',
  REFEREE: 'Trọng tài',
  SPECTATOR: 'Khán giả',
  ADMIN: 'Quản trị viên',
});

export function getStartedDestination({ sessionLoading, isAuthenticated }) {
  if (sessionLoading) return null;
  return isAuthenticated ? '/dashboard' : '/register';
}
