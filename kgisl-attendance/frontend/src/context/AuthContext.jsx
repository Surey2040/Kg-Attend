import { createContext, useContext, useState, useCallback } from 'react';
import { logoutRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('kgisl_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      localStorage.removeItem('kgisl_user');
      return null;
    }
  });

  const login = useCallback((token, refreshToken, userData) => {
    localStorage.setItem('kgisl_token', token);
    localStorage.setItem('kgisl_refresh_token', refreshToken);
    localStorage.setItem('kgisl_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('kgisl_refresh_token');
    // Best-effort server-side revoke — don't block the UI on it, and don't let
    // a network failure prevent the client from clearing its own session.
    if (refreshToken) logoutRequest(refreshToken).catch(() => void 0);

    localStorage.removeItem('kgisl_token');
    localStorage.removeItem('kgisl_refresh_token');
    localStorage.removeItem('kgisl_user');
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
