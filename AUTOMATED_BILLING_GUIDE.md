# Automated Billing & Payment System

## 🎯 Overview

Fully automated client onboarding and billing system with contract acceptance, payment processing, and auto-suspension.

---

## 🚀 Client Registration Flow

### Step 1: Registration Form
- **URL:** `https://adminpipelabs.github.io/pipelabs-dashboard/register`
- Client fills in:
  - Company name
  - Contact name
  - Email
  - Password (minimum 8 characters)
  - Wallet address (optional)
  - Billing plan (monthly/quarterly/annual)

### Step 2: Contract Acceptance
- Service agreement displayed
- Client must check "I Accept"
- Digital signature required (typed name)
- IP address and timestamp recorded automatically

### Step 3: Payment
- Invoice created automatically
- Two payment options:
  1. **Cryptocurrency (USDT/USDC)**
     - Wallet address displayed
     - Payment reference provided
     - Automatic activation on blockchain confirmation
  2. **Stripe (Coming Soon)**
     - Credit card payment
     - Instant activation

---

## 💰 Billing Plans

| Plan | Price | Billing Cycle | Discount |
|------|-------|---------------|----------|
| Monthly | $5,000 | Every 30 days | - |
| Quarterly | $14,000 | Every 90 days | ~7% |
| Annual | $50,000 | Every 365 days | ~17% |

---

## 🔄 Automated Processes

### 1. Account Activation
**Trigger:** Payment confirmed

**What Happens:**
- Client status → `ACTIVE`
- User account enabled for login
- Welcome email sent
- Next billing date calculated
- Client can immediately log in to dashboard

---

### 2. Recurring Billing
**Trigger:** Cron job runs daily

**Endpoint:** `POST /api/billing/admin/generate-invoices`

**What Happens:**
1. System checks all active clients
2. Finds clients where `next_billing_date` ≤ today
3. Creates new invoice for each
4. Updates client `payment_status` to `PENDING`
5. Sends invoice email to client

**How to Set Up:**
```bash
# Add to crontab (runs at 9 AM daily)
0 9 * * * curl -X POST https://pipelabs-dashboard-production.up.railway.app/api/billing/admin/generate-invoices
```

---

### 3. Auto-Suspension
**Trigger:** Cron job runs daily

**Endpoint:** `POST /api/billing/admin/suspend-overdue`

**What Happens:**
1. System checks clients with `payment_status` = `OVERDUE`
2. Checks if grace period expired (default 7 days)
3. If expired:
   - Client status → `SUSPENDED`
   - User login disabled
   - Suspension email sent

**How to Set Up:**
```bash
# Add to crontab (runs at 10 AM daily)
0 10 * * * curl -X POST https://pipelabs-dashboard-production.up.railway.app/api/billing/admin/suspend-overdue
```

---

## 👨‍💼 Admin Controls

### Manual Payment Confirmation

When a client pays via bank transfer or off-platform:

```bash
POST /api/billing/admin/mark-invoice-paid/{invoice_id}
{
  "payment_method": "bank_transfer",
  "notes": "Wire transfer received on 2026-01-18"
}
```

**What Happens:**
- Invoice marked as PAID
- Client reactivated if suspended
- Next billing date calculated

---

### View Client Billing Info

```bash
GET /api/billing/client/{client_id}/billing-info
```

**Returns:**
- Current payment status
- Next billing date
- Billing plan
- Pending invoices
- Grace period settings

---

## 📧 Email Notifications

### Welcome Email (After Payment)
**Sent To:** New client  
**Contains:**
- Login URL
- Email (reminder)
- Welcome message
- Next steps

### Invoice Email (Monthly Billing)
**Sent To:** Existing client  
**Contains:**
- Amount due
- Due date
- Payment instructions
- Invoice link

### Suspension Notice
**Sent To:** Client with overdue payment  
**Contains:**
- Reason for suspension
- Amount owed
- Payment instructions
- Contact info

---

## 🔐 Database Models

