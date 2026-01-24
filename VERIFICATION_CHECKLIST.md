# Verification Checklist - Current Fixes

## After Railway Deployment

### 1. Test Order Placement ✅
**Endpoint:** `POST /api/admin/clients/{client_id}/orders`

**Test Steps:**
1. Log in as admin
2. Select a client (e.g., Sharp Foundation)
3. Click "Send Order"
4. Fill in:
   - Exchange: BitMart (or whatever exchange has API keys)
   - Trading Pair: SHARP/USDT
   - Order Type: LIMIT
   - Side: SELL
   - Quantity: 2000
   - Price: 0.008
5. Click "Send Order"

**Expected Result:**
- ✅ Order placed successfully
- ✅ Order ID returned
- ✅ No `'NoneType' object has no attribute 'lower'` error

**If Fails:**
- Check backend logs for Trading Bridge response
- Verify API key exists for selected exchange
- Check connector name matching logic

---

### 2. Test Balance Fetching ✅
**Endpoint:** `GET /api/clients/balances`

**Test Steps:**
1. Log in as client (using wallet address)
2. Navigate to client dashboard
3. Check "Wallet Balances" section

**Expected Result:**
- ✅ Shows SHARP balance (if exists)
- ✅ Shows USDT balance (if exists)
- ✅ Shows balances grouped by asset
- ✅ Displays exchange names

**If Shows $0:**
- Check backend logs for:
  - `🔍 Fetching balances for client...`
  - `📡 Calling Trading Bridge: .../portfolio?account=...`
  - `📥 Trading Bridge response status: ...`
  - `📊 Portfolio data received: ...`
- Verify Trading Bridge account exists: `client_{client_name}`
- Verify connector is initialized in Trading Bridge
- Check if API keys were properly added to Trading Bridge

---

### 3. Test Portfolio Overview ✅
**Endpoint:** `GET /api/clients/portfolio`

**Test Steps:**
1. Log in as client
2. View dashboard overview

**Expected Result:**
- ✅ Total Portfolio Value calculated correctly
- ✅ P&L shows percentage gain/loss
- ✅ Volume statistics displayed

---

### 4. Test Trade History ✅
**Endpoint:** `GET /api/clients/trades`

**Test Steps:**
1. Log in as client
2. Navigate to trade history

**Expected Result:**
- ✅ Shows trade history from Trading Bridge
- ✅ Filters by days correctly
- ✅ No errors

---

## Diagnostic Commands

### Check Trading Bridge Status
```bash
curl https://trading-bridge-production.up.railway.app/health
```

### Check if Account Exists
```bash
curl https://trading-bridge-production.up.railway.app/accounts/client_sharp_foundation
```

### Check Account Connectors
```bash
# Should show BitMart connector if API keys were added
curl https://trading-bridge-production.up.railway.app/accounts/client_sharp_foundation
```

### Get Portfolio (Test Direct)
```bash
curl "https://trading-bridge-production.up.railway.app/portfolio?account=client_sharp_foundation"
```

---

## Common Issues & Solutions

### Issue 1: Balances Show $0
**Possible Causes:**
1. Trading Bridge account doesn't exist
   - **Fix**: Account should be auto-created when API keys added
   - **Check**: Backend logs for account creation

2. Connector not initialized
   - **Fix**: Connector should be added when API keys added
   - **Check**: Backend logs for connector addition

3. API keys invalid/expired
   - **Fix**: Re-add API keys with correct credentials

4. Exchange API rate limiting
   - **Fix**: Wait and retry

**Debug Steps:**
1. Check backend logs for Trading Bridge calls
2. Test Trading Bridge endpoints directly (see commands above)
3. Verify API keys are correct in database
4. Check Trading Bridge service logs

### Issue 2: Orders Fail
**Possible Causes:**
1. Exchange name mismatch
   - **Fix**: Normalized matching should handle this now
   - **Check**: Backend logs show which exchange was matched

2. Account/connector not found in Trading Bridge
   - **Fix**: Ensure API keys were added and connector initialized
   - **Check**: Trading Bridge account status

3. Insufficient balance
   - **Fix**: Check actual exchange balance
   - **Check**: Trading Bridge portfolio endpoint

**Debug Steps:**
1. Check backend error logs
2. Verify exchange name in order matches API key exchange
3. Test Trading Bridge order endpoint directly

---

## Success Criteria

✅ **Orders work**: Can place LIMIT orders successfully  
✅ **Balances show**: Real balances from exchanges displayed  
✅ **Portfolio accurate**: Total value, P&L, volume calculated correctly  
✅ **No errors**: No 500 errors, no attribute errors  

Once all ✅, we can proceed with MCP integration.
