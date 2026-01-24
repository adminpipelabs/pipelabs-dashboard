import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  CloudSync as CloudSyncIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';

export default function TradingBridgeDiagnostics({ clientId, clientName }) {
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [clientStatus, setClientStatus] = useState(null);
  const [reinitResults, setReinitResults] = useState(null);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test Trading Bridge directly
      const response = await fetch('https://trading-bridge-production.up.railway.app/health');
      const data = await response.json();
      setHealthStatus({
        status: response.ok ? 'healthy' : 'error',
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setHealthStatus({
        status: 'error',
        error: err.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkClientStatus = async () => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getClientTradingBridgeStatus(clientId);
      setClientStatus({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setError(err.message || 'Failed to check client status');
      console.error('Status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reinitializeConnectors = async () => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }

    if (!window.confirm(`Reinitialize all Trading Bridge connectors for ${clientName || 'this client'}? This will recreate accounts and add connectors.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setReinitResults(null);
    try {
      const data = await adminAPI.reinitializeClientConnectors(clientId);
      setReinitResults({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      });
      
      // Refresh client status after reinitialize
      setTimeout(() => {
        checkClientStatus();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to reinitialize connectors');
      console.error('Reinitialize error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CloudSyncIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Trading Bridge Diagnostics</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Health Check */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Trading Bridge Health
              </Typography>
              {healthStatus && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={healthStatus.status === 'healthy' ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={healthStatus.status === 'healthy' ? 'Healthy' : 'Error'}
                    color={healthStatus.status === 'healthy' ? 'success' : 'error'}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    {healthStatus.timestamp}
                  </Typography>
                </Box>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={checkHealth}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{ mt: 1 }}
              >
                Check Health
              </Button>
            </Box>
          </Grid>

          {/* Client Status */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Client Status
              </Typography>
              {clientStatus && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={clientStatus.account_status?.exists ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={clientStatus.account_status?.exists ? 'Account Exists' : 'No Account'}
                    color={clientStatus.account_status?.exists ? 'success' : 'warning'}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Connectors: {clientStatus.connectors_status?.connectors?.length || 0}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {clientStatus.timestamp}
                  </Typography>
                </Box>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={checkClientStatus}
                disabled={loading || !clientId}
                startIcon={<AccountBalanceIcon />}
                sx={{ mt: 1 }}
              >
                Check Status
              </Button>
            </Box>
          </Grid>

          {/* Reinitialize */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fix Connectors
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                Recreate accounts and add connectors
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={reinitializeConnectors}
                disabled={loading || !clientId}
                startIcon={<CloudSyncIcon />}
                sx={{ mt: 1 }}
              >
                Reinitialize
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Detailed Results */}
        {clientStatus && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Client Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Account Name</Typography>
                <Typography variant="body2">{clientStatus.account_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">API Keys</Typography>
                <Typography variant="body2">{clientStatus.api_keys_count} active</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Connectors</Typography>
                {clientStatus.connectors_status?.connectors?.length > 0 ? (
                  <List dense>
                    {clientStatus.connectors_status.connectors.map((conn, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={conn.connector_name || conn.exchange} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No connectors configured
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Reinitialize Results */}
        {reinitResults && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Reinitialize Results
            </Typography>
            {reinitResults.results && reinitResults.results.length > 0 ? (
              <List dense>
                {reinitResults.results.map((result, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon>
                      {result.success ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.exchange}
                      secondary={result.message || result.error || 'Completed'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No results available</Alert>
            )}
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
