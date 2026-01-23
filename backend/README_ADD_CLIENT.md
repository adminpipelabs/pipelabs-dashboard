# Add Client Script - Quick Start Guide

## Setup (One-Time)

### 1. Get Database URL from Railway

1. Go to **Railway Dashboard** → Your **Backend Service**
2. Click **Variables** tab
3. Find `DATABASE_URL` 
4. Click the **eye icon** to reveal it
5. Copy the entire URL (starts with `postgresql://`)

### 2. Set Environment Variable

**Option A: For this session only**
```bash
export DATABASE_URL="postgresql://user:pass@host:port/dbname"
```

**Option B: Add to your shell profile (permanent)**
```bash
# Add to ~/.zshrc or ~/.bashrc
echo 'export DATABASE_URL="your-database-url"' >> ~/.zshrc
source ~/.zshrc
```

**Option C: Create .env file (recommended)**
```bash
cd backend
echo 'DATABASE_URL=your-database-url' > .env
```

## Usage

### Basic Usage
```bash
cd backend
python add_client_direct.py "Client Name" "0xWalletAddress"
```

### With Email
```bash
python add_client_direct.py "Client Name" "0xWalletAddress" "email@example.com"
```

### Examples

**Create client without email:**
```bash
python add_client_direct.py "John Doe" "0x61b6EF3769c88332629fA657508724a912b79101"
```

**Create client with email:**
```bash
python add_client_direct.py "Jane Smith" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5" "jane@example.com"
```

## What It Does

1. ✅ Validates wallet address format
2. ✅ Checks for duplicate wallets
3. ✅ Creates client with status: ACTIVE
4. ✅ Sets role: client
5. ✅ Shows confirmation with client ID

## Troubleshooting

**Error: "DATABASE_URL not found"**
- Make sure you've set the environment variable
- Check: `echo $DATABASE_URL`

**Error: "Cannot connect to database"**
- Verify DATABASE_URL is correct
- Check if database is accessible from your IP (Railway allows all IPs by default)

**Error: "Wallet already registered"**
- The wallet address already exists in the database
- Use a different wallet or check existing clients

## After Creating Client

The client can immediately log in at:
`https://ai-trading-ui-production.up.railway.app`

They'll:
1. Connect their wallet
2. Sign a message
3. Be authenticated automatically
