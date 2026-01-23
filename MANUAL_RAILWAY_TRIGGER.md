# Manual Railway Deployment Trigger

## Issue
Railway hasn't automatically detected commit `db979f8` from GitHub.

## Solution: Manual Trigger

### Option 1: Manual Redeploy (Fastest)

1. Go to **Railway Dashboard** → `ai-trading-ui` service
2. Click **"Deployments"** tab
3. Click **"Deploy"** button (top right)
4. Select **"Deploy Latest Commit"**
5. Railway will fetch commit `db979f8` and deploy

### Option 2: Clear Cache + Redeploy

1. Go to **Settings** → **Danger Zone**
2. Click **"Clear Build Cache"**
3. Go to **Deployments** tab
4. Click **"Deploy"** → **"Deploy Latest Commit"**

### Option 3: Verify Repository Connection

1. Go to **Settings** → **Source** tab
2. Verify:
   - Repository: `adminpipelabs/ai-trading-ui`
   - Branch: `main`
   - Root Directory: `/` (root, not `dashboard-ui`)
3. If incorrect, disconnect and reconnect

## Expected Result

After manual trigger:
- ✅ Railway will fetch commit `db979f8`
- ✅ Will build from root directory
- ✅ Will deploy successfully
- ✅ Frontend will be live with all updates

## Verify Deployment

Check Build Logs should show:
- Commit: `db979f8`
- Building from root directory
- `npm install` and `npm run build` running
- No "Could not find root directory" errors
