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
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import TokenIcon from '@mui/icons-material/Token';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TuneIcon from '@mui/icons-material/Tune';
import TelegramIcon from '@mui/icons-material/Telegram';
import LanguageIcon from '@mui/icons-material/Language';
import EmailIcon from '@mui/icons-material/Email';
import { adminAPI } from '../services/api';
import { useSearchParams } from 'react-router-dom';

// Supported exchanges
const EXCHANGES = [
  { id: 'binance', name: 'Binance', requiresPassphrase: false },
  { id: 'binance_perpetual', name: 'Binance Perpetual', requiresPassphrase: false },
  { id: 'bitmart', name: 'BitMart', requiresPassphrase: true, passphraseLabel: 'Memo' },
  { id: 'gate_io', name: 'Gate.io', requiresPassphrase: false },
  { id: 'kucoin', name: 'KuCoin', requiresPassphrase: true, passphraseLabel: 'Passphrase' },
  { id: 'okx', name: 'OKX', requiresPassphrase: true, passphraseLabel: 'Passphrase' },
  { id: 'bybit', name: 'Bybit', requiresPassphrase: false },
  { id: 'hyperliquid', name: 'Hyperliquid', requiresPassphrase: false },
  { id: 'mexc', name: 'MEXC', requiresPassphrase: false },
  { id: 'htx', name: 'HTX (Huobi)', requiresPassphrase: false },
];

const TIERS = ['Basic', 'Standard', 'Premium', 'Enterprise'];

