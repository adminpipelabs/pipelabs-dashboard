import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { reportsAPI } from '../services/api';

export default function Reports() {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const periods = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'ytd', label: 'Year to Date' },
  ];

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsAPI.getReport(period);
      setReportData(data);
    } catch (err) {
      setError('Failed to load report. Please try again.');
      console.error('Report load error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);


  const handleExport = async (format) => {
    try {
      await reportsAPI.exportReport(period, format);
      // In a real implementation, this would trigger a download
      alert(`Exporting report as ${format.toUpperCase()}...`);
    } catch (err) {
      setError('Failed to export report.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !reportData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Trading Reports</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Time Period">
              {periods.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
            disabled={loading || !reportData}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
            disabled={loading || !reportData}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {reportData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Volume
                  </Typography>
                  <Typography variant="h4">{formatCurrency(reportData.summary.totalVolume)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {reportData.summary.volumeChange >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={reportData.summary.volumeChange >= 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {formatPercentage(reportData.summary.volumeChange)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    P&L
                  </Typography>
                  <Typography
                    variant="h4"
                    color={reportData.summary.pnl >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(reportData.summary.pnl)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      ROI: {formatPercentage(reportData.summary.roi)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Trades
                  </Typography>
                  <Typography variant="h4">{formatNumber(reportData.summary.totalTrades)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate: {formatPercentage(reportData.summary.winRate)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Trade Size
                  </Typography>
                  <Typography variant="h4">{formatCurrency(reportData.summary.avgTradeSize)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Max: {formatCurrency(reportData.summary.maxTradeSize)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance by Exchange */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance by Exchange
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exchange</TableCell>
                      <TableCell align="right">Volume</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell align="right">ROI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.byExchange.map((row) => (
                      <TableRow key={row.exchange}>
                        <TableCell>
                          <Chip label={row.exchange} size="small" />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.volume)}</TableCell>
                        <TableCell align="right">{formatNumber(row.trades)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatCurrency(row.pnl)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.roi >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatPercentage(row.roi)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Performance by Trading Pair */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance by Trading Pair
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pair</TableCell>
                      <TableCell align="right">Volume</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.byPair.map((row) => (
                      <TableRow key={row.pair}>
                        <TableCell>
                          <Chip label={row.pair} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.volume)}</TableCell>
                        <TableCell align="right">{formatNumber(row.trades)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatCurrency(row.pnl)}
                        </TableCell>
                        <TableCell align="right">{formatPercentage(row.winRate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Bot Performance */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bot Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bot Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Volume</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell align="right">Uptime</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.byBot.map((row) => (
                      <TableRow key={row.botName}>
                        <TableCell>{row.botName}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            color={row.status === 'Running' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.volume)}</TableCell>
                        <TableCell align="right">{formatNumber(row.trades)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatCurrency(row.pnl)}
                        </TableCell>
                        <TableCell align="right">{formatPercentage(row.uptime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