### Client Fields (Billing)
```python
billing_plan: BillingPlan  # monthly, quarterly, annual
monthly_fee: Decimal
billing_cycle_start: datetime
payment_status: PaymentStatus  # paid, pending, overdue
next_billing_date: datetime
last_payment_date: datetime
grace_period_days: int  # default 7
auto_suspend_on_overdue: bool  # default True
suspension_reason: str | None

# Contract
contract_accepted: bool
contract_signed_date: datetime
contract_signature: str
contract_ip_address: str

# Stripe
stripe_customer_id: str | None
stripe_subscription_id: str | None
```

### Invoice Model
```python
id: UUID
client_id: UUID
amount: Decimal
billing_period: str  # "2026-01"
status: InvoiceStatus  # pending, paid, overdue, cancelled
payment_method: PaymentMethod  # crypto, stripe, bank_transfer
payment_proof: str  # TX hash or Stripe ID
due_date: datetime
paid_date: datetime | None
created_at: datetime
```

---

## 🛠️ Configuration

### Payment Wallet Address

Update in `/backend/app/api/billing.py`:

```python
"crypto": {
    "usdt_address": "0xYOUR_ACTUAL_WALLET_ADDRESS",
    "reference": f"CLIENT-{str(client.id)[:8]}",
}
```

### Email Service

Set up email sending (SendGrid, Postmark, or AWS SES):

```python
# TODO locations in billing.py:
# Line ~150: Send welcome email
# Line ~400: Send invoice email
# Line ~450: Send suspension email
```

### Grace Period

Change default grace period in `Client` model:

```python
grace_period_days: Mapped[int] = mapped_column(default=7)  # Change to your preference
```

---

## 📊 API Endpoints Summary

### Public (No Auth Required)
- `POST /api/billing/register` - Client registration
- `POST /api/billing/confirm-payment` - Confirm payment received

### Protected (Client Access)
- `GET /api/billing/client/{id}/billing-info` - View billing details
- `GET /api/billing/invoices/{id}` - View invoice

### Admin Only
- `POST /api/billing/admin/generate-invoices` - Generate monthly invoices
- `POST /api/billing/admin/suspend-overdue` - Suspend overdue accounts
- `POST /api/billing/admin/mark-invoice-paid/{id}` - Manual payment confirmation

---

## 🧪 Testing the Flow

### 1. Register New Client

1. Go to `https://adminpipelabs.github.io/pipelabs-dashboard/register`
2. Fill in company details
3. Accept contract
4. Note the payment details shown

### 2. Simulate Payment

```bash
# Manually confirm payment
curl -X POST https://pipelabs-dashboard-production.up.railway.app/api/billing/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "CLIENT_ID_FROM_REGISTRATION",
    "payment_method": "crypto",
    "transaction_hash": "0x123abc...",
    "amount": 5000.00
  }'
```

### 3. Login

Go to `https://adminpipelabs.github.io/pipelabs-dashboard/login` and log in with the email/password you created.

---

## 🔮 Future Enhancements

### Stripe Integration (TODO: ID #4)

1. Add Stripe keys to environment:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

2. Implement in `billing.py`:
   - Create Stripe customer on registration
   - Create checkout session
   - Handle webhook for payment confirmation
   - Set up subscription for recurring billing

3. Frontend: Uncomment Stripe checkout button in `Register.jsx`

### Blockchain Monitoring

For automatic crypto payment confirmation:

1. Set up blockchain listener (Web3.py, ethers.js)
2. Monitor incoming transactions to your wallet
3. Match transaction reference to client ID
4. Auto-call `/confirm-payment` endpoint

---

## 📞 Support

For issues or questions:
- **Email:** billing@pipelabs.com
- **Docs:** See `/docs` for full API documentation
- **Admin Dashboard:** Monitor all clients and invoices

---

## ✅ What's Automated

- ✅ Client registration
- ✅ Contract acceptance & signing
- ✅ Invoice creation
- ✅ Account activation on payment
- ✅ Monthly billing (with cron)
- ✅ Payment grace period
- ✅ Auto-suspension for non-payment
- ✅ Account reactivation on payment
- ⏳ Stripe payment (ready for integration)
- ⏳ Email notifications (ready for SMTP setup)
- ⏳ Blockchain monitoring (manual for now)

---

**Last Updated:** January 18, 2026
