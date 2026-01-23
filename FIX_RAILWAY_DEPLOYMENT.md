# 🚨 FIX: Railway Deploying Wrong Commit

## Problem
Railway is deploying commit `400a07bc` but should be deploying `d56fa22`.

## Current Status
- ✅ Latest commit: `d56fa22` (pushed to GitHub)
- ✅ Local and remote are in sync
- ❌ Railway is deploying old commit `400a07bc`

## Solution: Force Railway to Deploy Latest Commit

### Step 1: Go to Railway Dashboard
1. Open your Railway project
2. Click on **"backend-pipelabs-dashboard"** service

### Step 2: Check Service Settings
1. Go to **Settings** tab
2. Verify:
   - **Root Directory:** `backend` (NOT empty, NOT `/`)
   - **Branch:** `main` (NOT `master` or other branch)
   - **Repository:** `adminpipelabs/pipelabs-dashboard`

### Step 3: Manually Trigger Deployment
**Option A: Redeploy Latest Commit**
1. Go to **Deployments** tab
2. Click **"..."** (three dots) on the latest deployment
3. Select **"Redeploy"**
4. OR click **"Deploy"** button → **"Deploy Latest Commit"**

**Option B: Clear Cache and Redeploy**
1. Go to **Settings** → **Danger Zone**
2. Click **"Clear Build Cache"**
3. Go back to **Deployments**
4. Click **"Deploy"** → **"Deploy Latest Commit"**

### Step 4: Verify Deployment
After deployment completes:
1. Check the **Build Logs** tab
2. Look for commit hash - should be `d56fa22` (NOT `400a07bc`)
3. Check health endpoint:
   ```bash
   curl https://pipelabs-dashboard-production.up.railway.app/health
   ```
4. Should return:
   ```json
   {
     "status": "ok",
     "version": "0.1.4",
     "deployed_at": "2026-01-22T22:05:00Z",
     "commit": "677a15c"
   }
   ```

## If Still Not Working

### Check Railway Service Source
1. Go to **Settings** → **Source**
2. Verify it's connected to: `adminpipelabs/pipelabs-dashboard`
3. If different, disconnect and reconnect to correct repo

### Check for Multiple Services
Railway might have multiple services:
- One deploying from wrong repo/branch
- One deploying correctly
- Check ALL services in your Railway project

### Nuclear Option: Recreate Service
If nothing works:
1. Create a NEW service
2. Connect to `adminpipelabs/pipelabs-dashboard`
3. Set Root Directory to `backend`
4. Set Branch to `main`
5. Deploy
