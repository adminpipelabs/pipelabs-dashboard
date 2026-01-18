# Hummingbot Integration Guide

## Overview

This system integrates the Pipe Labs Dashboard with Hummingbot for automated trading execution. Each client gets isolated access to their own trading accounts.

---

## Architecture

```
Admin adds API keys in Dashboard
    ↓
Backend creates Hummingbot account (e.g., "client_sharp")
    ↓
Backend configures connector with encrypted keys
    ↓
Client can chat with scoped AI agent
    ↓
Agent validates every action (client isolation)
    ↓
Hummingbot executes trades on exchange
    ↓
Dashboard shows real results
```

---

## Setup

### 1. Start Hummingbot API

```bash
cd ~/hummingbot-api
make deploy

# Verify it's running
curl http://localhost:8080/health
```

### 2. Configure Dashboard

Add to Railway backend environment variables:

```bash
HUMMINGBOT_API_URL=http://localhost:8080
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Add Client API Keys

1. Log in as admin
2. Go to Admin Dashboard → Clients
3. Click on a client
4. Go to "API Keys" tab
5. Click "Add API Key"
6. Fill in:
   - Exchange: BitMart
   - API Key: `d8550cca6914e2b24c6374fa1ef00fe0fce62c32`
   - API Secret: `0916719bcca31383406e9d9bdbadff0d104d94bbe58f50eb9e33337341de204f`
   - Memo: `test1`
7. Click "Add API Key"

**What happens automatically:**
- Dashboard encrypts and stores the keys
- Backend creates Hummingbot account `client_[name]`
- Backend configures BitMart connector
- Client can now trade via agent

---

## Client Isolation

### How It Works

Each client has a **scope** that defines what they can access:

```python
ClientScope(
    client_name="Sharp",
    allowed_accounts=["client_sharp"],
    allowed_pairs=["SHARP-USDT"],
    allowed_exchanges=["bitmart"],
    max_spread=0.5,  # 0.5% max
    max_daily_volume=50000,  # $50K max
)
```

### Validation

Every action is validated:

```python
# Client says "check SHARP"
→ Agent checks: Is "client_sharp" allowed? ✅
→ Agent checks: Is "SHARP-USDT" in allowed pairs? ✅
→ Execute via Hummingbot

# Client says "check BTC"
→ Agent checks: Is "BTC-USDT" in allowed pairs? ❌
→ Block action: "Access denied"
```

---

## Trading Commands

### Via Dashboard Chat

Clients can type these commands in the AI Agent chat:

| Command | Action |
|---------|--------|
| `check SHARP` | Show balance + open orders |
| `refresh SHARP` | New spread orders at ±0.3% |
| `SHARP price` | Get current price |
| `run volume on SHARP` | Generate volume |
| `P&L report` | Show performance |

### Examples

**Check Status:**
```
User: check SHARP
Agent: 📊 SHARP-USDT Status:
       Balance: 6,000 SHARP, $24 USDT
       Open Orders: 2
         BUY 1,600 @ $0.00646
         SELL 1,600 @ $0.00650
```

**Refresh Spread:**
```
User: refresh SHARP
Agent: ✅ Refreshed SHARP-USDT spread orders:
       Current Price: $0.00648
       BUY: $0.00646 (1,600)
       SELL: $0.00650 (1,600)
       Orders placed successfully!
```

**Get Price:**
```
User: SHARP price
Agent: SHARP-USDT: $0.00648
```

---

## API Endpoints

### For Clients

```bash
# Chat with scoped agent
POST /api/agent/chat
{
  "message": "check SHARP",
  "chat_history": []
}

# Execute direct command
POST /api/agent/execute-command
{
  "message": "refresh SHARP"
}

# Get client scope
GET /api/agent/scope
```

### For Admins

```bash
# Add API key (auto-configures Hummingbot)
POST /api/admin/api-keys
{
  "client_id": "uuid",
  "exchange": "bitmart",
  "api_key": "...",
  "api_secret": "...",
  "passphrase": "test1"
}

