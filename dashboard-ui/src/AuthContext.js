import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password, role = 'user') => {
    // This is called after successful authentication
    // User data is already stored in localStorage by Login component
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      return true;
    }
    
    // Fallback for mock login
    const userData = {
      username,
      role,
      id: Math.random().toString(36).substr(2, 9),
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return true;
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch(
          `${process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app'}/api/auth/logout`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Get access token for API calls
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  // Check if token is expired and refresh if needed
  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      return false;
    }

    try {
      // Verify token by calling /me endpoint
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app'}/api/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Token invalid or expired
        logout();
        return false;
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;

    } catch (error) {
      console.error('Auth check error:', error);
      logout();
      return false;
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated, 
        isAdmin,
        getToken,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
