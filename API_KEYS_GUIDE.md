# API Key Management Guide

## Overview

The API Key Management system allows admins to securely store and manage exchange API keys for clients. These keys are encrypted at rest and can be used by your trading bots (Hummingbot/Claude) to execute trades on behalf of clients.

---

## Features

✅ **Secure Encryption**: API keys encrypted using Fernet encryption  
✅ **Multi-Exchange Support**: Binance, Bybit, OKX, KuCoin, Gate.io, Huobi, Kraken, Coinbase  
✅ **Testnet/Mainnet**: Support for both production and test environments  
✅ **Active/Inactive Toggle**: Enable/disable keys without deletion  
✅ **Multiple Accounts**: Add multiple API keys per client with custom labels  
✅ **Passphrase Support**: For exchanges that require it (OKX, KuCoin)  

---

## How to Use

### 1. Access API Keys

1. Log in as **Admin**
2. Go to **Admin Dashboard**
3. Click on a **client**
4. Click the **"API Keys"** tab

### 2. Add New API Key

1. Click **"Add API Key"** button
2. Fill in the form:
   - **Exchange**: Select the exchange (Binance, Bybit, etc.)
   - **Label**: Optional nickname (e.g., "Main Account", "Futures")
   - **API Key**: The public API key from the exchange
   - **API Secret**: The private secret key
   - **Passphrase**: Only for OKX and KuCoin
   - **Testnet**: Toggle if using testnet
   - **Notes**: Optional admin notes
3. Click **"Add API Key"**

### 3. View API Keys

- **List View**: Shows masked preview like `abc123...xyz789`
- **View Full Key**: Click the eye icon to see decrypted credentials
- **Copy**: Click copy icon to copy keys to clipboard

### 4. Manage API Keys

- **Toggle Active/Inactive**: Use the switch to enable/disable
- **Verify**: Test the key with the exchange (placeholder - needs implementation)
- **Delete**: Remove the API key permanently

---

## Security Notes

⚠️ **Important Security Considerations**:

1. **Encryption**: Keys are encrypted using the `SECRET_KEY` from your environment
2. **Admin Only**: Only admins can view decrypted keys
3. **Rotate Keys**: Change the keys periodically
4. **Permissions**: Ensure exchange API keys have minimum required permissions
5. **Read-Only + Spot Trade**: Recommended permissions for market making
6. **Never Share**: Keep the decrypted keys secure

---

## API Endpoints

### Get Client API Keys
```http
GET /api/admin/clients/{client_id}/api-keys
Authorization: Bearer <admin_token>
```

### Add API Key
```http
POST /api/admin/api-keys
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "client_id": "uuid",
  "exchange": "binance",
  "api_key": "...",
  "api_secret": "...",
  "passphrase": "...",  // optional
  "label": "Main Account",  // optional
  "is_testnet": false,
  "notes": "..."  // optional
}
```

### View Decrypted Key
```http
GET /api/admin/api-keys/{key_id}
Authorization: Bearer <admin_token>
```

### Update API Key
```http
PUT /api/admin/api-keys/{key_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_active": false,
  "label": "Updated Label",
  "notes": "..."
}
```

### Delete API Key
```http
DELETE /api/admin/api-keys/{key_id}
Authorization: Bearer <admin_token>
```

### Verify API Key
```http
POST /api/admin/api-keys/{key_id}/verify
Authorization: Bearer <admin_token}
```

---

## Integration with Trading Bots

### How It Works:

1. **Client registers** and you add their API keys to the dashboard
2. **Keys are stored encrypted** in PostgreSQL
3. **Your trading bot** (Hummingbot/Claude) retrieves the keys via API
4. **Bot executes trades** on the client's exchange account
5. **Results are displayed** in the client's dashboard portal

### Example: Hummingbot Integration

```python
# Pseudocode for bot integration
import requests

# Get client's API keys
response = requests.get(
    f"https://your-api.railway.app/api/admin/api-keys/{key_id}",
    headers={"Authorization": f"Bearer {admin_token}"}
)
keys = response.json()

# Configure Hummingbot connector
exchange_config = {
    "exchange": keys["exchange"],
    "api_key": keys["api_key"],
    "api_secret": keys["api_secret"],
    "passphrase": keys.get("passphrase"),
}

# Run trading bot with these credentials
# ... your Hummingbot logic here
```

---

## Database Schema

```sql
CREATE TABLE exchange_api_keys (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    exchange VARCHAR(20),  -- enum: binance, bybit, etc.
    label VARCHAR(100),
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT NOT NULL,
    passphrase_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_testnet BOOLEAN DEFAULT FALSE,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_verified_at TIMESTAMP,
    notes TEXT
);
```

---

## Supported Exchanges

| Exchange | Code | Passphrase Required |
|----------|------|---------------------|
| Binance | `binance` | No |
| Bybit | `bybit` | No |
| OKX | `okx` | **Yes** |
| KuCoin | `kucoin` | **Yes** |
| Gate.io | `gateio` | No |
| Huobi | `huobi` | No |
| Kraken | `kraken` | No |
| Coinbase | `coinbase` | No |

---

## Next Steps

1. ✅ **Deploy to Railway**: Push changes and wait for deployment
2. ⏳ **Add Claude API Key**: Set `ANTHROPIC_API_KEY` in Railway backend
3. ⏳ **Test Adding Keys**: Try adding a testnet API key for a client
4. ⏳ **Build Bot Service**: Create the trading bot that uses these keys
5. ⏳ **Integrate with Hummingbot**: Connect your existing Hummingbot setup

---

## Troubleshooting

### "Failed to add API key"
- Check that all required fields are filled
- Verify the API key format is correct
- Ensure passphrase is provided for OKX/KuCoin

### "Decryption failed"
- The `SECRET_KEY` environment variable changed
- Re-add the API keys with the current SECRET_KEY

### "API key not found"
- The key may have been deleted
- Check the client ID is correct

---

## Questions?

Need help? Check:
- Backend logs in Railway for errors
- Browser console for frontend errors
- Database for stored records

---

**Created**: January 17, 2026  
**Last Updated**: January 17, 2026  
**Status**: Active - Deployed to Railway
