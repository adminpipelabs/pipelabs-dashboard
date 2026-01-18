import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  ListSubheader,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VerifiedUser as VerifiedIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const EXCHANGES = [
  // Major Tier 1 Exchanges
  { value: 'binance', label: 'Binance', passphrase: false, group: 'Major Exchanges' },
  { value: 'binance_us', label: 'Binance US', passphrase: false, group: 'Major Exchanges' },
  { value: 'bybit', label: 'Bybit', passphrase: false, group: 'Major Exchanges' },
  { value: 'okx', label: 'OKX', passphrase: true, group: 'Major Exchanges' },
  { value: 'kucoin', label: 'KuCoin', passphrase: true, group: 'Major Exchanges' },
  { value: 'coinbase', label: 'Coinbase', passphrase: false, group: 'Major Exchanges' },
  { value: 'kraken', label: 'Kraken', passphrase: false, group: 'Major Exchanges' },
  
  // Tier 2 Exchanges
  { value: 'gateio', label: 'Gate.io', passphrase: false, group: 'Popular Exchanges' },
  { value: 'huobi', label: 'Huobi', passphrase: false, group: 'Popular Exchanges' },
  { value: 'bitfinex', label: 'Bitfinex', passphrase: false, group: 'Popular Exchanges' },
  { value: 'bitmart', label: 'BitMart', passphrase: true, group: 'Popular Exchanges' },
  { value: 'bitget', label: 'Bitget', passphrase: false, group: 'Popular Exchanges' },
  { value: 'mexc', label: 'MEXC', passphrase: false, group: 'Popular Exchanges' },
  { value: 'crypto_com', label: 'Crypto.com', passphrase: false, group: 'Popular Exchanges' },
  
  // Additional Exchanges
  { value: 'poloniex', label: 'Poloniex', passphrase: false, group: 'Other Exchanges' },
  { value: 'ascendex', label: 'AscendEX', passphrase: false, group: 'Other Exchanges' },
  { value: 'phemex', label: 'Phemex', passphrase: false, group: 'Other Exchanges' },
  { value: 'bitmex', label: 'BitMEX', passphrase: false, group: 'Other Exchanges' },
  { value: 'dydx', label: 'dYdX', passphrase: false, group: 'Other Exchanges' },
  { value: 'bittrex', label: 'Bittrex', passphrase: false, group: 'Other Exchanges' },
  { value: 'probit', label: 'ProBit', passphrase: false, group: 'Other Exchanges' },
  { value: 'whitebit', label: 'WhiteBit', passphrase: false, group: 'Other Exchanges' },
  { value: 'hitbtc', label: 'HitBTC', passphrase: false, group: 'Other Exchanges' },
  { value: 'bitstamp', label: 'Bitstamp', passphrase: false, group: 'Other Exchanges' },
  { value: 'gemini', label: 'Gemini', passphrase: false, group: 'Other Exchanges' },
];

// Get unique groups
const EXCHANGE_GROUPS = [...new Set(EXCHANGES.map(ex => ex.group))];

const getExchangesByGroup = (group) => EXCHANGES.filter(ex => ex.group === group);

