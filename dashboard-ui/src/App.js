// Build trigger v5 - FORCE FRONTEND REBUILD v0.1.4 - Railway deployment trigger
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Portfolio, Orders, Bots, Agent } from './pages';
import Login from './pages/Login';
import Register from './pages/Register';
import Reports from './pages/Reports';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClientManagement from './pages/ClientManagement';
import TokenManagement from './pages/TokenManagement';
import ClientDetailView from './pages/ClientDetailView';
import APIKeysManagement from './pages/APIKeysManagement';
import { Box, Drawer, List, ListItem, ListItemText, Toolbar, Divider, ListSubheader, Fab, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Header from './Header';
import ChatSidebar from './components/ChatSidebar';
import { AppColorProvider } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

const drawerWidth = 240;
const menuItems = [
  { text: 'Dashboard', path: '/' },
  { text: 'Orders', path: '/orders' },
  { text: 'Bots', path: '/bots' },
  { text: 'Reports', path: '/reports' },
  { text: 'AI Agent', path: '/agent' }
];

const adminMenuItems = [
  { text: 'Admin Overview', path: '/admin' },
  { text: 'Client Management', path: '/admin/clients' },
  { text: 'Token Management', path: '/admin/tokens' },
  { text: 'API Keys Management', path: '/admin/api-keys' }];

function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(() => {
    const saved = localStorage.getItem('chat-sidebar-open');
    return saved ? JSON.parse(saved) : true; // Default open
  });
  
  useEffect(() => {
    localStorage.setItem('chat-sidebar-open', JSON.stringify(chatOpen));
  }, [chatOpen]);
  
  // Clear invalid mock tokens on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token === 'mock-token-12345') {
      console.warn('⚠️ Clearing invalid mock token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/login');
      }
    }
  }, [location.pathname, navigate]);
  
  if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
    // Guard everything except login and register
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const isAdmin = user && user.role === 'admin';
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const chatSidebarWidth = chatOpen ? 380 : 0;
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Header username={user ? user.username : ''} role={user ? user.role : ''} />
      {/* Sidebar only if logged in */}
      {user && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', top: 64 },
          }}
        >
          <Toolbar />
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Use navigate without causing page reload
                  navigate(item.path);
                }}
                selected={location.pathname === item.path}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }
                }}
              >
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          {isAdmin && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListSubheader>Admin</ListSubheader>
              <List>
                {adminMenuItems.map((item) => (
                  <ListItem button key={item.text} component={Link} to={item.path}>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Drawer>
      )}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default', 
          p: 3, 
          minHeight: '100vh',
          marginRight: `${chatSidebarWidth}px`,
          transition: 'margin-right 0.3s'
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/bots" element={<ProtectedRoute><Bots /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><Agent /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute><ClientManagement /></ProtectedRoute>} />
          <Route path="/admin/clients/:clientId" element={<ProtectedRoute><ClientDetailView /></ProtectedRoute>} />
        <Route path="/admin/clients/:clientId/api-keys" element={<ProtectedRoute><APIKeysManagement /></ProtectedRoute>} />
          <Route path="/admin/tokens" element={<ProtectedRoute><TokenManagement /></ProtectedRoute>} />
                <Route path="/admin/api-keys" element={<ProtectedRoute><APIKeysManagement /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Box>

      {user && !isLoginPage && !isRegisterPage && (
        <>
          <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} />
          {!chatOpen && (
            <Tooltip title="Open AI Assistant" placement="left">
              <Fab
                color="primary"
                onClick={() => setChatOpen(true)}
                sx={{
                  position: 'fixed',
                  bottom: 24,
                  right: 24,
                  zIndex: 1000
                }}
              >
                <SmartToyIcon />
              </Fab>
            </Tooltip>
          )}
        </>
      )}
    </Box>
  );
}

function App() {
  return (
    <AppColorProvider>
      <AuthProvider>
        <Router>
          <Layout />
        </Router>
      </AuthProvider>
    </AppColorProvider>
  );
}

export default App;
