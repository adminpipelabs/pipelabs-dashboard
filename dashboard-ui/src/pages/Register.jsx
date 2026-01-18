import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Alert,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  InputAdornment,
  Link,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  AccountBalanceWallet as WalletIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const steps = ['Company Details', 'Contract Acceptance', 'Payment'];

export default function Register() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    password: '',
    confirmPassword: '',
    walletAddress: '',
    billingPlan: 'monthly',
    contractAccepted: false,
    contractSignature: '',
    paymentMethod: 'crypto',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError('');
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.checked });
  };

  const handleNext = async () => {
    setError('');

    // Validation for each step
    if (activeStep === 0) {
      if (!formData.companyName || !formData.contactName || !formData.email || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (activeStep === 1) {
      if (!formData.contractAccepted) {
        setError('You must accept the contract to proceed');
        return;
      }
      if (!formData.contractSignature) {
        setError('Please provide your signature');
        return;
      }

      // Submit registration
      try {
        setLoading(true);
        const response = await fetch('https://pipelabs-dashboard-production.up.railway.app/api/billing/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: formData.companyName,
            contact_name: formData.contactName,
            email: formData.email,
            password: formData.password,
            wallet_address: formData.walletAddress || null,
            contract_accepted: formData.contractAccepted,
            contract_signature: formData.contractSignature,
            billing_plan: formData.billingPlan,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }

        setRegistrationData(data);
        setActiveStep(activeStep + 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const getPlanPrice = (plan) => {
    const prices = {
      monthly: 5000,
      quarterly: 14000,
      annual: 50000,
    };
    return prices[plan];
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 3,
      }}
    >
      <Card sx={{ maxWidth: 800, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Join Pipe Labs
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Company Details */}
          {activeStep === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.contactName}
                onChange={handleChange('contactName')}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                margin="normal"
                required
                helperText="Minimum 8 characters"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Wallet Address (Optional)"
                value={formData.walletAddress}
                onChange={handleChange('walletAddress')}
                margin="normal"
                helperText="For wallet login and crypto payments"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WalletIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl component="fieldset" sx={{ mt: 3 }}>
                <FormLabel component="legend">Billing Plan</FormLabel>
                <RadioGroup value={formData.billingPlan} onChange={handleChange('billingPlan')}>
                  <FormControlLabel value="monthly" control={<Radio />} label="Monthly - $5,000/month" />
                  <FormControlLabel value="quarterly" control={<Radio />} label="Quarterly - $14,000 (~7% discount)" />
                  <FormControlLabel value="annual" control={<Radio />} label="Annual - $50,000 (~17% discount)" />
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {/* Step 2: Contract Acceptance */}
          {activeStep === 1 && (
            <Box>
              <Card variant="outlined" sx={{ p: 3, mb: 3, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Pipe Labs Service Agreement
                </Typography>
                <Typography variant="body2" paragraph>
                  This Service Agreement ("Agreement") is entered into between Pipe Labs ("Provider") and {formData.companyName} ("Client").
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>1. Services:</strong> Provider agrees to provide market making services for Client's tokens as specified.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>2. Payment Terms:</strong> Client agrees to pay ${getPlanPrice(formData.billingPlan).toLocaleString()} per {formData.billingPlan === 'monthly' ? 'month' : formData.billingPlan === 'quarterly' ? 'quarter' : 'year'} for the services provided.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>3. Term:</strong> This agreement begins upon payment confirmation and continues on a {formData.billingPlan} basis until terminated by either party with 30 days notice.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>4. Confidentiality:</strong> Both parties agree to maintain confidentiality of all proprietary information.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>5. Liability:</strong> Provider's liability is limited to the amount paid by Client in the preceding 12 months.
                </Typography>
                <Typography variant="body2">
                  By accepting this agreement, you confirm that you have the authority to enter into this agreement on behalf of {formData.companyName}.
                </Typography>
              </Card>

              <FormControlLabel
                control={<Checkbox checked={formData.contractAccepted} onChange={handleCheckboxChange('contractAccepted')} />}
                label={
                  <Typography variant="body2">
                    I have read and agree to the Service Agreement on behalf of {formData.companyName}
                  </Typography>
                }
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Your Signature"
                value={formData.contractSignature}
                onChange={handleChange('contractSignature')}
                margin="normal"
                required
                helperText="Type your full name as your digital signature"
                disabled={!formData.contractAccepted}
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                A copy of this agreement will be sent to your email after registration.
              </Alert>
            </Box>
          )}

          {/* Step 3: Payment */}
          {activeStep === 2 && registrationData && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Registration successful! Complete payment to activate your account.
              </Alert>

              <Card variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom>
                  Payment Due
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ${registrationData.amount_due.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due by: {new Date(registrationData.due_date).toLocaleDateString()}
                </Typography>
              </Card>

              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Payment Method</FormLabel>
                <RadioGroup value={formData.paymentMethod} onChange={handleChange('paymentMethod')}>
                  <FormControlLabel value="crypto" control={<Radio />} label="Cryptocurrency (USDT/USDC)" />
                  <FormControlLabel value="stripe" control={<Radio />} label="Credit Card (Stripe)" />
                </RadioGroup>
              </FormControl>

              {formData.paymentMethod === 'crypto' && registrationData.payment_options?.crypto && (
                <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Crypto Payment Instructions
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Send <strong>exactly ${registrationData.amount_due} USDT</strong> to:
                  </Typography>
                  <TextField
                    fullWidth
                    value={registrationData.payment_options.crypto.usdt_address}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    label="USDT Address"
                  />
                  <TextField
                    fullWidth
                    value={registrationData.payment_options.crypto.reference}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    label="Payment Reference"
                    helperText="Include this reference in your transaction"
                  />
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Your account will be activated automatically once payment is confirmed on the blockchain (usually within 10 minutes).
                  </Alert>
                </Card>
              )}

              {formData.paymentMethod === 'stripe' && (
                <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardIcon /> Credit Card Payment
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Stripe integration coming soon! For now, please use cryptocurrency payment or contact support.
                  </Typography>
                  <Button variant="outlined" disabled fullWidth>
                    Pay with Stripe
                  </Button>
                </Card>
              )}

              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  <strong>Important:</strong> You will not be able to log in until payment is confirmed.
                </Typography>
                <Typography variant="body2">
                  Check your email for payment confirmation and login instructions.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Questions about payment?
                </Typography>
                <Link href="mailto:billing@pipelabs.com" underline="hover">
                  Contact our billing support
                </Link>
              </Box>
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {activeStep > 0 && activeStep < 2 && (
              <Button onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
            {activeStep < 2 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{ ml: 'auto' }}
              >
                {loading ? <CircularProgress size={24} /> : activeStep === 1 ? 'Submit Registration' : 'Next'}
              </Button>
            )}
            {activeStep === 2 && (
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ ml: 'auto' }}
              >
                Go to Login
              </Button>
            )}
          </Box>

          {activeStep === 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link href="/login" underline="hover">
                  Log in
                </Link>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
