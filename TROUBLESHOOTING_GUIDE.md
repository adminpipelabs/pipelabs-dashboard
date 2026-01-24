# Troubleshooting Guide: Portfolio, Orders, and Balances

## Issue: Getting Kicked Out When Clicking Portfolio

**Root Cause:** Navigation might be causing issues or auth check is failing.

**Fix Applied:**
- Improved navigation handling in `App.js`
- Added `selected` state to highlight active menu item
- Prevented page reload on navigation

**If Still Happening:**
1. Check browser console for errors
2. Check if token exists: `localStorage.getItem('access_token')`
3. Check if token is valid (not `'mock-token-12345'`)
4. Clear cache and login again

---

## Issue: Can't Send Orders

**Root Cause:** Trading Bridge connectors not initialized.

**Steps to Fix:**

1. **Go to Client Detail Page** (Admin Dashboard → Client Management → Click on client)

2. **Find "Trading Bridge Diagnostics" card** at the top

3. **Click "Reinitialize" button**
   - This will initialize connectors for all API keys
   - Wait for success message

4. **Try sending order again**

**If Still Failing:**
- Check error message - it should tell you exactly what's wrong
- Verify API keys are added and active
- Check backend logs for Trading Bridge errors

---

## Issue: Can't Get Balances

**Root Cause:** Same as orders - connectors not initialized.

**Steps to Fix:**

1. **Use Trading Bridge Diagnostics → Reinitialize** (same as orders)

2. **After reinitializing, refresh the page**

3. **Balances should appear**

**If Still $0:**
- Check if API keys are valid (not expired, correct permissions)
- Check Trading Bridge logs
- Verify exchange API keys have balance permissions

---

## Quick Diagnostic Checklist

### 1. Check Authentication
```javascript
// In browser console:
localStorage.getItem('access_token') // Should return a JWT token (not 'mock-token-12345')
localStorage.getItem('user') // Should return user object
```

### 2. Check API Keys
- Go to Client Detail Page
- Click "Manage API Keys"
- Verify API keys exist and are active
- Verify exchange names match (case-insensitive)

### 3. Check Trading Bridge Status
- Go to Client Detail Page
- Find "Trading Bridge Diagnostics"
- Click "Check Status"
- Should show account and connectors

### 4. Reinitialize Connectors
- Click "Reinitialize" in Trading Bridge Diagnostics
- Wait for success
- Try orders/balances again

---

## Common Error Messages

### "Session expired. Please log in again."
**Fix:** Log out and log in again with real credentials

### "No active API keys found"
**Fix:** Add API keys via "Manage API Keys" button

### "Connector 'bitmart' not found"
**Fix:** Use "Reinitialize" button in Trading Bridge Diagnostics

### "Account not found in Trading Bridge"
**Fix:** Use "Reinitialize" button - it creates the account

### "401 Unauthorized"
**Fix:** 
1. Clear browser cache
2. Log out
3. Log in again with real credentials (not mock)

---

## Step-by-Step Recovery

1. **Clear Browser Cache**
   - Open DevTools (F12)
   - Application → Clear Storage → Clear site data
   - Or manually delete `access_token` and `user` from localStorage

2. **Log In Again**
   - Use email/password (if you have account)
   - Or use wallet login (if wallet is registered)

3. **Go to Admin Dashboard**
   - Navigate to Client Management
   - Click on the client

4. **Reinitialize Connectors**
   - Find "Trading Bridge Diagnostics"
   - Click "Reinitialize"
   - Wait for success

5. **Test Orders**
   - Click "Send Order"
   - Fill in form
   - Submit
   - Should work now

6. **Test Balances**
   - Go to Client Dashboard
   - Balances should appear
   - If still $0, check API keys are valid

---

## Still Not Working?

Check backend logs for:
- Trading Bridge connection errors
- Connector initialization errors
- API key decryption errors
- Exchange API errors

Check frontend console for:
- 401 errors (auth issue)
- 404 errors (endpoint not found)
- 500 errors (backend error)
- Network errors (CORS or connectivity)
