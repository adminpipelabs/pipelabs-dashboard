import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';

export default function TokenManagement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    chain: 'Ethereum',
    status: 'active',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getTokens();
      setTokens(data);
    } catch (err) {
      setError('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (token = null) => {
    if (token) {
      setEditingToken(token);
      setFormData({
        symbol: token.symbol,
        name: token.name,
        chain: token.chain,
        status: token.status,
      });
    } else {
      setEditingToken(null);
      setFormData({
        symbol: '',
        name: '',
        chain: 'Ethereum',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingToken(null);
    setFormData({
      symbol: '',
      name: '',
      chain: 'Ethereum',
      status: 'active',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingToken) {
        await adminAPI.updateToken(editingToken.id, formData);
      } else {
        await adminAPI.addToken(formData);
      }
      handleCloseDialog();
      loadTokens();
    } catch (err) {
      setError('Failed to save token');
    }
  };

  const handleDelete = async (tokenId) => {
    if (window.confirm('Are you sure you want to delete this token?')) {
      try {
        await adminAPI.deleteToken(tokenId);
        loadTokens();
      } catch (err) {
        setError('Failed to delete token');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Token Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Token
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Chain</TableCell>
                  <TableCell>Market Makers</TableCell>
                  <TableCell>24h Volume</TableCell>
                  <TableCell>24h Change</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {token.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>{token.name}</TableCell>
                    <TableCell>
                      <Chip label={token.chain} size="small" />
                    </TableCell>
                    <TableCell>{token.marketMakers}</TableCell>
                    <TableCell>${token.volume24h?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {token.change24h >= 0 ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                        <Typography
                          color={token.change24h >= 0 ? 'success.main' : 'error.main'}
                        >
                          {token.change24h > 0 ? '+' : ''}
                          {token.change24h}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={token.status}
                        color={token.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(token)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(token.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Token Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingToken ? 'Edit Token' : 'Add New Token'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Chain</InputLabel>
              <Select
                name="chain"
                value={formData.chain}
                onChange={handleInputChange}
                label="Chain"
              >
                <MenuItem value="Ethereum">Ethereum</MenuItem>
                <MenuItem value="Binance Smart Chain">Binance Smart Chain</MenuItem>
                <MenuItem value="Polygon">Polygon</MenuItem>
                <MenuItem value="Solana">Solana</MenuItem>
                <MenuItem value="Avalanche">Avalanche</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingToken ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
