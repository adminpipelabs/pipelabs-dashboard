# Railway Frontend Deployment Guide

## Overview

Deploy the React frontend to Railway for better reliability than GitHub Pages.

---

## Why Railway for Frontend?

- ✅ **Faster deploys** - 2-3 minutes vs 5-10 minutes
- ✅ **No caching issues** - Updates show immediately
- ✅ **Proper routing** - No 404 hacks needed
- ✅ **Custom domains** - Easy SSL setup
- ✅ **Better control** - Environment variables, logs, monitoring

---

## Deployment Steps

### 1. Create New Service in Railway

1. Go to your Railway project dashboard
2. Click **"+ New Service"**
3. Select **"GitHub Repo"**
4. Choose **`adminpipelabs/pipelabs-dashboard`**
5. Click **"Add Service"**

### 2. Configure Service

In the new service settings:

#### **General Settings:**
- **Name:** `pipelabs-dashboard-frontend` (or your preference)
- **Root Directory:** `dashboard-ui`

#### **Environment Variables:**

Add these variables in the **Variables** tab:

```
REACT_APP_API_URL=https://pipelabs-dashboard-production.up.railway.app
```

Optional (for production):
```
NODE_ENV=production
```

### 3. Deploy

Railway will automatically:
- Detect Node.js project
- Run `npm install`
- Run `npm run build`
- Start production server with `npx serve -s build`

**Build time:** ~2-3 minutes

---

## Configuration Files

The frontend includes these Railway config files:

### `dashboard-ui/railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx serve -s build -l 3000",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `dashboard-ui/nixpacks.toml`
```toml
providers = ["node"]

[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm install", "npm install -g serve"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve -s build -p 3000"
```

---

## Post-Deployment

### Get Your Frontend URL

After deployment completes:

1. Go to **Settings** tab
2. Click **"Networking"**
3. Click **"Generate Domain"**
4. Your URL will be: `https://[service-name].up.railway.app`

Example: `https://pipelabs-dashboard-frontend.up.railway.app`

### Update Backend CORS

Add your new Railway frontend URL to backend CORS:

1. Go to backend service in Railway
2. Add environment variable:
   ```
   CORS_ORIGINS=["https://pipelabs-dashboard-frontend.up.railway.app","https://adminpipelabs.github.io","http://localhost:3000"]
   ```

---

## Custom Domain (Optional)

### Add Your Own Domain

1. In frontend service, go to **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Enter your domain: `app.pipelabs.xyz` (example)
4. Add the provided CNAME record to your DNS:
   ```
   CNAME app → [your-service].up.railway.app
   ```
5. Wait for DNS propagation (~5-60 minutes)
6. Railway automatically provisions SSL certificate

---

## Monitoring & Logs

### View Logs

1. Click your frontend service
2. Go to **"Deployments"** tab
3. Click latest deployment
4. View build and runtime logs

### Check Status

- **Build logs:** Shows npm install and build process
- **Deploy logs:** Shows server startup
- **Metrics:** CPU, Memory, Network usage

---

## Troubleshooting

### Build Fails

Check build logs for errors:
- Missing dependencies → `npm install` failed
- Build errors → Check React code for issues

### Server Won't Start

- Check if port 3000 is specified correctly
- Verify `serve` is installed globally in build phase

### White Screen / 404s

- Check `REACT_APP_API_URL` environment variable
- Verify backend CORS includes frontend URL
- Check browser console for errors

### API Calls Fail

- Ensure `REACT_APP_API_URL` is set correctly
- Check backend CORS settings
- Verify backend service is running

---

## Comparison with GitHub Pages

| Feature | GitHub Pages | Railway |
|---------|--------------|---------|
| **Deploy Speed** | 5-10 minutes | 2-3 minutes |
| **Caching** | Aggressive | Controlled |
| **Routing** | Requires hacks | Works natively |
| **Environment Vars** | No | Yes |
| **Custom Domains** | Manual setup | One-click |
| **SSL** | Automatic | Automatic |
| **Logs** | No | Yes |
| **Monitoring** | No | Yes |
| **Cost** | Free | Free tier available |

---

## URLs Summary

After complete setup, you'll have:

- **Frontend (Railway):** `https://[your-frontend].up.railway.app`
- **Backend (Railway):** `https://pipelabs-dashboard-production.up.railway.app`
- **API Docs:** `https://pipelabs-dashboard-production.up.railway.app/docs`

---

## Environment Variables Reference

### Frontend Service:

```bash
REACT_APP_API_URL=https://pipelabs-dashboard-production.up.railway.app
NODE_ENV=production
```

### Backend Service (update CORS):

```bash
CORS_ORIGINS=["https://[your-frontend].up.railway.app","http://localhost:3000"]
```

---

## Maintenance

### Redeploy

Railway auto-deploys on every git push to `main` branch.

Manual redeploy:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on any deployment

### Rollback

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"..."** → **"Redeploy"**

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Dashboard Docs:** See `AUTOMATED_BILLING_GUIDE.md`
- **Issues:** Check Railway service logs

---

**Last Updated:** January 18, 2026
