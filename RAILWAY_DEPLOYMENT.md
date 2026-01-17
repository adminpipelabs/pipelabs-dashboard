# 🚀 Railway Deployment Guide

## Step-by-Step Deployment on Railway

### **Prerequisites:**
- GitHub account with repo: `adminpipelabs/pipelabs-dashboard`
- Railway account (sign up at https://railway.app)

---

## **Part 1: Deploy Backend**

### **1. Create Railway Project**

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `adminpipelabs/pipelabs-dashboard`
5. Railway will detect it's a monorepo

### **2. Configure Backend Service**

1. Click **"Add Service"** → **"GitHub Repo"**
2. **Root Directory:** Set to `backend`
3. **Service Name:** `pipelabs-backend`

### **3. Add PostgreSQL Database**

1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically provisions a database
3. Copy the `DATABASE_URL` (Railway sets this automatically as env var)

### **4. Add Redis**

1. Click **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway automatically provisions Redis
3. Copy the `REDIS_URL` (Railway sets this automatically)

### **5. Set Environment Variables**

In your backend service, click **"Variables"** tab and add:

```env
# Database (automatically set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars

# API Keys
ANTHROPIC_API_KEY=your-claude-api-key-here

# CORS (update with your frontend URL after deployment)
CORS_ORIGINS=https://adminpipelabs.github.io,http://localhost:3000

# Optional: Hummingbot
HUMMINGBOT_API_URL=your-hummingbot-url-if-applicable
```

### **6. Deploy Backend**

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Once deployed, copy your backend URL (e.g., `https://pipelabs-backend-production.up.railway.app`)

---

## **Part 2: Update Frontend**

### **1. Update Frontend Environment**

```bash
cd /Users/mikaelo/dashboard/dashboard-ui
```

Create `.env.production`:

```env
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```

### **2. Disable Mock Mode in Login**

Edit `src/pages/Login.jsx`:

Change line 48 from:
```javascript
if (true) { // Change to false to use real backend
```

To:
```javascript
if (false) { // Now using real backend
```

### **3. Deploy Frontend**

```bash
npm run deploy
```

This pushes to GitHub Pages with real backend connected!

---

## **Part 3: Database Migrations**

### **Run migrations on Railway:**

1. In Railway, go to your backend service
2. Click **"Settings"** → **"Deploy Triggers"**
3. Or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run alembic upgrade head
```

---

## **Alternative: Use Railway CLI (Faster)**

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Init in backend folder
cd /Users/mikaelo/dashboard/backend
railway init

# Railway will:
# 1. Create project
# 2. Ask for service name: "pipelabs-backend"
# 3. Link to GitHub repo

# Add databases via Railway dashboard
# Then set variables and deploy
railway up
```

---

## **Environment Variables Reference**

### **Required:**
- `DATABASE_URL` - PostgreSQL connection (auto-set by Railway)
- `REDIS_URL` - Redis connection (auto-set by Railway)
- `SECRET_KEY` - JWT secret (generate new one!)

### **Optional:**
- `ANTHROPIC_API_KEY` - For AI agent features
- `HUMMINGBOT_API_URL` - If using Hummingbot
- `CORS_ORIGINS` - Frontend URLs (comma-separated)

---

## **Testing Deployment**

### **1. Test Backend API:**

```bash
# Health check
curl https://your-backend-url.up.railway.app/health

# API docs
open https://your-backend-url.up.railway.app/docs
```

### **2. Test Frontend:**

1. Go to: https://adminpipelabs.github.io/pipelabs-dashboard
2. Try wallet or email login
3. Should connect to real backend now!

---

## **Cost Estimate**

Railway free tier includes:
- ✅ $5 credit/month
- ✅ Hobby plan: $5/month for all services

Estimated monthly cost:
- Backend service: ~$5-10
- PostgreSQL: ~$5
- Redis: ~$3
- **Total: ~$13-18/month**

Frontend (GitHub Pages): **FREE**

---

## **Troubleshooting**

### **Build Fails:**
- Check `requirements.txt` is complete
- Verify Python version in `runtime.txt`
- Check Railway build logs

### **Database Connection Fails:**
- Verify `DATABASE_URL` is set
- Check PostgreSQL service is running
- Run migrations: `railway run alembic upgrade head`

### **CORS Errors:**
- Add frontend URL to `CORS_ORIGINS`
- Format: `https://adminpipelabs.github.io`
- Restart backend after changing env vars

---

## **Next Steps After Deployment**

1. ✅ Test all authentication methods
2. ✅ Create admin user
3. ✅ Test API endpoints via `/docs`
4. ✅ Monitor Railway logs
5. ✅ Set up custom domain (optional)
6. ✅ Enable SSL (automatic on Railway)

---

**Your full-stack app is now deployed!** 🎉

- **Frontend:** https://adminpipelabs.github.io/pipelabs-dashboard
- **Backend:** https://your-backend.up.railway.app
- **API Docs:** https://your-backend.up.railway.app/docs
