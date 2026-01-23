import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import APIKeysManagement from './APIKeysManagement';
import BotsModal from '../components/BotsModal';
import SendOrderModal from '../components/SendOrderModal';
import PairsModal from '../components/PairsModal';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export default function ClientDetailView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [selectedToken, setSelectedToken] = useState('all');
  const [selectedExchange, setSelectedExchange] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [showBotsModal, setShowBotsModal] = useState(false);
  const [showSendOrderModal, setShowSendOrderModal] = useState(false);
  const [showPairsModal, setShowPairsModal] = useState(false);

  const loadClientData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getClientDetail(clientId);
      setClientData(data);
    } catch (err) {
      setError('Failed to load client details.');
      console.error('Client detail load error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

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

  // Get unique tokens and exchanges for filters
  const getUniqueTokens = () => {
    if (!clientData) return [];
    const tokens = [...new Set(clientData.tradingPairs.map(p => p.token))];
    return tokens.sort();
  };

  const getUniqueExchanges = () => {
    if (!clientData) return [];
    const exchanges = [...new Set(clientData.tradingPairs.map(p => p.exchange))];
    return exchanges.sort();
  };

  // Calculate token performance
  const getTokenPerformance = () => {
    if (!clientData) return [];
    
    const tokenMap = {};
    clientData.tradingPairs.forEach(pair => {
      if (!tokenMap[pair.token]) {
        tokenMap[pair.token] = {
          token: pair.token,
          volume: 0,
          pnl: 0,
          activeBots: 0,
          pairs: []
        };
      }
      tokenMap[pair.token].volume += pair.volume;
      tokenMap[pair.token].pnl += pair.pnl;
      tokenMap[pair.token].activeBots += pair.activeBots;
      tokenMap[pair.token].pairs.push(pair.pair);
    });
    
    return Object.values(tokenMap).sort((a, b) => b.volume - a.volume);
  };

  // Filter trading pairs based on selections
  const getFilteredPairs = () => {
    if (!clientData) return [];
    
    let filtered = clientData.tradingPairs;
    
    if (selectedToken !== 'all') {
      filtered = filtered.filter(p => p.token === selectedToken);
    }
    
    if (selectedExchange !== 'all') {
      filtered = filtered.filter(p => p.exchange === selectedExchange);
    }
    
    return filtered;
  };

  // Filter bots based on selections
  const getFilteredBots = () => {
    if (!clientData) return [];
    
    let filtered = clientData.bots;
    
    if (selectedToken !== 'all') {
      // Find pairs that include this token
      const tokenPairs = clientData.tradingPairs
        .filter(p => p.token === selectedToken)
        .map(p => p.pair);
      filtered = filtered.filter(b => tokenPairs.includes(b.pair));
    }
    
    if (selectedExchange !== 'all') {
      filtered = filtered.filter(b => b.exchange === selectedExchange);
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !clientData) {
    return <Alert severity="error">{error || 'Client not found'}</Alert>;
  }

  return (
    <Box>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/clients')}
          sx={{ mr: 2 }}
        >
          Back to Clients
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">{clientData.client.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {clientData.client.email} • {clientData.client.tier} Tier
          </Typography>
        </Box>
        <Chip
          label={clientData.client.status}
          color={clientData.client.status === 'Active' ? 'success' : 'default'}
        />
      </Box>

      {/* Admin Viewing Banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        👁️ Viewing as Admin - You're seeing {clientData.client.name}'s dashboard
      </Alert>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowBotsModal(true)}
            >
              Add Bot
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={() => setShowSendOrderModal(true)}
            >
              Send Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={() => setShowPairsModal(true)}
            >
              Manage Trading Pairs
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Client Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Portfolio Value
              </Typography>
              <Typography variant="h4">{formatCurrency(clientData.metrics.portfolioValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                P&L (30d)
              </Typography>
              <Typography
                variant="h4"
                color={clientData.metrics.pnl >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(clientData.metrics.pnl)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Volume (30d)
              </Typography>
              <Typography variant="h4">{formatCurrency(clientData.metrics.volume)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Bots
              </Typography>
              <Typography variant="h4">
                {clientData.metrics.activeBots}/{clientData.metrics.totalBots}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Trading Overview" />
          <Tab label="API Keys" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Token Performance Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Performance
              </Typography>
          <Grid container spacing={2}>
            {getTokenPerformance().map((token, idx) => (
              <Grid item xs={12} md={6} lg={4} key={idx}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {token.token.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{token.token}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {token.pairs.length} pairs
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedToken(token.token)}
                      >
                        View
                      </Button>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Volume
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(token.volume)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          P&L
                        </Typography>
                        <Typography
                          variant="body1"
                          color={token.pnl >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(token.pnl)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Active Bots: {token.activeBots}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h6">Filter View:</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Token</InputLabel>
              <Select
                value={selectedToken}
                label="Token"
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <MenuItem value="all">All Tokens</MenuItem>
                {getUniqueTokens().map((token) => (
                  <MenuItem key={token} value={token}>
                    {token}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Exchange</InputLabel>
              <Select
                value={selectedExchange}
                label="Exchange"
                onChange={(e) => setSelectedExchange(e.target.value)}
              >
                <MenuItem value="all">All Exchanges</MenuItem>
                {getUniqueExchanges().map((exchange) => (
                  <MenuItem key={exchange} value={exchange}>
                    {exchange}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(selectedToken !== 'all' || selectedExchange !== 'all') && (
              <Button
                size="small"
                onClick={() => {
                  setSelectedToken('all');
                  setSelectedExchange('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Trading Pairs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Trading Pairs {(selectedToken !== 'all' || selectedExchange !== 'all') && 
                `(${getFilteredPairs().length} of ${clientData.tradingPairs.length})`}
            </Typography>
            {selectedToken !== 'all' && (
              <Chip label={`Showing: ${selectedToken}`} color="primary" size="small" />
            )}
            {selectedExchange !== 'all' && (
              <Chip label={`Exchange: ${selectedExchange}`} color="primary" size="small" />
            )}
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pair</TableCell>
                  <TableCell>Exchange</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell align="right">Volume (30d)</TableCell>
                  <TableCell align="right">P&L (30d)</TableCell>
                  <TableCell align="right">Active Bots</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredPairs().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No trading pairs match the selected filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredPairs().map((pair, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Chip label={pair.pair} size="small" />
                    </TableCell>
                    <TableCell>{pair.exchange}</TableCell>
                    <TableCell>{pair.token}</TableCell>
                    <TableCell align="right">{formatCurrency(pair.volume)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: pair.pnl >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {formatCurrency(pair.pnl)}
                    </TableCell>
                    <TableCell align="right">{pair.activeBots}</TableCell>
                    <TableCell>
                      <Chip
                        label={pair.status}
                        size="small"
                        color={pair.status === 'Active' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Bots */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Trading Bots {(selectedToken !== 'all' || selectedExchange !== 'all') && 
                `(${getFilteredBots().length} of ${clientData.bots.length})`}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowBotsModal(true)}
            >
              Add Bot
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bot Name</TableCell>
                  <TableCell>Pair</TableCell>
                  <TableCell>Exchange</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Volume (24h)</TableCell>
                  <TableCell align="right">P&L (24h)</TableCell>
                  <TableCell align="right">Uptime</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredBots().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No bots match the selected filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredBots().map((bot, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{bot.name}</TableCell>
                    <TableCell>{bot.pair}</TableCell>
                    <TableCell>{bot.exchange}</TableCell>
                    <TableCell>
                      <Chip
                        label={bot.status}
                        size="small"
                        color={bot.status === 'Running' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(bot.volume)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: bot.pnl >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {formatCurrency(bot.pnl)}
                    </TableCell>
                    <TableCell align="right">{bot.uptime}%</TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Pair</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientData.recentOrders.map((order, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.pair}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.side}
                        size="small"
                        color={order.side === 'Buy' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell align="right">{order.amount}</TableCell>
                    <TableCell align="right">{formatCurrency(order.price)}</TableCell>
                    <TableCell>
                      <Chip label={order.status} size="small" />
                    </TableCell>
                    <TableCell>{order.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
        </>
      )}

      {/* API Keys Tab */}
      {activeTab === 1 && (
        <APIKeysManagement />
      )}

      {/* Settings Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Client Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Max Spread
                </Typography>
                <Typography variant="body1">
                  {clientData.client.settings.maxSpread}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Max Daily Volume
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(clientData.client.settings.maxDailyVolume)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Projects
                </Typography>
                <Typography variant="body1">
                  {clientData.client.projects}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Tokens
                </Typography>
                <Typography variant="body1">
                  {clientData.client.tokens}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Bots Modal */}
      <BotsModal
        open={showBotsModal}
        onClose={() => setShowBotsModal(false)}
        clientId={clientId}
        clientName={clientData?.client?.name || ''}
        onSuccess={() => {
          loadClientData();
          setShowBotsModal(false);
        }}
      />

      {/* Send Order Modal */}
      <SendOrderModal
        open={showSendOrderModal}
        onClose={() => setShowSendOrderModal(false)}
        clientId={clientId}
        clientName={clientData?.client?.name || ''}
        onSuccess={() => {
          loadClientData();
          setShowSendOrderModal(false);
        }}
      />

      {/* Trading Pairs Modal */}
      <PairsModal
        open={showPairsModal}
        onClose={() => setShowPairsModal(false)}
        clientId={clientId}
        clientName={clientData?.client?.name || ''}
        onSuccess={() => {
          loadClientData();
        }}
      />
    </Box>
  );
}
