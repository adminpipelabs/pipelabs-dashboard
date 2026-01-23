# API Keys Persistence - How It Works

## ✅ API Keys ARE Already Persisted

Your API keys are stored **permanently** in PostgreSQL database and will persist across:
- ✅ Hard refresh (F5 / Cmd+R)
- ✅ Browser restart
- ✅ Frontend rebuilds
- ✅ Backend restarts
- ✅ Railway deployments

## How It Works

### Backend Storage
1. **Database**: PostgreSQL (Railway managed, persistent)
2. **Table**: `exchange_api_keys`
3. **Encryption**: All API keys are encrypted before storage using Fernet encryption
4. **Persistence**: Data survives all restarts and deployments

### Frontend Loading
1. **Auth Tokens**: Stored in `localStorage` (persists across refreshes)
2. **API Keys**: Fetched from backend on component mount
3. **Auto-refresh**: Components reload API keys when opened

## Verification

To verify API keys persist:

1. **Add an API key** via the UI
2. **Hard refresh** (Cmd+Shift+R or Ctrl+Shift+R)
3. **Check API Keys tab** - they should still be there
4. **Check modals** (Bots, Pairs, Send Order) - exchanges should load

## Troubleshooting

If API keys don't appear after refresh:

1. **Check Authentication**: Make sure you're still logged in
2. **Check Network**: Open browser DevTools → Network tab
3. **Check API Calls**: Look for `/api/admin/clients/{id}/api-keys` calls
4. **Check Console**: Look for any JavaScript errors

## Database Schema

```sql
CREATE TABLE exchange_api_keys (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    exchange VARCHAR(100) NOT NULL,
    api_key TEXT NOT NULL,  -- Encrypted
    api_secret TEXT NOT NULL,  -- Encrypted
    passphrase TEXT,  -- Encrypted (optional)
    label VARCHAR(255),
    is_testnet BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security

- ✅ All API keys encrypted at rest
- ✅ Encryption key derived from `SECRET_KEY` environment variable
- ✅ Keys never exposed in API responses (only previews shown)
- ✅ Database connection uses SSL in production
