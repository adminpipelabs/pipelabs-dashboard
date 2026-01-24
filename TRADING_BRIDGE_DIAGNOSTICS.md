# Trading Bridge Diagnostics & Fix Guide

## Critical Issue
**Problem:** Balances showing $0 and orders not working means Trading Bridge connectors are not initializing properly.

## What I've Done

### 1. ✅ Added Diagnostic Endpoints
New endpoints to test and diagnose Trading Bridge connectivity:

- `GET /api/diagnostics/health` - Check if Trading Bridge service is accessible
- `GET /api/diagnostics/accounts/{account_name}` - Check if account exists
- `GET /api/diagnostics/connectors?account={account_name}` - List connectors for account
- `GET /api/diagnostics/clients/{client_id}/status` - Full status for a client
- `POST /api/diagnostics/clients/{client_id}/reinitialize` - Reinitialize all connectors

### 2. ✅ Improved Error Handling
- Better error messages with HTTP status codes
- Detailed logging for connector initialization
- Timeout handling (30 second timeout)
- Proper error propagation

## Next Steps - IMMEDIATE ACTION REQUIRED

### Step 1: Test Trading Bridge Health
```bash
# Check if Trading Bridge is accessible
curl https://trading-bridge-production.up.railway.app/health

# Or via your backend
curl https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/health
```

**Expected:** `{"status": "ok", "service": "Trading Bridge"}`

**If fails:** Trading Bridge service is down or unreachable

### Step 2: Check Client Status
```bash
# Replace {client_id} with actual client ID
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/clients/{client_id}/status
```

**This will show:**
- Account name
- API keys count
- Account exists in Trading Bridge?
- Connectors configured?

### Step 3: Reinitialize Connectors
If connectors are missing or failed:

```bash
# Reinitialize all connectors for a client
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/clients/{client_id}/reinitialize
```

**This will:**
- Recreate account if needed
- Re-add all connectors
- Show detailed results for each exchange

### Step 4: Check Backend Logs
Look for these log messages in Railway backend logs:

**Success:**
```
✅ Trading Bridge account ready: client_sharp_foundation
✅ Added bitmart connector to Trading Bridge account client_sharp_foundation
```

**Failure:**
```
❌ Trading Bridge timeout: Service did not respond within 30 seconds
❌ HTTP 500: Failed to add connector - {error details}
❌ Failed to configure Trading Bridge account: {error}
```

## Common Issues & Solutions

### Issue 1: Trading Bridge Service Down
**Symptom:** Health check fails, timeouts

**Solution:**
1. Check Railway dashboard for `trading-bridge` service
2. Verify it's running and accessible
3. Check service logs for errors

### Issue 2: Account Not Created
**Symptom:** Account status shows `exists: false`

**Solution:**
1. Use reinitialize endpoint to create account
2. Check logs for account creation errors
3. Verify Trading Bridge `/accounts/create` endpoint works

### Issue 3: Connector Not Added
**Symptom:** Connectors list is empty or missing exchange

**Solution:**
1. Use reinitialize endpoint to re-add connectors
2. Check logs for connector addition errors
3. Verify API keys are valid and not expired
4. Check Trading Bridge `/connectors/add` endpoint

### Issue 4: API Keys Invalid
**Symptom:** Connector added but balances still $0

**Solution:**
1. Verify API keys are correct in database
2. Test API keys directly with exchange API
3. Check if API keys have proper permissions (read, trade)
4. Verify exchange name matches Trading Bridge connector name

## Testing Checklist

- [ ] Trading Bridge health check passes
- [ ] Client account exists in Trading Bridge
- [ ] Connectors are listed for the account
- [ ] Reinitialize completes successfully
- [ ] Balances appear after reinitialize
- [ ] Orders can be placed after reinitialize

## Manual Testing via Frontend

After backend deploys, you can test via browser console:

```javascript
// Check Trading Bridge health
fetch('https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/health')
  .then(r => r.json())
  .then(console.log)

// Check client status (replace CLIENT_ID)
fetch('https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/clients/CLIENT_ID/status', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
  .then(r => r.json())
  .then(console.log)

// Reinitialize connectors
fetch('https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/clients/CLIENT_ID/reinitialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
  .then(r => r.json())
  .then(console.log)
```

## Expected Outcome

After running diagnostics and reinitialize:

1. **Account exists** in Trading Bridge
2. **Connectors are configured** for each exchange
3. **Balances appear** in client dashboard
4. **Orders can be placed** successfully

## If Still Not Working

1. **Check Trading Bridge logs** - Look for errors when connectors are added
2. **Verify API keys** - Test them directly with exchange API
3. **Check connector name** - Must match Trading Bridge's expected format (e.g., `bitmart` not `BitMart`)
4. **Verify permissions** - API keys need trading and balance read permissions
5. **Check network** - Ensure Trading Bridge can reach exchange APIs

## Critical Path

1. ✅ **Deploy diagnostics** (DONE)
2. ⏳ **Test Trading Bridge health** (NEXT)
3. ⏳ **Check client status** (NEXT)
4. ⏳ **Reinitialize connectors** (NEXT)
5. ⏳ **Verify balances appear** (NEXT)
6. ⏳ **Test order placement** (NEXT)
