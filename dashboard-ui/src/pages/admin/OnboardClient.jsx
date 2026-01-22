import React, { useState } from 'react';
import { 
    Container, Paper, TextField, Button, Box, Typography, 
    Stepper, Step, StepLabel, Card, CardContent, Grid, FormControl, 
    InputLabel, Select, MenuItem, Alert, CircularProgress 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import './OnboardClient.css';

const EXCHANGES = [
    'binance', 'binance_us', 'bybit', 'okx', 'kucoin', 'gateio', 
    'huobi', 'kraken', 'coinbase', 'bitfinex', 'bitmart', 'bitget', 
    'mexc', 'poloniex', 'ascendex', 'crypto_com', 'phemex', 'bitmex'
];

const API_URL = process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app';

export default function OnboardClient() {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Client Info
    const [clientInfo, setClientInfo] = useState({
        name: '',
        email: '',
        phone: '',
        walletAddress: '',
        commissionPercentage: '',
        monthlyFee: '5000.00'
    });

    // Token Details
    const [tokenInfo, setTokenInfo] = useState({
        name: '',
        symbol: '',
        contractAddress: '',
        decimals: '18',
        logoUrl: ''
    });

    // API Keys (multiple)
    const [apiKeys, setApiKeys] = useState([
        { exchange: 'bitmart', apiKey: '', apiSecret: '', label: '' }
    ]);

    const handleClientInfoChange = (field, value) => {
        setClientInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleTokenInfoChange = (field, value) => {
        setTokenInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleApiKeyChange = (index, field, value) => {
        const newKeys = [...apiKeys];
        newKeys[index][field] = value;
        setApiKeys(newKeys);
    };

    const addApiKey = () => {
        setApiKeys([...apiKeys, { exchange: 'bitmart', apiKey: '', apiSecret: '', label: '' }]);
    };

    const removeApiKey = (index) => {
        setApiKeys(apiKeys.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        // Validation
        if (activeStep === 0) {
            if (!clientInfo.name || !clientInfo.email || !clientInfo.walletAddress) {
                setError('Please fill in all required client fields');
                return;
            }
        } else if (activeStep === 1) {
            if (!tokenInfo.name || !tokenInfo.symbol || !tokenInfo.contractAddress) {
                setError('Please fill in all required token fields');
                return;
            }
        }
        setError('');
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccessMessage('');

            // Validate all data
            if (!clientInfo.name || !clientInfo.email) {
                setError('Client name and email are required');
                setLoading(false);
                return;
            }

            if (!tokenInfo.name || !tokenInfo.symbol) {
                setError('Token name and symbol are required');
                setLoading(false);
                return;
            }

            if (apiKeys.some(key => !key.apiKey || !key.apiSecret)) {
                setError('All API key fields must be filled');
                setLoading(false);
                return;
            }

            const payload = {
                client: {
                    name: clientInfo.name,
                    email: clientInfo.email,
                    phone: clientInfo.phone,
                    walletAddress: clientInfo.walletAddress,
                    commissionPercentage: parseFloat(clientInfo.commissionPercentage) || 0,
                    monthlyFee: parseFloat(clientInfo.monthlyFee) || 5000
                },
                token: {
                    name: tokenInfo.name,
                    symbol: tokenInfo.symbol,
                    contractAddress: tokenInfo.contractAddress,
                    decimals: parseInt(tokenInfo.decimals) || 18,
                    logoUrl: tokenInfo.logoUrl
                },
                apiKeys: apiKeys.map(key => ({
                    exchange: key.exchange,
                    apiKey: key.apiKey,
                    apiSecret: key.apiSecret,
                    label: key.label || key.exchange
                }))
            };

            // Get auth token from localStorage
            const token = localStorage.getItem('pipelabs_token');
            
            if (!token) {
                setError('You must be logged in as admin to onboard clients');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/clients/onboard`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.detail || 'Failed to onboard client');
                setLoading(false);
                return;
            }

            setSuccessMessage(`✅ Client ${clientInfo.name} onboarded successfully! Setting up trading with token ${tokenInfo.symbol}...`);

            // Reset form
            setTimeout(() => {
                setClientInfo({ name: '', email: '', phone: '', walletAddress: '', commissionPercentage: '', monthlyFee: '5000.00' });
                setTokenInfo({ name: '', symbol: '', contractAddress: '', decimals: '18', logoUrl: '' });
                setApiKeys([{ exchange: 'bitmart', apiKey: '', apiSecret: '', label: '' }]);
                setActiveStep(0);
                setSuccessMessage('');
            }, 3000);

        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" className="onboard-container">
            <Box className="onboard-header">
                <Typography variant="h4" gutterBottom>
                    🚀 Onboard New Client
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Set up complete client with token and API keys in one form
                </Typography>
            </Box>
        
            {error && <Alert severity="error" className="alert-box">{error}</Alert>}
            {successMessage && <Alert severity="success" className="alert-box">{successMessage}</Alert>}
        
            <Paper className="form-paper">
                <Stepper activeStep={activeStep} className="stepper">
                    <Step>
                        <StepLabel>Client Info</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Token Details</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>API Keys</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Review & Submit</StepLabel>
                    </Step>
                </Stepper>
              
                <Box className="step-content">
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Client Information</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Client Name *"
                                        value={clientInfo.name}
                                        onChange={(e) => handleClientInfoChange('name', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email *"
                                        type="email"
                                        value={clientInfo.email}
                                        onChange={(e) => handleClientInfoChange('email', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        value={clientInfo.phone}
                                        onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Wallet Address *"
                                        value={clientInfo.walletAddress}
                                        onChange={(e) => handleClientInfoChange('walletAddress', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Commission %"
                                        type="number"
                                        inputProps={{ step: '0.01' }}
                                        value={clientInfo.commissionPercentage}
                                        onChange={(e) => handleClientInfoChange('commissionPercentage', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Monthly Fee (USD)"
                                        type="number"
                                        value={clientInfo.monthlyFee}
                                        onChange={(e) => handleClientInfoChange('monthlyFee', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                      
                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Token Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Name *"
                                        value={tokenInfo.name}
                                        onChange={(e) => handleTokenInfoChange('name', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Symbol *"
                                        value={tokenInfo.symbol}
                                        onChange={(e) => handleTokenInfoChange('symbol', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Contract Address *"
                                        value={tokenInfo.contractAddress}
                                        onChange={(e) => handleTokenInfoChange('contractAddress', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Decimals"
                                        type="number"
                                        value={tokenInfo.decimals}
                                        onChange={(e) => handleTokenInfoChange('decimals', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Logo URL"
                                        value={tokenInfo.logoUrl}
                                        onChange={(e) => handleTokenInfoChange('logoUrl', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                      
                    {activeStep === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Exchange API Keys</Typography>
                            {apiKeys.map((apiKey, index) => (
                                <Card key={index} className="api-key-card">
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={3}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Exchange</InputLabel>
                                                    <Select
                                                        value={apiKey.exchange}
                                                        label="Exchange"
                                                        onChange={(e) => handleApiKeyChange(index, 'exchange', e.target.value)}
                                                    >
                                                        {EXCHANGES.map(ex => (
                                                            <MenuItem key={ex} value={ex}>{ex.toUpperCase()}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Label (optional)"
                                                    value={apiKey.label}
                                                    onChange={(e) => handleApiKeyChange(index, 'label', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={5} className="api-key-inputs">
                                                <TextField
                                                    fullWidth
                                                    label="API Key *"
                                                    type="password"
                                                    value={apiKey.apiKey}
                                                    onChange={(e) => handleApiKeyChange(index, 'apiKey', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={1} className="delete-button">
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => removeApiKey(index)}
                                                    disabled={apiKeys.length === 1}
                                                >
                                                    <DeleteIcon />
                                                </Button>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="API Secret *"
                                                    type="password"
                                                    value={apiKey.apiSecret}
                                                    onChange={(e) => handleApiKeyChange(index, 'apiSecret', e.target.value)}
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={addApiKey}
                                fullWidth
                                className="add-key-button"
                            >
                                Add Another Exchange
                            </Button>
                        </Box>
                    )}
                      
                    {activeStep === 3 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Review Information</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>Client Name</Typography>
                                            <Typography variant="h6">{clientInfo.name}</Typography>
                                            <Typography color="textSecondary" gutterBottom style={{ marginTop: '10px' }}>Email</Typography>
                                            <Typography>{clientInfo.email}</Typography>
                                            <Typography color="textSecondary" gutterBottom style={{ marginTop: '10px' }}>Wallet</Typography>
                                            <Typography style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>{clientInfo.walletAddress}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>Token Name</Typography>
                                            <Typography variant="h6">{tokenInfo.symbol}</Typography>
                                            <Typography color="textSecondary" gutterBottom style={{ marginTop: '10px' }}>Address</Typography>
                                            <Typography style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>{tokenInfo.contractAddress}</Typography>
                                            <Typography color="textSecondary" gutterBottom style={{ marginTop: '10px' }}>APIs Configured</Typography>
                                            <Typography>{apiKeys.length} exchange(s)</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
              
                <Box className="button-group">
                    <Button disabled={activeStep === 0} onClick={handleBack}>
                        Back
                    </Button>
                    {activeStep < 3 ? (
                        <Button variant="contained" color="primary" onClick={handleNext}>
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSubmit}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Onboarding...' : 'Complete Onboarding'}
                        </Button>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
