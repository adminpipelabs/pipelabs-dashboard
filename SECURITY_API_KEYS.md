# API Keys Security - Why NOT Store in Browser

## ⚠️ Security Risk: Storing API Keys in Browser

**DO NOT store API keys in browser localStorage/sessionStorage** because:

### Security Vulnerabilities

1. **XSS Attacks**: Any malicious script can read localStorage
   ```javascript
   // Attacker can do this:
   const stolenKeys = localStorage.getItem('api_keys');
   ```

2. **Browser Extensions**: Extensions can access localStorage
3. **DevTools Access**: Anyone with browser access can see stored keys
4. **No Encryption**: Browser storage is NOT encrypted
5. **Client-Side Exposure**: Keys visible in browser memory

### Current Secure Approach ✅

**Server-Side Storage (PostgreSQL):**
- ✅ Encrypted at rest using Fernet encryption
- ✅ Only decrypted when needed for API calls
- ✅ Never exposed in API responses (only previews)
- ✅ Protected by authentication
- ✅ Database access controlled by Railway

## What We CAN Cache in Browser

**Safe to cache (NOT sensitive):**
- ✅ Exchange names/labels (e.g., "BitMart", "MEXC")
- ✅ Trading pairs list (e.g., "SHARP-USDT")
- ✅ Bot configurations (spread targets, volume targets)
- ✅ Client metadata (names, tiers)

**NEVER cache:**
- ❌ API keys
- ❌ API secrets
- ❌ Passphrases
- ❌ Any credentials

## Resilience Strategy

Instead of storing keys in browser, ensure:

1. **Server Reliability**: Railway provides 99.9% uptime
2. **Database Backups**: Railway PostgreSQL has automatic backups
3. **Cache Exchange List**: Cache exchange names (not keys) in localStorage for offline UI
4. **Error Handling**: Show friendly messages if server is down

## Best Practice

**Current Implementation is Correct:**
- API keys stored encrypted in PostgreSQL ✅
- Keys fetched from server when needed ✅
- Never exposed to browser ✅
- Protected by authentication ✅

## If Server Goes Down

**What happens:**
- UI shows "Server unavailable" message
- API keys remain safe in database
- Once server is back, everything works again
- No data loss (database persists)

**What NOT to do:**
- Don't store keys in browser as "backup"
- Don't expose keys in API responses
- Don't cache sensitive credentials

## Recommendation

**Keep current approach** - it's secure and follows industry best practices.

If you want resilience:
1. Cache exchange names/labels in localStorage (safe)
2. Show cached UI when server is down
3. Sync with server when it's back online
