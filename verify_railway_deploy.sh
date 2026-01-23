#!/bin/bash

echo "=== RAILWAY DEPLOYMENT VERIFICATION ==="
echo ""
echo "1. Checking latest commit..."
git log -1 --format="Commit: %H%nMessage: %s%nDate: %ad" --date=iso
echo ""
echo "2. Checking if api_keys_router is included..."
grep -n "api_keys_router" backend/app/main.py
echo ""
echo "3. Checking health endpoint version..."
grep -A5 "def health_check" backend/app/main.py
echo ""
echo "4. Checking exchange.value references (should be NONE)..."
grep -r "\.exchange\.value" backend/app/ || echo "✅ No .exchange.value references found"
echo ""
echo "5. Verifying files are tracked in git..."
git ls-files backend/app/main.py backend/app/api/api_keys.py backend/app/services/hummingbot.py | wc -l | xargs echo "Files tracked:"
echo ""
echo "6. Checking remote repository..."
git remote -v
echo ""
echo "=== NEXT STEPS ==="
echo "1. Go to Railway dashboard"
echo "2. Check if Root Directory is set to 'backend' for backend service"
echo "3. Check if Root Directory is set to 'dashboard-ui' for frontend service"
echo "4. Check which branch Railway is watching (should be 'main')"
echo "5. Check deployment logs to see which commit is being deployed"
echo "6. Try manually triggering a redeploy in Railway dashboard"
echo ""
echo "To verify deployment, check:"
echo "  Backend: curl https://your-backend-url/health"
echo "  Should show version: 0.1.4"
