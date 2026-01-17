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
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { adminAPI } from '../services/api';

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'Active',
    maxSpread: 0.5,
    maxDailyVolume: 50000,
    tier: 'Standard'
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getClients();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleOpenDialog = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        status: client.status,
        maxSpread: client.settings?.maxSpread || 0.5,
        maxDailyVolume: client.settings?.maxDailyVolume || 50000,
        tier: client.tier
      });
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        email: '',
        status: 'Active',
        maxSpread: 0.5,
        maxDailyVolume: 50000,
        tier: 'Standard'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const handleSave = async () => {
    try {
      if (selectedClient) {
        await adminAPI.updateClient(selectedClient.id, formData);
      } else {
        await adminAPI.createClient(formData);
      }
      handleCloseDialog();
      loadClients();
    } catch (err) {
      setError('Failed to save client.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Client Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all clients and their configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Client
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell align="right">Projects</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Volume (30d)</TableCell>
                  <TableCell align="right">Revenue (30d)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.status}
                        size="small"
                        color={client.status === 'Active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={client.tier} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{client.projects}</TableCell>
                    <TableCell align="right">{client.tokens}</TableCell>
                    <TableCell align="right">{formatCurrency(client.volume)}</TableCell>
                    <TableCell align="right">{formatCurrency(client.revenue)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(client)}
                        title="Edit Client"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => window.location.href = `/admin/clients/${client.id}`}
                        title="View Client Dashboard"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Client Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={formData.tier}
                  label="Tier"
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Trading Limits
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Spread (%)"
                type="number"
                value={formData.maxSpread}
                onChange={(e) => setFormData({ ...formData, maxSpread: parseFloat(e.target.value) })}
                inputProps={{ step: 0.1, min: 0, max: 10 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Daily Volume ($)"
                type="number"
                value={formData.maxDailyVolume}
                onChange={(e) => setFormData({ ...formData, maxDailyVolume: parseFloat(e.target.value) })}
                inputProps={{ step: 1000, min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
