import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Avatar, Tooltip, Menu, MenuItem, Chip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useColorMode } from './ThemeContext';
import { useAuth } from './AuthContext';

export default function Header({ username = 'demo_user', role }) {
  const colorMode = useColorMode();
  const mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Pipe Labs Dashboard
        </Typography>
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <NotificationsIcon />
        </IconButton>
        <Tooltip title="Toggle light/dark mode">
          <IconButton color="inherit" onClick={colorMode.toggleColorMode}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
        {user && (
          <Box>
            <Chip
              label={user.role === 'admin' ? 'Admin' : 'User'}
              color={user.role === 'admin' ? 'secondary' : 'default'}
              size="small"
              sx={{ mr: 1 }}
            />
            <IconButton onClick={handleMenu} sx={{ ml: 1 }} color="inherit">
              <Avatar alt={user.username}>{user.username.charAt(0).toUpperCase()}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem disabled>{user.username}</MenuItem>
              <MenuItem disabled>{user.role}</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
