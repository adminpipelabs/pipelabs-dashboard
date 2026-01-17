// Enhanced page components with beautiful visual design and mock data
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  AccountBalance as AccountBalanceIcon,
  Token as TokenIcon,
  SmartToy as BotIcon,
  Speed as SpeedIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// ==================== Dashboard Page ====================
export function Dashboard() {
  const stats = {
    portfolioValue: 125000,
    pnlWeek: 3200,
    pnlPercent: 2.6,
    activeBots: 5,
    totalOrders: 1247,
    successRate: 94.2,
  };

  const recentTrades = [
    { pair: 'BTC/USDT', side: 'Buy', price: '43,250', amount: '0.25', time: '2 min ago', pnl: '+$125' },
    { pair: 'ETH/USDT', side: 'Sell', price: '2,280', amount: '2.5', time: '5 min ago', pnl: '+$85' },
    { pair: 'SOL/USDT', side: 'Buy', price: '98.50', amount: '10', time: '8 min ago', pnl: '+$42' },
  ];

  const topPairs = [
    { pair: 'BTC/USDT', volume: '$45,200', pnl: '+2.4%', trades: 342 },
    { pair: 'ETH/USDT', volume: '$32,100', pnl: '+1.8%', trades: 289 },
    { pair: 'SOL/USDT', volume: '$18,500', pnl: '+3.1%', trades: 156 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's your trading performance summary
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Portfolio Value</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                ${stats.portfolioValue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  +{stats.pnlPercent}% this week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">Weekly P&L</Typography>
              </Box>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                +${stats.pnlWeek.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats.totalOrders} total orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BotIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">Active Bots</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{stats.activeBots}</Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption">Success Rate</Typography>
                  <Typography variant="caption">{stats.successRate}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.successRate}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Trades */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Trades</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pair</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>P&L</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTrades.map((trade, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{trade.pair}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.side}
                          size="small"
                          color={trade.side === 'Buy' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>${trade.price}</TableCell>
                      <TableCell>{trade.amount}</TableCell>
                      <TableCell>
                        <Typography color="success.main" fontWeight="bold">
                          {trade.pnl}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {trade.time}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Pairs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Performing Pairs</Typography>
              <List>
                {topPairs.map((pair, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            {pair.pair}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Volume: {pair.volume}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {pair.trades} trades
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={pair.pnl}
                        color="success"
                        size="small"
                        icon={<TrendingUpIcon />}
                      />
                    </ListItem>
                    {idx < topPairs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ==================== Portfolio Page ====================
export function Portfolio() {
  const accounts = [
    {
      exchange: 'Binance',
      account: 'Primary',
      balance: 53000,
      change: '+2.4%',
      pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      status: 'active',
    },
    {
      exchange: 'Kraken',
      account: 'Secondary',
      balance: 34000,
      change: '+1.8%',
      pairs: ['BTC/USD', 'ADA/EUR'],
      status: 'active',
    },
    {
      exchange: 'Coinbase',
      account: 'Test',
      balance: 38000,
      change: '+3.2%',
      pairs: ['ETH/USD'],
      status: 'active',
    },
  ];

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Portfolio</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your exchange accounts and balances
          </Typography>
        </Box>
        <Button variant="contained">Add Exchange</Button>
      </Box>

      {/* Total Balance Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Total Portfolio Value</Typography>
          <Typography variant="h2" fontWeight="bold">
            ${totalBalance.toLocaleString()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            <Typography variant="body1">+2.5% overall performance</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Exchange Accounts */}
      <Grid container spacing={3}>
        {accounts.map((account, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{account.exchange}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.account}
                    </Typography>
                  </Box>
                  <Chip
                    label={account.status}
                    size="small"
                    color="success"
                  />
                </Box>

                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  ${account.balance.toLocaleString()}
                </Typography>

                <Chip
                  label={account.change}
                  size="small"
                  color="success"
                  icon={<TrendingUpIcon />}
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Pairs:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {account.pairs.map((pair, i) => (
                    <Chip key={i} label={pair} size="small" variant="outlined" />
                  ))}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" fullWidth>
                    Manage
                  </Button>
                  <Button size="small" variant="contained" fullWidth>
                    Trade
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ==================== Orders Page ====================
export function Orders() {
  const [filter, setFilter] = useState('all');

  const orders = [
    { id: '12034', pair: 'BTC/USDT', side: 'Buy', type: 'Limit', status: 'Open', price: '43,250', amount: '0.25', filled: '0.1', time: '2 min ago' },
    { id: '12035', pair: 'ETH/USDT', side: 'Sell', type: 'Market', status: 'Filled', price: '2,280', amount: '1.0', filled: '1.0', time: '5 min ago' },
    { id: '12036', pair: 'SOL/USDT', side: 'Buy', type: 'Limit', status: 'Partial', price: '98.50', amount: '10', filled: '6.5', time: '15 min ago' },
    { id: '12037', pair: 'ADA/USDT', side: 'Sell', type: 'Stop', status: 'Cancelled', price: '0.48', amount: '1000', filled: '0', time: '1 hour ago' },
  ];

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status.toLowerCase() === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'info';
      case 'Filled': return 'success';
      case 'Partial': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Orders</Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your trading orders
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined">Export</Button>
          <Button variant="contained">New Order</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['all', 'open', 'filled', 'partial', 'cancelled'].map((f) => (
              <Chip
                key={f}
                label={f.charAt(0).toUpperCase() + f.slice(1)}
                onClick={() => setFilter(f)}
                color={filter === f ? 'primary' : 'default'}
                variant={filter === f ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Pair</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Side</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Filled</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">#{order.id}</Typography>
                  </TableCell>
                  <TableCell>{order.pair}</TableCell>
                  <TableCell>{order.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.side}
                      size="small"
                      color={order.side === 'Buy' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>${order.price}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    {order.filled}/{order.amount}
                    <LinearProgress
                      variant="determinate"
                      value={(parseFloat(order.filled) / parseFloat(order.amount)) * 100}
                      sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {order.time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.status === 'Open' && (
                      <IconButton size="small" color="error">
                        <StopIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

// ==================== Bots Page ====================
export function Bots() {
  const bots = [
    { name: 'Spread Bot Alpha', status: 'Running', pair: 'BTC/USDT', pnl: '+$1,250', trades: 342, uptime: '99.8%', exchange: 'Binance' },
    { name: 'Volume Bot Beta', status: 'Paused', pair: 'ETH/USDT', pnl: '+$850', trades: 289, uptime: '98.2%', exchange: 'Kraken' },
    { name: 'Arbitrage Bot Gamma', status: 'Running', pair: 'SOL/USDT', pnl: '+$620', trades: 156, uptime: '99.5%', exchange: 'Coinbase' },
    { name: 'Market Maker Delta', status: 'Running', pair: 'ADA/USDT', pnl: '+$430', trades: 234, uptime: '97.9%', exchange: 'Binance' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'success';
      case 'Paused': return 'warning';
      case 'Stopped': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Trading Bots</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor your automated trading strategies
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<BotIcon />}>
          Create Bot
        </Button>
      </Box>

      {/* Bot Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Bots
              </Typography>
              <Typography variant="h3">3</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total P&L
              </Typography>
              <Typography variant="h3" color="success.main">+$3,150</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Trades
              </Typography>
              <Typography variant="h3">1,021</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Uptime
              </Typography>
              <Typography variant="h3">98.6%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bots Grid */}
      <Grid container spacing={3}>
        {bots.map((bot, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{bot.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {bot.exchange} • {bot.pair}
                    </Typography>
                  </Box>
                  <Chip
                    label={bot.status}
                    color={getStatusColor(bot.status)}
                    size="small"
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">P&L</Typography>
                    <Typography variant="h6" color="success.main">{bot.pnl}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Trades</Typography>
                    <Typography variant="h6">{bot.trades}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Uptime</Typography>
                    <Typography variant="body1">{bot.uptime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Pair</Typography>
                    <Typography variant="body1">{bot.pair}</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {bot.status === 'Running' ? (
                    <IconButton size="small" color="warning">
                      <PauseIcon />
                    </IconButton>
                  ) : (
                    <IconButton size="small" color="success">
                      <PlayIcon />
                    </IconButton>
                  )}
                  <IconButton size="small" color="error">
                    <StopIcon />
                  </IconButton>
                  <Button size="small" variant="outlined" sx={{ ml: 'auto' }}>
                    Configure
                  </Button>
                  <Button size="small" variant="contained">
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ==================== Agent Page (Keep existing enhanced version) ====================
export function Agent() {
  // This page is already enhanced in the existing codebase
  // Return a placeholder since it's handled by ChatSidebar
  return (
    <Box>
      <Typography variant="h4" gutterBottom>AI Trading Agent</Typography>
      <Typography variant="body1" color="text.secondary">
        Use the AI Agent sidebar on the right to chat with your trading assistant.
      </Typography>
    </Box>
  );
}

// ==================== Admin Page ====================
export function Admin() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      <Typography variant="body2" color="text.secondary">
        Use the admin navigation menu to manage clients, tokens, and view platform overview.
      </Typography>
    </Box>
  );
}
