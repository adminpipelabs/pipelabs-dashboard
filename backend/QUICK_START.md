# Quick Start - Add Client Script

## Super Simple Version

Just run this from the `backend` directory:

```bash
cd backend
python add_client_direct.py "Client Name" "0xWalletAddress"
```

**The script will:**
1. Ask you to paste your DATABASE_URL (if not set)
2. Create the client
3. Show confirmation

## Example

```bash
cd backend
python add_client_direct.py "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5"
```

When it asks for DATABASE_URL:
- Go to Railway → Backend → Variables → DATABASE_URL
- Copy the URL
- Paste it in the terminal
- Press Enter

That's it! ✅
