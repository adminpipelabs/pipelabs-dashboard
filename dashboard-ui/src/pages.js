// Contains placeholder page components for the dashboard sections
import React, { useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, Table, TableHead, TableRow, TableCell, TableBody, Paper, List, ListItem, ListItemText, Button, TextField, RadioGroup, FormControlLabel, Radio, Chip, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from './AuthContext';

export function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Overview</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Portfolio Value</Typography>
              <Typography variant="h5">$125,000</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">P&L (7d)</Typography>
              <Typography variant="h5" color="success.main">+$3,200</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Active Bots</Typography>
              <Typography variant="h5">5</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
        <List component={Paper}>
          <ListItem>
            <ListItemText primary="BTC/USD reached stop loss" secondary="2 m ago" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Order #14520 filled on Kraken" secondary="10 m ago" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
}

export function Portfolio() {
  // Sample data, typically fetched from API
  const accounts = [
    { exchange: 'Binance', account: 'Primary', balance: '$53,000', pairs: 'BTC/USD, ETH/USDT' },
    { exchange: 'Kraken', account: 'Secondary', balance: '$34,000', pairs: 'BTC/USD, ADA/EUR' },
    { exchange: 'Coinbase', account: 'Test', balance: '$38,000', pairs: 'ETH/USD' },
  ];
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Portfolio</Typography>
      <Table component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Exchange</TableCell>
            <TableCell>Account</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Pairs</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.exchange}</TableCell>
              <TableCell>{row.account}</TableCell>
              <TableCell>{row.balance}</TableCell>
              <TableCell>{row.pairs}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function Orders() {
  const orders = [
    { id: '12034', pair: 'BTC/USD', side: 'Buy', status: 'Open', filled: '0.2 BTC' },
    { id: '12035', pair: 'ETH/USDT', side: 'Sell', status: 'Filled', filled: '1 ETH' },
  ];
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Orders</Typography>
      <Table component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Pair</TableCell>
            <TableCell>Side</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Filled</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.pair}</TableCell>
              <TableCell>{row.side}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.filled}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function Bots() {
  const bots = [
    { name: 'SpreadBot 1', status: 'Running', pair: 'BTC/USD', pnl: '+$150', last: '3m ago' },
    { name: 'VolumeBot 2', status: 'Paused', pair: 'ETH/USDT', pnl: '+$50', last: '5m ago' },
  ];
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Bots</Typography>
      <Table component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Pair</TableCell>
            <TableCell>P&L</TableCell>
            <TableCell>Last Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bots.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.pair}</TableCell>
              <TableCell>{row.pnl}</TableCell>
              <TableCell>{row.last}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export function Agent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = React.useRef(null);

  // Quick action buttons
  const quickActions = [
    { label: 'Check Balance', query: 'Check my current balances' },
    { label: 'P&L Report', query: 'Show me my P&L report' },
    { label: 'Active Bots', query: 'Show my active bots' },
    { label: 'Recent Orders', query: 'Show my recent orders' },
  ];

  // Load chat history on mount
  React.useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      // Import dynamically to avoid issues
      const { agentAPI } = await import('./services/api');
      const history = await agentAPI.getHistory();
      setMessages(history.map(h => ({
        role: h.role,
        content: h.message,
        timestamp: h.timestamp,
        actions: h.actions_taken
      })));
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSend = async (message = input) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { agentAPI } = await import('./services/api');
      const response = await agentAPI.sendMessage(message);
      
      const agentMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        actions: response.actions_taken
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear chat history?')) return;
    
    try {
      const { agentAPI } = await import('./services/api');
      await agentAPI.clearHistory();
      setMessages([]);
    } catch (err) {
      setError('Failed to clear history.');
      console.error('Clear history error:', err);
    }
  };

  const handleQuickAction = (query) => {
    handleSend(query);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">AI Trading Assistant</Typography>
        <Button size="small" onClick={handleClearHistory} disabled={messages.length === 0}>
          Clear History
        </Button>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            variant="outlined"
            size="small"
            onClick={() => handleQuickAction(action.query)}
            disabled={loading}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      {/* Messages Area */}
      <Paper
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          mb: 2,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
            <SmartToyIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>AI Trading Assistant</Typography>
            <Typography variant="body2">
              Ask me about your balances, P&L, orders, or bot performance.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Try the quick actions above or type your question below!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 2,
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              {msg.role === 'assistant' && (
                <Tooltip title="AI Assistant">
                  <SmartToyIcon color="primary" sx={{ mt: 1 }} />
                </Tooltip>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                {msg.actions && msg.actions.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {msg.actions.map((action, i) => (
                      <Chip key={i} label={action} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Paper>
              {msg.role === 'user' && (
                <Tooltip title="You">
                  <PersonIcon color="action" sx={{ mt: 1 }} />
                </Tooltip>
              )}
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">AI is thinking...</Typography>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 1 }}>
          <Typography color="error" variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Ask me anything about your trading activity..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          endIcon={<SendIcon />}
          sx={{ minWidth: 100 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');

  function handleLogin(e) {
    e.preventDefault();
    if (name) login(name, role);
  }

  if (user) {
    return (
      <Box>
        <Typography variant="h5">Redirecting...</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Login</Typography>
          <form onSubmit={handleLogin}>
            <TextField
              label="Username"
              value={name}
              fullWidth
              margin="normal"
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <RadioGroup value={role} onChange={e => setRole(e.target.value)} row sx={{ mb: 2 }}>
              <FormControlLabel value="user" control={<Radio />} label="User" />
              <FormControlLabel value="admin" control={<Radio />} label="Admin" />
            </RadioGroup>
            <Button type="submit" variant="contained" fullWidth disabled={!name}>Log In</Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
