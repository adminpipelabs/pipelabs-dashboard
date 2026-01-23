import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { clientAPI } from '../services/api';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch real data from API
      const [portfolio, balances, trades] = await Promise.all([
        clientAPI.getPortfolio().catch(() => ({ total_pnl: 0, volume_24h: 0, active_bots: 0, total_bots: 0 })),
        clientAPI.getBalances().catch(() => []),
        clientAPI.getTrades(null, 100, timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30).catch(() => [])
      ]);
      
      // Calculate total portfolio value from balances
      const totalValue = balances.reduce((sum, b) => sum + (b.usd_value || 0), 0);
      
      // Calculate P&L from portfolio
      const totalPnl = portfolio.total_pnl || 0;
      const pnlPercent = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;
      
      // Calculate volume from trades
      const volume24h = portfolio.volume_24h || 0;
      const volume7d = trades.reduce((sum, t) => {
        const price = parseFloat(t.price || 0);
        const amount = parseFloat(t.amount || 0);
        return sum + (price * amount);
      }, 0);
      
      // Group balances by asset/exchange
      const tokenMap = new Map();
      balances.forEach(balance => {
        const key = `${balance.asset}_${balance.exchange}`;
        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            symbol: balance.asset,
            pair: `${balance.asset}/USDT`,
            exchange: balance.exchange,
            balance: 0,
            value: 0,
            pnl: 0,
            pnlPercent: 0,
            volume24h: 0,
            status: 'active'
          });
        }
        const token = tokenMap.get(key);
        token.balance += balance.total || 0;
        token.value += balance.usd_value || 0;
      });
      
      const tokens = Array.from(tokenMap.values());
      
      // Transform trades to orders format
      const recentOrders = trades.slice(0, 10).map((trade, idx) => ({
        id: trade.order_id || idx + 1,
        time: trade.timestamp || trade.time || new Date().toISOString(),
        pair: trade.trading_pair || 'N/A',
        side: trade.side || 'buy',
        price: parseFloat(trade.price || 0),
        amount: parseFloat(trade.amount || 0),
        total: parseFloat(trade.price || 0) * parseFloat(trade.amount || 0),
        status: trade.status || 'filled'
      }));
      
      setDashboardData({
        portfolio: {
          totalValue,
          change24h: 0, // TODO: Calculate from historical data
          changePercent24h: 0
        },
        pnl: {
          total: totalPnl,
          percent: pnlPercent,
          '24h': 0, // TODO: Calculate from trades
          '7d': totalPnl,
          '30d': totalPnl
        },
        volume: {
          total: volume7d,
          '24h': volume24h,
          '7d': volume7d,
          '30d': volume7d
        },
        tokens,
        recentOrders
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      // Fallback to mock data if API fails
      setDashboardData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    portfolio: {
      totalValue: 125420.50,
      change24h: 2345.20,
      changePercent24h: 1.91,
    },
    pnl: {
      total: 8234.50,
      percent: 6.98,
      '24h': 234.50,
      '7d': 1456.30,
      '30d': 8234.50,
    },
    volume: {
      total: 456789.30,
      '24h': 25678.90,
      '7d': 145230.50,
      '30d': 456789.30,
    },
    tokens: [
      {
        symbol: 'SHARP',
        pair: 'SHARP/USDT',
        exchange: 'BitMart',
        balance: 150000,
        value: 900,
        pnl: 45.30,
        pnlPercent: 5.3,
        volume24h: 5420.50,
        status: 'active',
      },
      {
        symbol: 'BTC',
        pair: 'BTC/USDT',
        exchange: 'Binance',
        balance: 0.5,
        value: 45250,
        pnl: 1250.00,
        pnlPercent: 2.8,
        volume24h: 15430.20,
        status: 'active',
      },
      {
        symbol: 'ETH',
        pair: 'ETH/USDT',
        exchange: 'Bybit',
        balance: 15,
        value: 52500,
        pnl: -340.20,
        pnlPercent: -0.6,
        volume24h: 8920.40,
        status: 'active',
      },
    ],
    recentOrders: [
      {
        id: 1,
        time: '2026-01-17 14:23:15',
        pair: 'SHARP/USDT',
        side: 'buy',
        price: 0.00646,
        amount: 1600,
        total: 10.34,
        status: 'filled',
      },
      {
        id: 2,
        time: '2026-01-17 14:20:32',
        pair: 'SHARP/USDT',
        side: 'sell',
        price: 0.00650,
        amount: 1600,
        total: 10.40,
        status: 'filled',
      },
      {
        id: 3,
        time: '2026-01-17 13:45:22',
        pair: 'BTC/USDT',
        side: 'buy',
        price: 98450,
        amount: 0.05,
        total: 4922.50,
        status: 'filled',
      },
      {
        id: 4,
        time: '2026-01-17 13:30:10',
        pair: 'ETH/USDT',
        side: 'sell',
        price: 3520,
        amount: 2,
        total: 7040.00,
        status: 'filled',
      },
      {
        id: 5,
        time: '2026-01-17 12:15:45',
        pair: 'BTC/USDT',
        side: 'sell',
        price: 98550,
        amount: 0.05,
        total: 4927.50,
        status: 'filled',
      },
    ],
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, value) => value && setTimeRange(value)}
          size="small"
        >
          <ToggleButton value="24h">24H</ToggleButton>
          <ToggleButton value="7d">7D</ToggleButton>
          <ToggleButton value="30d">30D</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Portfolio Value */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Portfolio Value
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {formatCurrency(dashboardData.portfolio.totalValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {dashboardData.portfolio.changePercent24h >= 0 ? (
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: dashboardData.portfolio.changePercent24h >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {dashboardData.portfolio.changePercent24h >= 0 ? '+' : ''}
                  {formatNumber(dashboardData.portfolio.changePercent24h)}% (
                  {formatCurrency(dashboardData.portfolio.change24h)})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  24h
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total P&L */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ChartIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography color="text.secondary" variant="body2">
                  P&L ({timeRange})
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: dashboardData.pnl.total >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {dashboardData.pnl.total >= 0 ? '+' : ''}
                {formatCurrency(dashboardData.pnl.total)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: dashboardData.pnl.percent >= 0 ? 'success.main' : 'error.main',
                  fontWeight: 600,
                }}
              >
                {dashboardData.pnl.percent >= 0 ? '+' : ''}
                {formatNumber(dashboardData.pnl.percent)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Trading Volume */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ChartIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Volume ({timeRange})
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {formatCurrency(dashboardData.volume[timeRange])}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Across all pairs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Token Performance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Token Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Exchange</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="right">Volume (24h)</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.tokens.map((token) => (
                  <TableRow key={token.pair}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {token.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {token.pair}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={token.exchange} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(token.balance, token.symbol === 'SHARP' ? 0 : 4)}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(token.value)}</TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          color: token.pnl >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {token.pnl >= 0 ? '+' : ''}
                        {formatCurrency(token.pnl)}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 0.5, color: 'inherit' }}
                        >
                          ({token.pnlPercent >= 0 ? '+' : ''}
                          {formatNumber(token.pnlPercent)}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(token.volume24h)}</TableCell>
                    <TableCell>
                      <Chip
                        label={token.status}
                        size="small"
                        color={token.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Recent Orders
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Pair</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2">{order.time}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.pair}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.side.toUpperCase()}
                        size="small"
                        color={order.side === 'buy' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(order.price)}
                    </TableCell>
                    <TableCell align="right">{formatNumber(order.amount, 2)}</TableCell>
                    <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        color={order.status === 'filled' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
