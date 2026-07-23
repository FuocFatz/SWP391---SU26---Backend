import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { ROLES } from './authRoles';
import AuthContext from './auth-context';

function mapAuthUser(payload) {
  return {
    id: payload.id,
    username: payload.username,
    name: payload.fullName || payload.username || payload.email,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || '',
    role: payload.role,
    rewardPoints: payload.rewardPoints || 0,
    status: payload.status,
    avatar: payload.avatarUrl || null,
  };
}

function readSavedUser() {
  if (!localStorage.getItem('equix_token')) return null;
  try {
    const saved = localStorage.getItem('equix_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);
  const [sessionLoading, setSessionLoading] = useState(Boolean(localStorage.getItem('equix_token')));
  const [unreadCount, setUnreadCount] = useState(0);

  const clearSession = useCallback(() => {
    localStorage.removeItem('equix_user');
    localStorage.removeItem('equix_token');
    setUser(null);
    setUnreadCount(0);
  }, []);

  const persistSession = useCallback((response) => {
    const nextUser = mapAuthUser(response);
    localStorage.setItem('equix_token', response.token);
    localStorage.setItem('equix_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!localStorage.getItem('equix_token')) {
      setUnreadCount(0);
      return 0;
    }
    const response = await api.getUnreadNotificationCount();
    const nextCount = Number(response?.unreadCount || 0);
    setUnreadCount(nextCount);
    return nextCount;
  }, []);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const token = localStorage.getItem('equix_token');
      if (!token) {
        setSessionLoading(false);
        return;
      }
      try {
        const response = await api.getMe();
        if (!active) return;
        const nextUser = mapAuthUser(response);
        localStorage.setItem('equix_user', JSON.stringify(nextUser));
        setUser(nextUser);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setSessionLoading(false);
      }
    };
    restore();
    return () => { active = false; };
  }, [clearSession]);

  useEffect(() => {
    if (!user) return;
    const timeout = window.setTimeout(() => {
      refreshUnreadCount().catch(() => setUnreadCount(0));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [user, refreshUnreadCount]);

  const login = async (credentials) => persistSession(await api.login(credentials));
  const quickLogin = async (userId) => persistSession(await api.quickLogin(userId));

  const register = async (payload) => {
    const response = await api.register(payload);
    if (response.token) persistSession(response);
    return { user: mapAuthUser(response), pending: !response.token };
  };

  const applyUserResponse = useCallback((response) => {
    const nextUser = mapAuthUser(response);
    localStorage.setItem('equix_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const refreshUser = useCallback(async () => applyUserResponse(await api.getMe()), [applyUserResponse]);

  const updateProfile = async (payload) => applyUserResponse(await api.updateProfile(payload));

  const updateAvatar = async (file) => applyUserResponse(await api.updateAvatar(file));
  const removeAvatar = async () => applyUserResponse(await api.removeAvatar());

  const logout = () => clearSession();
  const isAuthenticated = Boolean(user && localStorage.getItem('equix_token'));
  const currentRole = user?.role || ROLES.GUEST;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      currentRole,
      sessionLoading,
      unreadCount,
      setUnreadCount,
      refreshUnreadCount,
      login,
      quickLogin,
      register,
      refreshUser,
      updateProfile,
      updateAvatar,
      removeAvatar,
      logout,
      ROLES,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
