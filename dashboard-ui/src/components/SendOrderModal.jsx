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
import { cacheExchangeMetadata, getCachedExchangeMetadata } from '../utils/exchangeCache';

export default function SendOrderModal({ open, onClose, clientId, clientName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(true);
  
  const [formData, setFormData] = useState({
    exchange: '',
    trading_pair: '',
    order_type: 'MARKET',
    side: 'BUY',
    quantity: '',
    price: '',
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
    
    // Try to load from cache first (for offline/quick loading)
    const cached = getCachedExchangeMetadata(clientId);
    if (cached && cached.length > 0) {
      setExchanges(cached);
      setLoadingExchanges(false);
    }
    
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
      
      // Cache the metadata (NOT the keys themselves)
      cacheExchangeMetadata(clientId, activeExchanges);
      
      setExchanges(activeExchanges);
      
      if (activeExchanges.length === 0) {
        setError('No active API keys found. Add an API key first.');
      }
    } catch (err) {
      console.error('Failed to load exchanges:', err);
      
      // If we have cached data, use it even if server fails
      if (cached && cached.length > 0) {
        setError('Using cached exchange list. Server unavailable.');
      } else {
        setError('Failed to load exchanges. Please try again.');
      }
    } finally {
      setLoadingExchanges(false);
    }
  };

  const resetForm = () => {
    setFormData({
      exchange: '',
      trading_pair: '',
      order_type: 'MARKET',
      side: 'BUY',
      quantity: '',
      price: '',
    });
    setError(null);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field) => (event) => {
    const value = event.target.value;
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
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }
    if (formData.order_type === 'LIMIT' && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError('Please enter a valid price for limit orders');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Validate exchange is selected
      if (!formData.exchange || formData.exchange.trim() === '') {
        setError('Please select an exchange');
        setLoading(false);
        return;
      }
      
      // Format trading pair (ensure correct format)
      const tradingPairFormatted = formData.trading_pair.toUpperCase().replace('-', '/');
      
      const orderData = {
        exchange: formData.exchange.toLowerCase().trim(),
        trading_pair: tradingPairFormatted,
        side: formData.side,
        order_type: formData.order_type,
        quantity: parseFloat(formData.quantity),
        ...(formData.order_type === 'LIMIT' && formData.price ? { price: parseFloat(formData.price) } : {}),
      };

      // Call backend endpoint to send order via Trading Bridge
      const result = await adminAPI.sendOrder(clientId, orderData);
      
      // Backend returns {success: true, order_id, ...} or throws error
      if (result && result.success !== false) {
        // Show success message
        alert(`Order placed successfully!\nOrder ID: ${result.order_id || 'N/A'}\nTrading Pair: ${result.trading_pair || orderData.trading_pair}\nSide: ${result.side || orderData.side}\nQuantity: ${result.quantity || orderData.quantity}`);
        
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
        resetForm();
      } else {
        setError(result?.message || result?.detail || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Failed to send order:', err);
      // Extract error message from response
      let errorMessage = 'Failed to send order. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      // Check if it's a connector issue
      if (errorMessage.includes('not found in Trading Bridge') || errorMessage.includes('connector')) {
        errorMessage += '\n\n💡 Tip: Use "Trading Bridge Diagnostics" above to reinitialize connectors first.';
      }
      
      setError(errorMessage);
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
        Send Order - {clientName}
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
                No active API keys found. Add an API key first.
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
                  placeholder="e.g., SHARP/USDT"
                  helperText="Format: TOKEN/QUOTE (e.g., SHARP/USDT, BTC/USDT)"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Order Type</InputLabel>
                  <Select
                    value={formData.order_type}
                    label="Order Type"
                    onChange={handleInputChange('order_type')}
                  >
                    <MenuItem value="MARKET">Market</MenuItem>
                    <MenuItem value="LIMIT">Limit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Side</InputLabel>
                  <Select
                    value={formData.side}
                    label="Side"
                    onChange={handleInputChange('side')}
                  >
                    <MenuItem value="BUY">Buy</MenuItem>
                    <MenuItem value="SELL">Sell</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={formData.order_type === 'LIMIT' ? 6 : 12}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Quantity"
                  value={formData.quantity}
                  onChange={handleNumberChange('quantity')}
                  placeholder="0.00"
                  inputProps={{ min: 0, step: 0.00000001 }}
                />
              </Grid>

              {formData.order_type === 'LIMIT' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Price"
                    value={formData.price}
                    onChange={handleNumberChange('price')}
                    placeholder="0.00"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              )}
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
          color="success"
        >
          {loading ? <CircularProgress size={24} /> : 'Send Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
