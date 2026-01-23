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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { adminAPI } from '../services/api';

export default function PairsModal({ open, onClose, clientId, clientName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(true);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    exchange: '',
    trading_pair: '',
    bot_type: 'both',
    spread_target: 0.3,
    volume_target_daily: 10000,
  });

  useEffect(() => {
    if (open && clientId) {
      loadExchanges();
      loadPairs();
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

  const loadPairs = async () => {
    setLoadingPairs(true);
    try {
      const pairsData = await adminAPI.getClientPairs(clientId);
      setPairs(pairsData || []);
    } catch (err) {
      console.error('Failed to load pairs:', err);
    } finally {
      setLoadingPairs(false);
    }
  };

  const resetForm = () => {
    setFormData({
      exchange: '',
      trading_pair: '',
      bot_type: 'both',
      spread_target: 0.3,
      volume_target_daily: 10000,
    });
    setError(null);
    setShowAddForm(false);
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
    // Check if pair already exists
    const exists = pairs.some(
      p => p.exchange === formData.exchange && 
           p.trading_pair.toUpperCase() === formData.trading_pair.toUpperCase()
    );
    if (exists) {
      setError('This trading pair already exists for this exchange');
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
      };

      await adminAPI.createPair(clientId, pairData);
      
      // Reload pairs
      await loadPairs();
      
      // Reset form but keep modal open
      resetForm();
      setShowAddForm(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create trading pair:', err);
      setError(err.message || 'Failed to create trading pair. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pairId) => {
    if (!window.confirm('Are you sure you want to delete this trading pair?')) return;
    
    try {
      await adminAPI.deletePair(pairId);
      await loadPairs();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to delete pair:', err);
      setError(err.message || 'Failed to delete trading pair.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Trading Pairs - {clientName}
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

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Existing Trading Pairs</Typography>
              <Button
                variant="contained"
                color="success"
                onClick={() => setShowAddForm(true)}
                disabled={exchanges.length === 0}
              >
                + Add Trading Pair
              </Button>
            </Box>

            {showAddForm && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Add New Trading Pair
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Exchange</InputLabel>
                      <Select
                        value={formData.exchange}
                        label="Exchange"
                        onChange={handleInputChange('exchange')}
                      >
                        {exchanges.map((ex) => (
                          <MenuItem key={ex.id} value={ex.exchange}>
                            {ex.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Trading Pair"
                      value={formData.trading_pair}
                      onChange={handleInputChange('trading_pair')}
                      placeholder="e.g., SHARP-USDT"
                      helperText="Format: TOKEN-QUOTE"
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Bot Type</InputLabel>
                      <Select
                        value={formData.bot_type}
                        label="Bot Type"
                        onChange={handleInputChange('bot_type')}
                      >
                        <MenuItem value="spread">Spread Only</MenuItem>
                        <MenuItem value="volume">Volume Only</MenuItem>
                        <MenuItem value="both">Both</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Spread Target (%)"
                      value={formData.spread_target}
                      onChange={handleNumberChange('spread_target')}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Daily Volume Target"
                      value={formData.volume_target_daily}
                      onChange={handleNumberChange('volume_target_daily')}
                      inputProps={{ min: 0, step: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Add Pair'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          resetForm();
                          setShowAddForm(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {loadingPairs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : pairs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No trading pairs configured
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exchange</TableCell>
                      <TableCell>Trading Pair</TableCell>
                      <TableCell>Bot Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Spread Target</TableCell>
                      <TableCell align="right">Volume Target</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pairs.map((pair) => (
                      <TableRow key={pair.id}>
                        <TableCell>
                          <Chip label={pair.exchange} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {pair.trading_pair}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={pair.bot_type} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pair.status}
                            size="small"
                            color={
                              pair.status === 'active' ? 'success' :
                              pair.status === 'paused' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          {pair.spread_target ? `${pair.spread_target}%` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {pair.volume_target_daily ? `$${pair.volume_target_daily.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(pair.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
