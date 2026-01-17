# Pipe Labs Dashboard - Deployment Guide

## 🚀 Quick Deploy Guide

### Frontend Deployment (React)

#### **Option 1: Deploy to Vercel (Recommended)**

1. **Push to GitHub** (Already Done! ✅)
   ```bash
   # Your code is at: https://github.com/adminpipelabs/pipelabs-dashboard
   ```

2. **Deploy to Vercel**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select: `adminpipelabs/pipelabs-dashboard`
   - Configure:
     - **Framework Preset:** Create React App
     - **Root Directory:** `dashboard-ui`
     - **Build Command:** `npm run build`
     - **Output Directory:** `build`
   - Click "Deploy"
   - Done! Your dashboard will be live in 2-3 minutes

3. **Environment Variables** (After Deploy)
   - Go to Project Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = your backend URL
   - Redeploy

#### **Option 2: Deploy to Netlify**

1. Go to: https://app.netlify.com/start
2. Connect to GitHub: `adminpipelabs/pipelabs-dashboard`
3. Configure:
   - **Base directory:** `dashboard-ui`
   - **Build command:** `npm run build`
   - **Publish directory:** `dashboard-ui/build`
4. Deploy!

---

### Backend Deployment (FastAPI + PostgreSQL + Redis)

#### **Option 1: Deploy to Render (Recommended)**

1. **Create Render Account:** https://render.com

2. **Deploy Backend:**
   - Click "New +" → "Web Service"
   - Connect GitHub: `adminpipelabs/pipelabs-dashboard`
   - Configure:
     - **Name:** pipelabs-backend
     - **Root Directory:** `backend`
     - **Runtime:** Python 3
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     
3. **Add PostgreSQL:**
   - Click "New +" → "PostgreSQL"
   - Copy connection string
   - Add to backend environment variables as `DATABASE_URL`

4. **Add Redis:**
   - Click "New +" → "Redis"
   - Copy connection string
   - Add to backend environment variables as `REDIS_URL`

5. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   SECRET_KEY=your-secret-key-here
   ANTHROPIC_API_KEY=your-claude-api-key
   HUMMINGBOT_API_URL=your-hummingbot-url
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

#### **Option 2: Deploy to Railway**

1. Go to: https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select `adminpipelabs/pipelabs-dashboard`
4. Add PostgreSQL and Redis from Railway marketplace
5. Configure environment variables
6. Deploy!

#### **Option 3: Deploy with Docker (Any VPS)**

```bash
# On your VPS (DigitalOcean, AWS, etc.)
git clone https://github.com/adminpipelabs/pipelabs-dashboard.git
cd pipelabs-dashboard
cp backend/.env.example backend/.env
# Edit backend/.env with your values
docker-compose up -d
```

---

## 🔗 Full Stack Connection

After deploying both:

1. **Update Frontend Environment:**
   - In Vercel/Netlify settings
   - Set `REACT_APP_API_URL` to your backend URL
   - Example: `https://pipelabs-backend.onrender.com/api`

2. **Update Backend CORS:**
   - In Render/Railway settings
   - Set `CORS_ORIGINS` to your frontend URL
   - Example: `https://pipelabs-dashboard.vercel.app`

3. **Test Connection:**
   - Visit your frontend URL
   - Try logging in
   - Check browser console for API calls

---

## 💰 Cost Estimate

### Free Tier (Good for Testing):
- ✅ Vercel: Free
- ✅ Render Backend: Free (with limitations)
- ✅ Render PostgreSQL: Free (90 days)
- ❌ Render Redis: Not free

### Production Tier:
- Vercel Pro: $20/month
- Render Backend: $7-25/month
- PostgreSQL: $7-15/month
- Redis: $10/month
- **Total: ~$44-70/month**

### Alternative (Cheaper):
- DigitalOcean Droplet: $6-12/month
- Deploy everything with Docker
- Self-managed but more affordable

---

## 🎯 Recommended Quick Start

**For immediate testing:**

1. **Deploy Frontend to Vercel** (2 minutes, free)
2. **Keep backend local** for now (mock data works)
3. **Later:** Deploy backend to Render when ready for real API

**Want me to walk you through the Vercel deployment now?**

---

## 🔐 Security Checklist

Before going live:
- [ ] Change all default passwords
- [ ] Generate new SECRET_KEY
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS only
- [ ] Set up environment variables (never commit secrets)
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging

---

## 📊 Current Architecture

```
GitHub Repo: adminpipelabs/pipelabs-dashboard
├── dashboard-ui/        → Deploy to Vercel/Netlify
└── backend/             → Deploy to Render/Railway/VPS
    ├── PostgreSQL       → Render PostgreSQL / Railway
    └── Redis           → Render Redis / Railway
```

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
