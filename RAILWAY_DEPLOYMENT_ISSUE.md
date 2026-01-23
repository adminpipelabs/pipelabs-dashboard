# Railway Deployment Issue - Diagnostic Guide

## Problem
Railway shows "deployment successful" but no code changes are visible.

## Latest Commits Pushed
- **Commit:** `d56fa22e29a2e236511967aa279eda41d6183d36`
- **Message:** "Force Railway rebuild - add deploy metadata to health check"
- **Version:** 0.1.4
- **Date:** 2026-01-22 22:05:18

## Verification Steps

### 1. Check Railway Service Configuration

Go to Railway Dashboard → Your Backend Service → Settings:

**CRITICAL SETTINGS TO VERIFY:**

#### Root Directory
- **MUST BE:** `backend`
- If it's empty or `/`, Railway is deploying from repo root (WRONG!)
- **Fix:** Set Root Directory to `backend`

#### Branch
- **MUST BE:** `main`
- Check "Source" tab to see which branch Railway is watching
- **Fix:** Change to `main` branch if different

#### Repository
- **MUST BE:** `adminpipelabs/pipelabs-dashboard`
- Verify Railway is connected to the correct GitHub repo

### 2. Check Deployment Logs

In Railway Dashboard → Your Service → Deployments:

1. Click on the latest deployment
2. Check "Build Logs"
3. Look for: `git checkout` or `git clone`
4. **Verify the commit hash matches:** `d56fa22`

If commit hash is different (like `ae04d9c` or older), Railway is deploying old code!

### 3. Force Clear Build Cache

Railway might be using cached builds:

1. Go to Service Settings → Danger Zone
2. Click "Clear Build Cache"
3. Trigger a new deployment

### 4. Manual Redeploy

1. Go to Service → Deployments tab
2. Click "Redeploy" on latest deployment
3. Or click "Deploy" → "Deploy Latest Commit"

### 5. Verify Deployment

After redeploy, check the health endpoint:

```bash
curl https://your-backend-url.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "0.1.4",
  "deployed_at": "2026-01-22T22:05:00Z",
  "commit": "677a15c"
}
```

If you see `version: "0.1.2"` or older, Railway is deploying old code!

## Common Issues & Fixes

### Issue 1: Root Directory Not Set
**Symptom:** Railway can't find `app/main.py` or `requirements.txt`
**Fix:** Set Root Directory to `backend` in service settings

### Issue 2: Wrong Branch
**Symptom:** Deployments show old commit hashes
**Fix:** Change branch to `main` in service source settings

### Issue 3: Build Cache
**Symptom:** Changes don't appear even after new deployments
**Fix:** Clear build cache in Danger Zone

### Issue 4: Service Not Connected
**Symptom:** No deployments happening at all
**Fix:** Reconnect GitHub repo in service settings

## Frontend Service

Same checks apply for frontend:
- **Root Directory:** `dashboard-ui`
- **Branch:** `main`
- **Verify:** Check `/health` or version in `package.json` (should be `0.1.1`)

## Next Steps

1. ✅ Verify Root Directory = `backend` (backend) or `dashboard-ui` (frontend)
2. ✅ Verify Branch = `main`
3. ✅ Clear Build Cache
4. ✅ Manually trigger redeploy
5. ✅ Check deployment logs for commit hash `d56fa22`
6. ✅ Verify health endpoint shows version `0.1.4`