export default function APIKeysManagement() {
  const { clientId } = useParams();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [formData, setFormData] = useState({
    exchange: 'binance',
    api_key: '',
    api_secret: '',
    passphrase: '',
    label: '',
    is_testnet: false,
    notes: '',
  });

  useEffect(() => {
    if (clientId) {
      loadAPIKeys();
    }
  }, [clientId]);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/clients/${clientId}/api-keys`);
      setApiKeys(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      exchange: 'binance',
      api_key: '',
      api_secret: '',
      passphrase: '',
      label: '',
      is_testnet: false,
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      exchange: 'binance',
      api_key: '',
      api_secret: '',
      passphrase: '',
      label: '',
      is_testnet: false,
      notes: '',
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      await api.post('/admin/api-keys', {
        client_id: clientId,
        ...formData,
      });
      handleCloseDialog();
      loadAPIKeys();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add API key');
    }
  };

  const handleDelete = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return;
    }
    try {
      await api.delete(`/admin/api-keys/${keyId}`);
      loadAPIKeys();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete API key');
    }
  };

  const handleViewKey = async (keyId) => {
    try {
      const response = await api.get(`/admin/api-keys/${keyId}`);
      setSelectedKey(response.data);
      setViewDialog(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to view API key');
    }
  };

  const handleVerify = async (keyId) => {
    try {
      await api.post(`/admin/api-keys/${keyId}/verify`);
      loadAPIKeys();
      alert('API key verified (placeholder - implement exchange verification)');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify API key');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const handleToggleActive = async (keyId, isActive) => {
    try {
      await api.put(`/admin/api-keys/${keyId}`, { is_active: !isActive });
      loadAPIKeys();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update API key');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Exchange API Keys
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add API Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Exchange</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>API Key</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Network</TableCell>
              <TableCell>Last Verified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No API keys added yet. Click "Add API Key" to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <Chip
                      label={key.exchange.toUpperCase()}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{key.label || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <code style={{ fontSize: '0.85rem' }}>{key.api_key_preview}</code>
                      <Tooltip title="View full key">
                        <IconButton size="small" onClick={() => handleViewKey(key.id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={key.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={key.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={key.is_testnet ? 'Testnet' : 'Mainnet'}
                      size="small"
                      color={key.is_testnet ? 'warning' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    {key.last_verified_at
                      ? new Date(key.last_verified_at).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Toggle Active/Inactive">
                      <Switch
                        checked={key.is_active}
                        onChange={() => handleToggleActive(key.id, key.is_active)}
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Verify Key">
                      <IconButton size="small" onClick={() => handleVerify(key.id)}>
                        <VerifiedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(key.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add API Key Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Exchange API Key</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Exchange"
              value={formData.exchange}
              onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
              fullWidth
            >
              {EXCHANGE_GROUPS.map((group) => [
                <ListSubheader key={group}>{group}</ListSubheader>,
                ...getExchangesByGroup(group).map((ex) => (
                  <MenuItem key={ex.value} value={ex.value}>
                    {ex.label}
                  </MenuItem>
                ))
              ])}
            </TextField>

            <TextField
              label="Label (Optional)"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Main Account, Futures"
              fullWidth
            />

            <TextField
              label="API Key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="API Secret"
              value={formData.api_secret}
              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
              type="password"
              required
              fullWidth
            />

            {EXCHANGES.find(ex => ex.value === formData.exchange)?.passphrase && (
              <TextField
                label="Passphrase"
                value={formData.passphrase}
                onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                type="password"
                helperText={`Required for ${EXCHANGES.find(ex => ex.value === formData.exchange)?.label}`}
                fullWidth
              />
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_testnet}
                  onChange={(e) => setFormData({ ...formData, is_testnet: e.target.checked })}
                />
              }
              label="Testnet"
            />

            <TextField
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.api_key || !formData.api_secret}
          >
            Add API Key
          </Button>
        </DialogActions>
      </Dialog>

      {/* View API Key Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Details</DialogTitle>
        <DialogContent>
          {selectedKey && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning">
                <strong>Security Warning:</strong> Keep these credentials secure. Never share them.
              </Alert>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  API Key
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <code style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {selectedKey.api_key}
                  </code>
                  <IconButton size="small" onClick={() => handleCopy(selectedKey.api_key)}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  API Secret
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <code style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {selectedKey.api_secret}
                  </code>
                  <IconButton size="small" onClick={() => handleCopy(selectedKey.api_secret)}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {selectedKey.passphrase && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Passphrase
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <code style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                      {selectedKey.passphrase}
                    </code>
                    <IconButton size="small" onClick={() => handleCopy(selectedKey.passphrase)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {selectedKey.notes && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{selectedKey.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
