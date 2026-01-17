import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { adminAPI } from '../services/api';

export default function TokenManagement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    client: '',
    project: '',
    exchanges: [],
    tradingPairs: [],
    status: 'Active'
  });

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getTokens();
      setTokens(data);
    } catch (err) {
      setError('Failed to load tokens.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      symbol: '',
      name: '',
      client: '',
      project: '',
      exchanges: [],
      tradingPairs: [],
      status: 'Active'
    });
  };

  const handleSave = async () => {
    try {
      await adminAPI.createToken(formData);
      handleCloseDialog();
      loadTokens();
    } catch (err) {
      setError('Failed to save token.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Token & Project Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all tokens and market making projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Token
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Exchanges</TableCell>
                  <TableCell>Trading Pairs</TableCell>
                  <TableCell align="right">Volume (30d)</TableCell>
                  <TableCell align="right">P&L (30d)</TableCell>
                  <TableCell align="right">Active Bots</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {token.symbol.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {token.symbol}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {token.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{token.client}</TableCell>
                    <TableCell>{token.project}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {token.exchanges.map((ex, idx) => (
                          <Chip key={idx} label={ex} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {token.tradingPairs.map((pair, idx) => (
                          <Chip key={idx} label={pair} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">{formatCurrency(token.volume)}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {token.volumeChange >= 0 ? (
                            <TrendingUpIcon fontSize="small" color="success" />
                          ) : (
                            <TrendingDownIcon fontSize="small" color="error" />
                          )}
                          <Typography
                            variant="caption"
                            color={token.volumeChange >= 0 ? 'success.main' : 'error.main'}
                          >
                            {token.volumeChange >= 0 ? '+' : ''}{token.volumeChange.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={token.pnl >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(token.pnl)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{token.activeBots}</TableCell>
                    <TableCell>
                      <Chip
                        label={token.status}
                        size="small"
                        color={token.status === 'Active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Token Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Token</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Token Symbol"
                placeholder="BTC, ETH, etc."
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Token Name"
                placeholder="Bitcoin, Ethereum, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={formData.client}
                  label="Client"
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                >
                  <MenuItem value="Acme Corp">Acme Corp</MenuItem>
                  <MenuItem value="TechStart Inc">TechStart Inc</MenuItem>
                  <MenuItem value="CryptoVentures">CryptoVentures</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Exchanges</InputLabel>
                <Select
                  multiple
                  value={formData.exchanges}
                  label="Exchanges"
                  onChange={(e) => setFormData({ ...formData, exchanges: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="Binance">Binance</MenuItem>
                  <MenuItem value="Kraken">Kraken</MenuItem>
                  <MenuItem value="Coinbase">Coinbase</MenuItem>
                  <MenuItem value="Bitfinex">Bitfinex</MenuItem>
                  <MenuItem value="Huobi">Huobi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trading Pairs"
                placeholder="e.g., BTC/USD, BTC/USDT, BTC/EUR"
                helperText="Comma-separated list"
                value={formData.tradingPairs.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  tradingPairs: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Add Token
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
