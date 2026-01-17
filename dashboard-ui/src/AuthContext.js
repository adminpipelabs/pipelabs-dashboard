import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('dashboard-user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function login(username, role = 'user') {
    const fakeUser = { username, role };
    setUser(fakeUser);
    localStorage.setItem('dashboard-user', JSON.stringify(fakeUser));
  }
  function logout() {
    setUser(null);
    localStorage.removeItem('dashboard-user');
  }
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