# List client's API keys
GET /api/admin/clients/{client_id}/api-keys

# View decrypted key
GET /api/admin/api-keys/{key_id}
```

---

## Hummingbot API Endpoints Used

The dashboard calls these Hummingbot endpoints:

```bash
# Create account
POST http://localhost:8080/accounts/create
{
  "account_name": "client_sharp"
}

# Add connector
POST http://localhost:8080/connectors/add
{
  "account_name": "client_sharp",
  "connector_name": "bitmart",
  "api_key": "...",
  "api_secret": "...",
  "memo": "test1"
}

# Get balances
GET http://localhost:8080/portfolio?account=client_sharp

# Get orders
GET http://localhost:8080/orders?account=client_sharp&pair=SHARP-USDT

# Place limit order
POST http://localhost:8080/orders/place
{
  "account_name": "client_sharp",
  "connector_name": "bitmart",
  "trading_pair": "SHARP-USDT",
  "side": "buy",
  "order_type": "limit",
  "price": 0.00646,
  "amount": 1600
}

# Cancel order
POST http://localhost:8080/orders/cancel
{
  "account_name": "client_sharp",
  "order_id": "..."
}

# Get price
GET http://localhost:8080/market/price?connector=bitmart&pair=SHARP-USDT
```

---

## Security

### API Key Encryption

Keys are encrypted at rest using Fernet encryption:

```python
# Store
encrypted = Fernet(master_key).encrypt(api_key.encode())

# Retrieve
decrypted = Fernet(master_key).decrypt(encrypted).decode()
```

### Scope Validation

Every action is validated against client scope:

```python
def validate_action(action, scope):
    # Check account
    if action.account not in scope.allowed_accounts:
        return False, "Access denied"
    
    # Check pair
    if action.pair not in scope.allowed_pairs:
        return False, "Access denied"
    
    # Check limits
    if action.spread > scope.max_spread:
        return False, "Exceeds limits"
    
    return True, None
```

### No Withdrawal Access

API keys should only have permissions for:
- ✅ Read balances
- ✅ Place/cancel orders
- ❌ Withdraw funds (NEVER enable)

---

## Testing

### 1. Add BitMart API Keys

Use the test keys from the documentation:
- API Key: `d8550cca6914e2b24c6374fa1ef00fe0fce62c32`
- Secret: `0916719bcca31383406e9d9bdbadff0d104d94bbe58f50eb9e33337341de204f`
- Memo: `test1`

### 2. Test Commands

```bash
# Check if Hummingbot account was created
curl http://localhost:8080/accounts

# Should show: ["client_sharp"]

# Check if connector was added
curl http://localhost:8080/connectors?account=client_sharp

# Should show: ["bitmart"]

# Get balances
curl http://localhost:8080/portfolio?account=client_sharp
```

### 3. Test via Dashboard

1. Log in as client
2. Go to AI Agent chat
3. Type: `check SHARP`
4. Should see: Balance and orders
5. Type: `refresh SHARP`
6. Should see: New spread orders placed

---

## Troubleshooting

### "Hummingbot API not responding"

Check if Hummingbot is running:
```bash
docker ps | grep hummingbot
```

### "Account not found"

Hummingbot account wasn't created. Check logs:
```bash
# Backend logs
tail -f /var/log/backend.log
```

### "Invalid API key"

Keys might be encrypted incorrectly. View decrypted key:
```bash
GET /api/admin/api-keys/{key_id}
```

### "Action blocked"

Client is trying to access something outside their scope. Check:
```bash
GET /api/agent/scope
```

---

## Next Steps

1. ✅ Add BitMart API keys in dashboard
2. ⏳ Verify Hummingbot account created
3. ⏳ Test trading commands
4. ⏳ Add more exchanges/pairs
5. ⏳ Deploy to production

---

**Created**: January 18, 2026  
**Status**: Ready for Testing
