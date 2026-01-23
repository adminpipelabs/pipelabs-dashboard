# Setup Instructions for add_client_direct.py

## Step 1: Get DATABASE_URL from Railway

1. Go to https://railway.app
2. Click on your **Backend Service** (usually named `backend-pipelabs-dashboard`)
3. Click the **Variables** tab
4. Find `DATABASE_URL` in the list
5. Click the **eye icon** 👁️ to reveal the value
6. **Copy the entire URL** (it will look like: `postgresql://user:password@host:port/database`)

## Step 2: Set Environment Variable

**Option A: Temporary (for this terminal session)**
```bash
export DATABASE_URL="paste-your-url-here"
```

**Option B: Permanent (adds to your shell profile)**
```bash
# Add to ~/.zshrc (Mac) or ~/.bashrc (Linux)
echo 'export DATABASE_URL="paste-your-url-here"' >> ~/.zshrc
source ~/.zshrc
```

**Option C: Create .env file (recommended - keeps it local)**
```bash
cd backend
echo 'DATABASE_URL=paste-your-url-here' > .env
```

## Step 3: Test the Script

```bash
cd backend
python add_client_direct.py "Test Client" "0x0000000000000000000000000000000000000000"
```

You should see usage instructions. If you see an error about DATABASE_URL, go back to Step 2.

## Step 4: Create Your First Real Client

```bash
python add_client_direct.py "Client Name" "0xWalletAddress" "email@example.com"
```

Example:
```bash
python add_client_direct.py "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5" "sharp@example.com"
```

## Troubleshooting

**"DATABASE_URL not found"**
- Make sure you've set the environment variable
- Check: `echo $DATABASE_URL` (should show your URL)

**"Cannot connect to database"**
- Verify the DATABASE_URL is correct
- Make sure you copied the entire URL including `postgresql://`

**"Module not found" errors**
- Make sure you're in the `backend` directory
- Install dependencies: `pip install -r requirements.txt`
