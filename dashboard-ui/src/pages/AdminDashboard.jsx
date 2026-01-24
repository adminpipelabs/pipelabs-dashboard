import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TokenIcon from '@mui/icons-material/Token';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { adminAPI } from '../services/api';
import PriceDisplay from '../components/PriceDisplay';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load admin dashboard.');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Platform Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Multi-tenant trading platform metrics and management
      </Typography>

      {/* Live Price Display - Direct Hummingbot MCP (like Claude Desktop) */}
      <Box sx={{ mb: 3 }}>
        <PriceDisplay 
          defaultExchange="bitmart"
          defaultPair="SHARP-USDT"
          autoRefresh={true}
          refreshInterval={10000}
        />
      </Box>

      {dashboardData && (
        <>
          {/* Platform Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Total Clients
                    </Typography>
                  </Box>
                  <Typography variant="h3">{dashboardData.metrics.totalClients}</Typography>
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    {dashboardData.metrics.activeClients} active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TokenIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Tokens
                    </Typography>
                  </Box>
                  <Typography variant="h3">{dashboardData.metrics.totalTokens}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Across {dashboardData.metrics.totalProjects} projects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Exchanges
                    </Typography>
                  </Box>
                  <Typography variant="h3">{dashboardData.metrics.totalExchanges}</Typography>
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    All operational
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SmartToyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Active Bots
                    </Typography>
                  </Box>
                  <Typography variant="h3">{dashboardData.metrics.activeBots}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {dashboardData.metrics.totalBots} total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Financial Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Platform Volume (30d)
                  </Typography>
                  <Typography variant="h4">{formatCurrency(dashboardData.financial.totalVolume)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {dashboardData.financial.volumeChange >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={dashboardData.financial.volumeChange >= 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {formatPercentage(dashboardData.financial.volumeChange)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Platform Revenue (30d)
                  </Typography>
                  <Typography
                    variant="h4"
                    color={dashboardData.financial.totalRevenue >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(dashboardData.financial.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Avg: {formatCurrency(dashboardData.financial.avgRevenuePerClient)}/client
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Trades (30d)
                  </Typography>
                  <Typography variant="h4">{formatNumber(dashboardData.financial.totalTrades)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formatCurrency(dashboardData.financial.avgTradeSize)} avg size
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Performing Clients */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Clients
              </Typography>
              <Grid container spacing={2}>
                {dashboardData.topClients.map((client, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {client.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {client.projects} projects • {client.tokens} tokens
                            </Typography>
                          </Box>
                          <Chip
                            label={client.status}
                            size="small"
                            color={client.status === 'Active' ? 'success' : 'default'}
                          />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Volume: {formatCurrency(client.volume)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Revenue: {formatCurrency(client.revenue)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bots: {client.activeBots}/{client.totalBots}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Grid container spacing={2}>
                {dashboardData.systemHealth.map((item, idx) => (
                  <Grid item xs={12} md={3} key={idx}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{item.service}</Typography>
                        <Chip
                          label={item.status}
                          size="small"
                          color={item.status === 'Healthy' ? 'success' : 'error'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Uptime: {item.uptime}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
