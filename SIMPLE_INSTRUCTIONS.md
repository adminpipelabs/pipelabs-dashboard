# Simple Instructions - Add Client

## You're in the wrong directory! Here's how to fix it:

### Step 1: Navigate to the dashboard directory
```bash
cd ~/dashboard/backend
```

### Step 2: Use python3 (not python)
```bash
python3 add_client_direct.py "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5"
```

## OR Use the Simple Script:

```bash
cd ~/dashboard/backend
./RUN_ME.sh "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5"
```

## What You'll See:

1. Script asks for DATABASE_URL (if not set)
2. Paste your DATABASE_URL from Railway
3. Client gets created ✅

## Quick Copy-Paste Commands:

```bash
cd ~/dashboard/backend
python3 add_client_direct.py "Client Name" "0xWalletAddress"
```
