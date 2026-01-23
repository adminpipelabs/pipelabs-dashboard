# Railway Frontend Setup - Quick Reference

## ✅ Correct Configuration

**Service:** `ai-trading-ui`  
**Repository:** `adminpipelabs/pipelabs-dashboard`  
**Root Directory:** `dashboard-ui`  
**Branch:** `main`

## 📋 Setup Steps

1. **Railway Dashboard** → `ai-trading-ui` service
2. **Settings** → **Source** tab
3. **Connect Repo:** `adminpipelabs/pipelabs-dashboard`
4. **Root Directory:** `dashboard-ui`
5. **Branch:** `main`
6. **Save**

## ✅ Verification

After setup, verify:
- ✅ Latest commit shows in Railway deployments (should be `a1efb1f` or newer)
- ✅ Build logs show `npm install` and `npm run build`
- ✅ No "Could not find root directory" errors
- ✅ Service shows "Online" status

## 🔄 Latest Frontend Changes

All these commits are ready to deploy:
- `a1efb1f` - Force frontend rebuild v0.1.4
- `d58aef2` - Integrate trading-bridge order endpoint
- `38fab7e` - FORCE FRONTEND REBUILD v0.1.3 FINAL

## 📁 Frontend Structure

```
pipelabs-dashboard/
└── dashboard-ui/          ← Root Directory for Railway
    ├── package.json       (version: 0.1.4)
    ├── nixpacks.toml
    ├── railway.json
    ├── src/
    │   ├── components/
    │   │   ├── SendOrderModal.jsx  ← Order endpoint integration
    │   │   ├── BotsModal.jsx
    │   │   └── PairsModal.jsx
    │   └── services/
    │       └── api.js     ← sendOrder() method added
    └── public/
```

## 🚀 After Configuration

Railway will automatically:
1. Detect new commits to `main` branch
2. Build from `dashboard-ui/` directory
3. Deploy frontend with all latest changes
4. Show updates immediately (no cache issues)

## 🔍 Troubleshooting

**If build fails:**
- Verify Root Directory = `dashboard-ui` (not `/`)
- Check build logs for specific errors
- Ensure `package.json` exists in `dashboard-ui/`

**If changes don't appear:**
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check Network tab in DevTools for new JS files
- Verify deployment shows latest commit hash

## 📞 Quick Commands

Run the verification script:
```bash
./setup_railway_frontend.sh
```

Check latest commits:
```bash
git log origin/main -5 --oneline --all -- dashboard-ui/
```
