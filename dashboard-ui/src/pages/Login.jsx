import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountBalanceWallet as WalletIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import WalletConnect from '../components/WalletConnect';

export default function Login() {
  const { user, login } = useAuth();
  const [tab, setTab] = useState(0); // 0 = email, 1 = wallet
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  // Check for expired session message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
    // Clear expired param from URL
    if (urlParams.get('expired')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Clear any invalid tokens on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token === 'mock-token-12345' || !token) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }, []);

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // MOCK MODE disabled - use real backend
      // Set to true to enable mock mode for testing
      if (false) { // Change to true to enable mock mode
        // Mock successful login
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        // Determine role based on email
        const role = email.includes('admin') ? 'admin' : 'client';
        
        const mockUser = {
          id: '123',
          email: email,
          role: role,
          is_active: true,
        };

        // Store mock token and user data
        localStorage.setItem('access_token', 'mock-token-12345');
        localStorage.setItem('user', JSON.stringify(mockUser));

        // Update auth context
        login(email, null, role);
        setLoading(false);
        return;
      }

      // REAL API CALL (for when backend is ready)
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app'}/api/auth/email/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            totp_code: totpCode || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();

      // Store token and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update auth context
      login(data.user.email, null, data.user.role);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSuccess = (userData) => {
    // Update auth context
    login(userData.wallet_address, null, userData.role);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          mx: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
              Pipe Labs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            centered
            sx={{ mb: 3 }}
          >
            <Tab icon={<EmailIcon />} label="Email" />
            <Tab icon={<WalletIcon />} label="Wallet" />
          </Tabs>

          {/* Email Login Tab */}
          {tab === 0 && (
            <form onSubmit={handleEmailLogin}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>🧪 Test Mode Active</strong>
                  <br />
                  Use any email/password to login. Add "admin" in email for admin access.
                </Typography>
              </Alert>
              
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                required
                autoFocus
                disabled={loading}
                helperText="Try: user@test.com (client) or admin@test.com (admin)"
              />
              
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                disabled={loading}
                helperText="Any password works in test mode"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="2FA Code (if enabled)"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="Optional for admins with 2FA"
                disabled={loading}
                helperText="Leave blank if you don't have 2FA enabled"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !email || !password}
                sx={{ mt: 3, mb: 2 }}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Logging in...' : 'Log In with Email'}
              </Button>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" underline="hover" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                  Sign up now
                </Link>
              </Typography>
            </form>
          )}

          {/* Wallet Login Tab */}
          {tab === 1 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                Connect your Ethereum wallet to securely sign in
              </Typography>

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<WalletIcon />}
                onClick={() => setWalletDialogOpen(true)}
                sx={{ py: 1.5 }}
              >
                Connect Wallet
              </Button>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Supported Wallets:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • MetaMask
                  <br />
                  • WalletConnect
                  <br />
                  • Coinbase Wallet
                  <br />
                  • Trust Wallet
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>New to wallet login?</strong> You'll sign a message to prove wallet
                  ownership. No gas fees required!
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Switch Tab Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setTab(tab === 0 ? 1 : 0)}
            startIcon={tab === 0 ? <WalletIcon /> : <EmailIcon />}
          >
            {tab === 0 ? 'Connect with Wallet Instead' : 'Log In with Email Instead'}
          </Button>
        </CardContent>
      </Card>

      {/* Wallet Connect Dialog */}
      <WalletConnect
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
        onSuccess={handleWalletSuccess}
      />
    </Box>
  );
}
