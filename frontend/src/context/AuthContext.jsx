import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';
import { subscribeToPush, isPushSupported } from '../api/push';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getRoleKeysForPath = (path = window.location.pathname) => {
  if (path.startsWith('/admin')) {
    return { tokenKey: 'admin_token', userKey: 'admin_user', role: 'super_admin' };
  }
  if (path.startsWith('/partner')) {
    return { tokenKey: 'partner_token', userKey: 'partner_user', role: 'partner' };
  }
  if (path.startsWith('/student')) {
    return { tokenKey: 'student_token', userKey: 'student_user', role: 'student' };
  }
  return { tokenKey: 'admin_token', userKey: 'admin_user', role: 'super_admin' };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/partner') || path.startsWith('/student');

    // On public pages, don't attempt getMe() — the request interceptor won't attach
    // a token on public routes, so getMe() would return 401 and wrongly clear the token.
    if (!isProtectedRoute) {
      setLoading(false);
      return;
    }

    const { tokenKey, userKey } = getRoleKeysForPath();
    const token = localStorage.getItem(tokenKey);
    const cachedUserStr = localStorage.getItem(userKey);

    if (cachedUserStr) {
      try {
        setUser(JSON.parse(cachedUserStr));
      } catch (e) {}
    }

    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem(userKey, JSON.stringify(res.data.user));
          // Auto-subscribe to push notifications
          if (Notification.permission === 'granted') {
            isPushSupported().then(ok => { if (ok) subscribeToPush().catch(() => {}); });
          }
        })
        .catch((err) => {
          // Only clear token on 401 with actual token-invalid message.
          // Don't clear on "no token" 401s (token wasn't sent, not invalid)
          // or on network errors / 500s.
          if (err.response?.status === 401) {
            const msg = err.response?.data?.message || '';
            if (!msg.includes('no token')) {
              localStorage.removeItem(tokenKey);
              localStorage.removeItem(userKey);
              setUser(null);
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    const role = userData.user?.role;
    let tokenKey = 'admin_token';
    let userKey = 'admin_user';

    if (role === 'partner') {
      tokenKey = 'partner_token';
      userKey = 'partner_user';
    } else if (role === 'student') {
      tokenKey = 'student_token';
      userKey = 'student_user';
    }

    localStorage.setItem(tokenKey, userData.token);
    localStorage.setItem(userKey, JSON.stringify(userData.user));
    setUser(userData.user);
    // Auto-subscribe to push notifications
    if (Notification.permission === 'granted') {
      isPushSupported().then(ok => { if (ok) subscribeToPush().catch(() => {}); });
    }
  };

  const logout = () => {
    const { tokenKey, userKey } = getRoleKeysForPath();
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setUser(null);
  };

  const value = { user, loading, login, logout, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
