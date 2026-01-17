# 🚀 GitHub Pages Setup - QUICK START

## ⚡ 2-Minute Setup

### **Step 1: Enable GitHub Pages**

1. Go to: **https://github.com/adminpipelabs/pipelabs-dashboard/settings/pages**

2. Under **"Build and deployment"**:
   - **Source:** Select **"GitHub Actions"** (not "Deploy from a branch")
   - Click **Save**

### **Step 2: Create Deployment Workflow**

1. Go to: **https://github.com/adminpipelabs/pipelabs-dashboard/actions/new**

2. Search for: **"Static HTML"** or **"React"**

3. **OR** Create workflow file manually:
   - Go to: https://github.com/adminpipelabs/pipelabs-dashboard/new/main
   - Path: `.github/workflows/deploy.yml`
   - Paste contents from the file at: `/Users/mikaelo/dashboard/.github/workflows/deploy.yml`

4. **Commit** the workflow file

### **Step 3: Wait for Deployment**

1. Go to: **https://github.com/adminpipelabs/pipelabs-dashboard/actions**
2. Watch the deployment (takes 2-3 minutes)
3. Once complete, visit: **https://adminpipelabs.github.io/pipelabs-dashboard**

---

## 🎯 Alternative: Deploy from Your Computer

If you don't want to use GitHub Actions:

```bash
cd /Users/mikaelo/dashboard/dashboard-ui
npm run deploy
```

This will:
- Build your React app
- Create a `gh-pages` branch
- Push to GitHub
- Deploy to: **https://adminpipelabs.github.io/pipelabs-dashboard**

---

## 🔐 Token Issue

Your current token doesn't have `workflow` scope. To fix:

1. Go to: https://github.com/settings/tokens
2. Find your token
3. Check: ✅ **workflow**
4. Save

**OR** just use manual deployment (`npm run deploy`) - works without workflow permissions!

---

## ✅ Quick Deploy NOW (No Token Needed)

Run this in YOUR terminal:

```bash
cd /Users/mikaelo/dashboard/dashboard-ui
npm run deploy
```

Enter your GitHub credentials when prompted, and your dashboard will be live in 2 minutes! 🚀

**Your URL:** https://adminpipelabs.github.io/pipelabs-dashboard
