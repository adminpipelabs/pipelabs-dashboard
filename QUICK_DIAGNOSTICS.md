# Quick Diagnostics - Test Trading Bridge NOW

## Step 1: Test Trading Bridge Health (No Auth Required)

Open browser console and run:

```javascript
// Test Trading Bridge directly
fetch('https://trading-bridge-production.up.railway.app/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Trading Bridge Health:', data);
  })
  .catch(err => {
    console.error('❌ Trading Bridge DOWN:', err);
  });
```

**Expected:** `{status: "ok", service: "Trading Bridge"}`

## Step 2: Test Backend Diagnostics (Admin Auth Required)

```javascript
// Get your admin token
const token = localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token');

// Test backend diagnostics
fetch('https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/health', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Backend Diagnostics:', data);
  })
  .catch(err => {
    console.error('❌ Backend Diagnostics Failed:', err);
  });
```

## Step 3: Check Client Status (Admin Auth Required)

```javascript
// Replace YOUR_CLIENT_ID with actual client ID (e.g., from URL or client list)
const clientId = 'YOUR_CLIENT_ID'; // Get this from admin dashboard

fetch(`https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/clients/${clientId}/status`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(r => r.json())
  .then(data => {
    console.log('📊 Client Status:', data);
    console.log('Account exists:', data.account_status?.exists);
    console.log('Connectors:', data.connectors_status?.connectors);
  })
  .catch(err => {
    console.error('❌ Client Status Failed:', err);
  });
```

## Step 4: Reinitialize Connectors (Admin Auth Required)

```javascript
// This will fix connectors for a client
fetch(`https://pipelabs-dashboard-production.up.railway.app/api/diagnostics/clients/${clientId}/reinitialize`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(r => r.json())
  .then(data => {
    console.log('🔄 Reinitialize Results:', data);
    console.log('Results:', data.results);
  })
  .catch(err => {
    console.error('❌ Reinitialize Failed:', err);
  });
```

## Step 5: Fix Client Authentication (401 Errors)

The 401 errors mean client authentication is failing. Check:

1. **Is the client logged in?** - Check if token exists:
```javascript
console.log('Token:', localStorage.getItem('access_token'));
```

2. **Is token expired?** - Try logging out and back in

3. **Is client User record created?** - When admin creates a client, a User record should be created automatically on first login

## What to Do Next

1. **Run Step 1** - Verify Trading Bridge is up
2. **Run Step 2** - Verify backend can reach Trading Bridge  
3. **Run Step 3** - See what connectors exist
4. **Run Step 4** - Fix connectors if missing
5. **Fix 401 errors** - Ensure client is properly logged in

## Expected Results

After Step 4 (reinitialize):
- Account exists in Trading Bridge ✅
- Connectors configured ✅
- Balances should appear ✅
- Orders should work ✅
