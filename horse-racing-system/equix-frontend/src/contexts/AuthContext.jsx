import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const ROLES = {
  GUEST: 'GUEST',
  OWNER: 'OWNER',
  JOCKEY: 'JOCKEY',
  REFEREE: 'REFEREE',
  SPECTATOR: 'SPECTATOR',
  ADMIN: 'ADMIN',
};

const mockUsers = {
  OWNER: {
    id: 1,
    name: 'EquiX Owner',
    email: 'owner@equix.vn',
    role: ROLES.OWNER,
    avatar: null,
    status: 'Active',
    rewardPoints: 100,
  },
  JOCKEY: {
    id: 2,
    name: 'EquiX Jockey',
    email: 'jockey@equix.vn',
    role: ROLES.JOCKEY,
    avatar: null,
    status: 'Active',
    rewardPoints: 100,
  },
  REFEREE: {
    id: 3,
    name: 'EquiX Referee',
    email: 'referee@equix.vn',
    role: ROLES.REFEREE,
    avatar: null,
    status: 'Active',
    rewardPoints: 100,
  },
  SPECTATOR: {
    id: 4,
    name: 'EquiX Spectator',
    email: 'spectator@equix.vn',
    role: ROLES.SPECTATOR,
    avatar: null,
    status: 'Active',
    rewardPoints: 100,
  },
  ADMIN: {
    id: 5,
    name: 'Admin EquiX',
    email: 'admin@equix.vn',
    role: ROLES.ADMIN,
    avatar: null,
    status: 'Active',
    rewardPoints: 100,
  },
};

function mapAuthUser(payload) {
  return {
    id: payload.id,
    username: payload.username,
    name: payload.fullName || payload.username || payload.email,
    fullName: payload.fullName,
    email: payload.email,
    role: payload.role,
    rewardPoints: payload.rewardPoints || 0,
    status: 'Active',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('equix_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (credentialsOrRole) => {
    if (typeof credentialsOrRole === 'string') {
      const mockUser = mockUsers[credentialsOrRole] || null;
      setUser(mockUser);
      localStorage.setItem('equix_user', JSON.stringify(mockUser));
      localStorage.removeItem('equix_token');
      return mockUser;
    }

    const response = await api.login(credentialsOrRole);
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

  const switchRole = (role) => {
    if (mockUsers[role]) {
      setUser(mockUsers[role]);
      localStorage.setItem('equix_user', JSON.stringify(mockUsers[role]));
      localStorage.removeItem('equix_token');
    }
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
