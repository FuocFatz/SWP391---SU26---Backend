import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const ROLES = {
  GUEST: 'GUEST',
  HORSE_OWNER: 'HORSE_OWNER',
  JOCKEY: 'JOCKEY',
  REFEREE: 'REFEREE',
  SPECTATOR: 'SPECTATOR',
  ADMIN: 'ADMIN',
};

function mapAuthUser(payload) {
  // log thử ra console xem payload thực tế chứa gì để dễ kiểm soát dữ liệu
  console.log("Dữ liệu User nhận từ API:", payload);

  // Nếu payload truyền vào bị null/undefined hoặc là dữ liệu lồng trong .data
  const data = payload?.data ? payload.data : payload;

  return {
    id: data?.id || null,
    username: data?.username || "",
    name: data?.fullName || data?.username || data?.email || "User",
    fullName: data?.fullName || "",
    email: data?.email || "",
    role: data?.role || 'GUEST',
    rewardPoints: data?.rewardPoints || 0,
    status: 'Active',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('equix_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (credentials) => {
    const response = await api.login(credentials);
    const nextUser = mapAuthUser(response);
    localStorage.setItem('equix_token', response.token);
    localStorage.setItem('equix_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const response = await api.register(payload);
    const nextUser = mapAuthUser(response);
    localStorage.setItem('equix_token', response.token);
    localStorage.setItem('equix_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('equix_user');
    localStorage.removeItem('equix_token');
  };

  const switchRole = () => {
    console.warn('switchRole is deprecated in production. Please login with a real account.');
  };

  const isAuthenticated = !!user;
  const currentRole = user?.role || ROLES.GUEST;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      currentRole,
      login,
      register,
      logout,
      switchRole,
      ROLES,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { ROLES };
export default AuthContext;
