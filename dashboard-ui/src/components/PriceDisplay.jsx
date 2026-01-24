/**
 * Price Display Component - Direct Hummingbot MCP Integration
 * Shows prices like Claude Desktop does - bypasses database, calls Hummingbot directly
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { adminAPI } from '../services/api';

export default function PriceDisplay({ 
  defaultExchange = 'bitmart', 
  defaultPair = 'SHARP-USDT',
  autoRefresh = false,
  refreshInterval = 10000 // 10 seconds
}) {
  const [connectorName, setConnectorName] = useState(defaultExchange);
  const [tradingPair, setTradingPair] = useState(defaultPair);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [previousPrice, setPreviousPrice] = useState(null);

  // Common exchanges and pairs
  const exchanges = [
    'bitmart', 'binance', 'coinbase', 'kraken', 'okx', 'bybit', 
    'gate_io', 'mexc', 'huobi', 'kucoin', 'bitget', 'bitfinex'
  ];

  const commonPairs = [
    'SHARP-USDT', 'BTC-USDT', 'ETH-USDT', 'BTC-USD', 'ETH-USD',
    'SHARP/USDT', 'BTC/USDT', 'ETH/USDT', 'BTC/USD', 'ETH/USD'
  ];

  const fetchPrice = async () => {
    if (!connectorName || !tradingPair) return;

    setLoading(true);
    setError(null);

    try {
      // Normalize pair format (accept both - and /)
      const normalizedPair = tradingPair.replace('/', '-').toUpperCase();
      
      console.log(`🔍 Fetching price via Hummingbot MCP: ${connectorName} ${normalizedPair}`);
      
      const result = await adminAPI.getPrice(connectorName, normalizedPair);
      
      if (result.error) {
        setError(result.error);
        setPrice(null);
      } else if (result.price !== null && result.price !== undefined) {
        setPreviousPrice(price);
        setPrice(result.price);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Price not available');
        setPrice(null);
      }
    } catch (err) {
      console.error('Failed to fetch price:', err);
      setError(err.message || 'Failed to fetch price');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, [connectorName, tradingPair]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh && connectorName && tradingPair) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, connectorName, tradingPair, refreshInterval]);

  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    // Format based on price magnitude
    if (value < 0.01) {
      return value.toFixed(6);
    } else if (value < 1) {
      return value.toFixed(4);
    } else if (value < 1000) {
      return value.toFixed(2);
    } else {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const getPriceChange = () => {
    if (previousPrice === null || price === null) return null;
    const change = price - previousPrice;
    const percentChange = (change / previousPrice) * 100;
    return { change, percentChange };
  };

  const priceChange = getPriceChange();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Live Price (Hummingbot MCP)
          </Typography>
          <IconButton 
            onClick={fetchPrice} 
            disabled={loading}
            size="small"
            title="Refresh price"
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Exchange</InputLabel>
              <Select
                value={connectorName}
                label="Exchange"
                onChange={(e) => setConnectorName(e.target.value)}
              >
                {exchanges.map((ex) => (
                  <MenuItem key={ex} value={ex}>
                    {ex.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Trading Pair</InputLabel>
              <Select
                value={tradingPair}
                label="Trading Pair"
                onChange={(e) => setTradingPair(e.target.value)}
              >
                {commonPairs.map((pair) => (
                  <MenuItem key={pair} value={pair}>
                    {pair}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Allow manual pair entry */}
        <TextField
          fullWidth
          size="small"
          label="Or enter trading pair manually"
          value={tradingPair}
          onChange={(e) => setTradingPair(e.target.value)}
          placeholder="e.g., SHARP-USDT, BTC/USDT"
          sx={{ mb: 2 }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              fetchPrice();
            }
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && !price && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {price !== null && !loading && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {formatPrice(price)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tradingPair.toUpperCase()}
              </Typography>
            </Box>

            {priceChange && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {priceChange.change >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: priceChange.change >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {priceChange.change >= 0 ? '+' : ''}
                  {formatPrice(priceChange.change)} ({priceChange.percentChange >= 0 ? '+' : ''}
                  {priceChange.percentChange.toFixed(2)}%)
                </Typography>
              </Box>
            )}

            {lastUpdate && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Typography>
            )}

            <Chip
              label={`${connectorName.toUpperCase()}`}
              size="small"
              color="primary"
              sx={{ mt: 1 }}
            />
          </Box>
        )}

        {autoRefresh && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Auto-refreshing every {refreshInterval / 1000} seconds
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
