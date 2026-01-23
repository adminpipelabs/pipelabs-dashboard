# Sync Frontend Code to ai-trading-ui Repository

## Current Situation

- **Railway Service:** `ai-trading-ui` 
- **Railway Repo:** `adminpipelabs/ai-trading-ui` (frontend at root level)
- **Code Location:** `adminpipelabs/pipelabs-dashboard` (in `dashboard-ui/` folder)
- **Problem:** Latest code is in `pipelabs-dashboard` but Railway deploys from `ai-trading-ui`

## Solution Options

### Option 1: Sync Code to ai-trading-ui Repo (Recommended)

Copy all code from `dashboard-ui/` to `ai-trading-ui` repository:

```bash
# Clone ai-trading-ui repo
cd /tmp
git clone https://github.com/adminpipelabs/ai-trading-ui.git
cd ai-trading-ui

# Copy all files from dashboard-ui (except node_modules, build)
rsync -av --exclude 'node_modules' --exclude 'build' \
  /Users/mikaelo/dashboard/dashboard-ui/ .

# Commit and push
git add .
git commit -m "Sync latest frontend code from pipelabs-dashboard (v0.1.4)"
git push origin main
```

### Option 2: Change Railway to Use pipelabs-dashboard

1. Railway → `ai-trading-ui` → Settings → Source
2. Disconnect `ai-trading-ui` repo
3. Connect `pipelabs-dashboard` repo
4. Set Root Directory: `dashboard-ui`
5. Save

## Files to Sync

Latest changes include:
- ✅ `SendOrderModal.jsx` - Order endpoint integration
- ✅ `BotsModal.jsx` - Bot creation
- ✅ `PairsModal.jsx` - Trading pair management
- ✅ `api.js` - `sendOrder()` method added
- ✅ `package.json` - Version 0.1.4
- ✅ `nixpacks.toml` - Build configuration
- ✅ All other frontend components

## After Syncing

Railway will automatically:
1. Detect new commit in `ai-trading-ui` repo
2. Build from root directory (no subdirectory needed)
3. Deploy with all latest changes
4. Frontend will be live!
