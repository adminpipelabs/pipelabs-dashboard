import React, { useState } from 'react';
import { BrowserProvider } from 'ethers';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

/**
 * WalletConnect Component
 * Handles MetaMask and other Web3 wallet connections
 * Signs message and authenticates with backend
 */
export default function WalletConnect({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        setLoading(false);
        return;
      }

      // Request account access
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      
      // Get nonce/message from backend
      const nonceResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app'}/api/auth/nonce/${walletAddress}`
      );
      
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from server');
      }

      const { message } = await nonceResponse.json();

      // Get signer and sign message
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Send to backend for verification
      const loginResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app'}/api/auth/wallet/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            signature: signature,
            message: message,
          }),
        }
      );

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await loginResponse.json();

      // Store token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call success callback
      onSuccess(data.user);
      onClose();

    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWalletIcon />
          Connect Your Wallet
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" gutterBottom>
            Connect your Ethereum wallet to securely sign in to Pipe Labs Dashboard.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            We support:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>
              <Typography variant="body2">MetaMask</Typography>
            </li>
            <li>
              <Typography variant="body2">WalletConnect</Typography>
            </li>
            <li>
              <Typography variant="body2">Coinbase Wallet</Typography>
            </li>
            <li>
              <Typography variant="body2">Trust Wallet</Typography>
            </li>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>New to wallet login?</strong> Your wallet will sign a message to prove ownership. 
              This is secure and doesn't cost any gas fees.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={connectWallet}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWalletIcon />}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
