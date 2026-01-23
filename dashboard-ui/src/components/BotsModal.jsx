import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { adminAPI } from '../services/api';

export default function BotsModal({ open, onClose, clientId, clientName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(true);
  
  const [formData, setFormData] = useState({
    exchange: '',
    trading_pair: '',
    bot_type: 'both',
    spread_target: 0.3,
    volume_target_daily: 10000,
    config_name: '',
  });

  useEffect(() => {
    if (open && clientId) {
      loadExchanges();
      resetForm();
    }
  }, [open, clientId]);

  const loadExchanges = async () => {
    setLoadingExchanges(true);
    setError(null);
    try {
      const apiKeys = await adminAPI.getClientAPIKeys(clientId);
      // Filter only active exchanges
      const activeExchanges = apiKeys
        .filter(key => key.is_active)
        .map(key => ({
          id: key.id,
          exchange: key.exchange,
          label: key.label || key.exchange,
        }));
      setExchanges(activeExchanges);
      
      if (activeExchanges.length === 0) {
        setError('No exchanges configured. Add an API key first.');
      }
    } catch (err) {
      console.error('Failed to load exchanges:', err);
      setError('Failed to load exchanges. Please try again.');
    } finally {
      setLoadingExchanges(false);
    }
  };

  const resetForm = () => {
    setFormData({
      exchange: '',
      trading_pair: '',
      bot_type: 'both',
      spread_target: 0.3,
      volume_target_daily: 10000,
      config_name: '',
    });
    setError(null);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.exchange) {
      setError('Please select an exchange');
      return false;
    }
    if (!formData.trading_pair) {
      setError('Please enter a trading pair (e.g., SHARP-USDT)');
      return false;
    }
    // Validate trading pair format (should be TOKEN-QUOTE)
    if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(formData.trading_pair.toUpperCase())) {
      setError('Invalid trading pair format. Use format: TOKEN-QUOTE (e.g., SHARP-USDT)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const pairData = {
        client_id: clientId,
        exchange: formData.exchange,
        trading_pair: formData.trading_pair.toUpperCase(),
        bot_type: formData.bot_type,
        spread_target: formData.spread_target || null,
        volume_target_daily: formData.volume_target_daily || null,
        config_name: formData.config_name || null,
      };

      await adminAPI.createPair(clientId, pairData);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
      resetForm();
    } catch (err) {
      console.error('Failed to create bot:', err);
      setError(err.message || 'Failed to create bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Create New Bot - {clientName}
      </DialogTitle>
      <DialogContent>
        {loadingExchanges ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {exchanges.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No exchanges configured. Add an API key first.
              </Alert>
            )}

            {error && exchanges.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Exchange</InputLabel>
                  <Select
                    value={formData.exchange}
                    label="Exchange"
                    onChange={handleInputChange('exchange')}
                    disabled={exchanges.length === 0}
                  >
                    {exchanges.map((ex) => (
                      <MenuItem key={ex.id} value={ex.exchange}>
                        {ex.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Trading Pair"
                  value={formData.trading_pair}
                  onChange={handleInputChange('trading_pair')}
                  placeholder="e.g., SHARP-USDT"
                  helperText="Format: TOKEN-QUOTE (e.g., SHARP-USDT, BTC-USDT)"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Bot Type</InputLabel>
                  <Select
                    value={formData.bot_type}
                    label="Bot Type"
                    onChange={handleInputChange('bot_type')}
                  >
                    <MenuItem value="spread">Spread Only (Market Making)</MenuItem>
                    <MenuItem value="volume">Volume Only</MenuItem>
                    <MenuItem value="both">Both (Spread + Volume)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Spread Target (%)"
                  value={formData.spread_target}
                  onChange={handleNumberChange('spread_target')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  helperText="Target spread for market making"
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Daily Volume Target"
                  value={formData.volume_target_daily}
                  onChange={handleNumberChange('volume_target_daily')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Target daily trading volume"
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Config Name (Optional)"
                  value={formData.config_name}
                  onChange={handleInputChange('config_name')}
                  placeholder="e.g., Sharp Main Bot"
                  helperText="Custom name for this bot configuration"
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || exchanges.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Bot'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
