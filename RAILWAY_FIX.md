# Railway Frontend Fix - ai-trading-ui Service

## Current Situation
- Railway service: `ai-trading-ui` 
- Currently connected to: `adminpipelabs/ai-trading-ui` repo
- Root Directory: `/` (root)
- Frontend code location: `adminpipelabs/pipelabs-dashboard` repo in `dashboard-ui/` folder

## Solution: Change Railway to Correct Repository

### Step 1: Update Railway Source
1. Go to Railway Dashboard → `ai-trading-ui` service
2. Click **Settings** → **Source** tab
3. Click **"Disconnect"** next to `adminpipelabs/ai-trading-ui`
4. Click **"Connect Repo"** or **"+ New"**
5. Select: **`adminpipelabs/pipelabs-dashboard`**
6. Set **Root Directory** to: **`dashboard-ui`**
7. Click **Save**

### Step 2: Verify Deployment
After reconnecting:
- Railway will detect latest commits (`a1efb1f`, `d58aef2`, etc.)
- Build should succeed
- Frontend will deploy with all latest changes

## Alternative: Keep ai-trading-ui Repo
If you prefer to keep `ai-trading-ui` repo:
1. Set Root Directory to `/` (root) in Railway
2. Copy `dashboard-ui/` contents to `ai-trading-ui` repo root
3. Push to `ai-trading-ui` repo

But Option 1 (changing Railway to `pipelabs-dashboard`) is easier and keeps everything in one repo.