export default function ClientManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    clientInfo: true,
    tokenDetails: true,
    exchangeSetup: true,
    tradingConfig: true
  });

  // Complete form data for client onboarding
  const [formData, setFormData] = useState({
    // Client Info
    projectName: '',
    contactPerson: '',
    email: '',
    telegramId: '',
    website: '',
    tier: 'Standard',
    
    // Token Details
    tokenName: '',
    tokenSymbol: '',
    contractAddress: '',
    
    // Exchange Setup
    exchange: '',
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    isTestnet: false,
    
    // Trading Config
    tradingPair: '',
    targetSpread: 0.3,
    dailyVolumeTarget: 10000,
    botType: 'both'
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getClients();
      setClients(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError('Failed to load clients. Backend may be unavailable.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handle edit from URL parameter
  useEffect(() => {
    const editClientId = searchParams.get('edit');
    if (editClientId && clients.length > 0) {
      const clientToEdit = clients.find(c => c.id === editClientId);
      if (clientToEdit && !openDialog) {
        handleOpenDialog(clientToEdit);
        // Clear the URL parameter
        setSearchParams({});
      }
    }
  }, [clients, searchParams, setSearchParams, openDialog]);

  const resetForm = () => {
    setFormData({
      projectName: '',
      contactPerson: '',
      email: '',
      telegramId: '',
      website: '',
      tier: 'Standard',
      tokenName: '',
      tokenSymbol: '',
      contractAddress: '',
      exchange: '',
      apiKey: '',
      apiSecret: '',
      passphrase: '',
      isTestnet: false,
      tradingPair: '',
      targetSpread: 0.3,
      dailyVolumeTarget: 10000,
      botType: 'both'
    });
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        projectName: client.name || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        telegramId: client.telegramId || '',
        website: client.website || '',
        tier: client.tier || 'Standard',
        tokenName: client.tokenName || '',
        tokenSymbol: client.tokenSymbol || '',
        contractAddress: client.contractAddress || '',
        exchange: '',
        apiKey: '',
        apiSecret: '',
        passphrase: '',
        isTestnet: false,
        tradingPair: client.tradingPair || '',
        targetSpread: client.settings?.targetSpread || 0.3,
        dailyVolumeTarget: client.settings?.dailyVolumeTarget || 10000,
        botType: client.settings?.botType || 'both'
      });
    } else {
      setSelectedClient(null);
      resetForm();
    }
    setOpenDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
    resetForm();
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionToggle = (section) => () => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSelectedExchange = () => {
    return EXCHANGES.find(ex => ex.id === formData.exchange);
  };

  const validateForm = () => {
    if (!formData.projectName || !formData.email) {
      setError('Project Name and Email are required');
      return false;
    }
    if (!formData.tokenName || !formData.tokenSymbol) {
      setError('Token Name and Symbol are required');
      return false;
    }
    if (!selectedClient) {
      // New client - require exchange setup
      if (!formData.exchange || !formData.apiKey || !formData.apiSecret) {
        setError('Exchange API credentials are required for new clients');
        return false;
      }
      const exchange = getSelectedExchange();
      if (exchange?.requiresPassphrase && !formData.passphrase) {
        setError(`${exchange.passphraseLabel} is required for ${exchange.name}`);
        return false;
      }
    }
    if (!formData.tradingPair) {
      setError('Trading Pair is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      // Prepare client data
      const clientData = {
        name: formData.projectName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        telegramId: formData.telegramId,
        website: formData.website,
        tier: formData.tier,
        tokenName: formData.tokenName,
        tokenSymbol: formData.tokenSymbol,
        contractAddress: formData.contractAddress,
        tradingPair: formData.tradingPair,
        settings: {
          targetSpread: parseFloat(formData.targetSpread),
          dailyVolumeTarget: parseFloat(formData.dailyVolumeTarget),
          botType: formData.botType
        }
      };

      let clientId;

      if (selectedClient) {
        // Update existing client
        await adminAPI.updateClient(selectedClient.id, clientData);
        clientId = selectedClient.id;
        setSuccess('Client updated successfully!');
      } else {
        // Create new client
        const newClient = await adminAPI.createClient(clientData);
        clientId = newClient.id;

        // Add exchange API keys
        if (formData.exchange && formData.apiKey) {
          await adminAPI.addClientAPIKey(clientId, {
            exchange: formData.exchange,
            api_key: formData.apiKey,
            api_secret: formData.apiSecret,
            passphrase: formData.passphrase || null,
            is_testnet: formData.isTestnet,
            label: `${formData.exchange} - ${formData.tokenSymbol}`
          });
        }

        setSuccess('Client onboarded successfully!');
      }

      // Reload clients list
      await loadClients();
      
      // Close dialog after short delay to show success message
      setTimeout(() => {
        handleCloseDialog();
        setSuccess(null);
      }, 1500);

    } catch (err) {
      console.error('Failed to save client:', err);
      setError(err.message || 'Failed to save client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Client Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Onboard and manage all clients and their configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Onboard New Client
        </Button>
      </Box>

      {error && !openDialog && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Clients Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project / Token</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Exchange</TableCell>
                  <TableCell align="right">Volume (30d)</TableCell>
                  <TableCell align="right">Revenue (30d)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      Loading clients...
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No clients yet.</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />} 
                        onClick={() => handleOpenDialog()}
                        sx={{ mt: 2 }}
                      >
                        Onboard Your First Client
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{client.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {client.tokenSymbol || 'No token'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{client.email}</Typography>
                        {client.telegramId && (
                          <Typography variant="body2" color="text.secondary">
                            @{client.telegramId}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={client.status || 'Active'}
                          size="small"
                          color={client.status === 'Active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={client.tier || 'Standard'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {client.exchanges?.length || 0} connected
                        </Typography>
                      </TableCell>
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
                          onClick={() => window.location.href = `/admin/clients/${client.id}/api-keys`}
                          title="Manage API Keys"
                        >
                          <VpnKeyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => window.location.href = `/admin/clients/${client.id}`}
                          title="View Dashboard"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Onboarding Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {selectedClient ? 'Edit Client' : '🚀 Onboard New Client'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedClient 
              ? 'Update client information and settings'
              : 'Complete all sections to set up a new client'
            }
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2, mb: 0 }}>{error}</Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ m: 2, mb: 0 }}>{success}</Alert>
          )}

          {/* Section 1: Client Info */}
          <Accordion 
            expanded={expandedSections.clientInfo} 
            onChange={handleSectionToggle('clientInfo')}
            disableGutters
            elevation={0}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50' }}>
              <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography fontWeight="medium">Client Information</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Project / Company Name"
                    value={formData.projectName}
                    onChange={handleInputChange('projectName')}
                    placeholder="e.g., Sharp Protocol"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    value={formData.contactPerson}
                    onChange={handleInputChange('contactPerson')}
                    placeholder="e.g., John Smith"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    placeholder="contact@project.com"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telegram ID"
                    value={formData.telegramId}
                    onChange={handleInputChange('telegramId')}
                    placeholder="username (without @)"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><TelegramIcon fontSize="small" /></InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={handleInputChange('website')}
                    placeholder="https://project.com"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LanguageIcon fontSize="small" /></InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Service Tier</InputLabel>
                    <Select
                      value={formData.tier}
                      label="Service Tier"
                      onChange={handleInputChange('tier')}
                    >
                      {TIERS.map(tier => (
                        <MenuItem key={tier} value={tier}>{tier}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Section 2: Token Details */}
          <Accordion 
            expanded={expandedSections.tokenDetails} 
            onChange={handleSectionToggle('tokenDetails')}
            disableGutters
            elevation={0}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50' }}>
              <TokenIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography fontWeight="medium">Token Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Token Name"
                    value={formData.tokenName}
                    onChange={handleInputChange('tokenName')}
                    placeholder="e.g., Sharp Token"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Token Symbol"
                    value={formData.tokenSymbol}
                    onChange={handleInputChange('tokenSymbol')}
                    placeholder="e.g., SHARP"
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contract Address (optional)"
                    value={formData.contractAddress}
                    onChange={handleInputChange('contractAddress')}
                    placeholder="0x..."
                    helperText="ERC-20, BEP-20, or other contract address"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Section 3: Exchange Setup */}
          <Accordion 
            expanded={expandedSections.exchangeSetup} 
            onChange={handleSectionToggle('exchangeSetup')}
            disableGutters
            elevation={0}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50' }}>
              <AccountBalanceIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography fontWeight="medium">Exchange API Setup</Typography>
              {selectedClient && (
                <Chip 
                  label="Optional for edits" 
                  size="small" 
                  sx={{ ml: 2 }} 
                  color="info"
                />
              )}
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                API keys are encrypted before storage and never exposed. You can add more exchanges later.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required={!selectedClient}>
                    <InputLabel>Exchange</InputLabel>
                    <Select
                      value={formData.exchange}
                      label="Exchange"
                      onChange={handleInputChange('exchange')}
                    >
                      <MenuItem value="">Select an exchange</MenuItem>
                      {EXCHANGES.map(ex => (
                        <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isTestnet}
                        onChange={handleInputChange('isTestnet')}
                      />
                    }
                    label="Testnet / Sandbox"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required={!selectedClient && !!formData.exchange}
                    label="API Key"
                    value={formData.apiKey}
                    onChange={handleInputChange('apiKey')}
                    placeholder="Enter API key"
                    InputProps={{ sx: { fontFamily: 'monospace' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required={!selectedClient && !!formData.exchange}
                    type="password"
                    label="API Secret"
                    value={formData.apiSecret}
                    onChange={handleInputChange('apiSecret')}
                    placeholder="Enter API secret"
                    InputProps={{ sx: { fontFamily: 'monospace' } }}
                  />
                </Grid>
                {getSelectedExchange()?.requiresPassphrase && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required={!selectedClient}
                      type="password"
                      label={getSelectedExchange().passphraseLabel}
                      value={formData.passphrase}
                      onChange={handleInputChange('passphrase')}
                      placeholder={`Enter ${getSelectedExchange().passphraseLabel.toLowerCase()}`}
                      InputProps={{ sx: { fontFamily: 'monospace' } }}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Section 4: Trading Configuration */}
          <Accordion 
            expanded={expandedSections.tradingConfig} 
            onChange={handleSectionToggle('tradingConfig')}
            disableGutters
            elevation={0}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50' }}>
              <TuneIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography fontWeight="medium">Trading Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Trading Pair"
                    value={formData.tradingPair}
                    onChange={handleInputChange('tradingPair')}
                    placeholder="e.g., SHARP-USDT"
                    helperText="Format: TOKEN-QUOTE (e.g., SHARP-USDT)"
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Bot Type</InputLabel>
                    <Select
                      value={formData.botType}
                      label="Bot Type"
                      onChange={handleInputChange('botType')}
                    >
                      <MenuItem value="spread">Spread Only (Market Making)</MenuItem>
                      <MenuItem value="volume">Volume Only</MenuItem>
                      <MenuItem value="both">Both (Spread + Volume)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Target Spread %"
                    type="number"
                    value={formData.targetSpread}
                    onChange={handleInputChange('targetSpread')}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0.1, max: 10, step: 0.1 }
                    }}
                    helperText="Typical range: 0.2% - 1.0%"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Daily Volume Target"
                    type="number"
                    value={formData.dailyVolumeTarget}
                    onChange={handleInputChange('dailyVolumeTarget')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 1000 }
                    }}
                    helperText="Target daily trading volume in USD"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving}
            size="large"
          >
            {saving ? 'Saving...' : (selectedClient ? 'Update Client' : 'Complete Onboarding')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
