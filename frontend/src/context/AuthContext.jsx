import React from 'react';

const AuthContext = React.createContext(null);

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState(() => localStorage.getItem('subsync_token'));
  const [loading, setLoading] = React.useState(true);

  const isAuthenticated = !!token && !!user;

  // Load user on mount if token exists
  React.useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUser(authToken) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token invalid or expired
        localStorage.removeItem('subsync_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('subsync_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password, captchaToken) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captchaToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('subsync_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function signup(full_name, email, password, captchaToken) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password, captchaToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  }

  function logout() {
    localStorage.removeItem('subsync_token');
    setToken(null);
    setUser(null);
    window.location.hash = '#/login';
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
