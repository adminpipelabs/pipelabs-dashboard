#!/bin/bash

# Railway Frontend Setup Verification Script
# This script helps verify and document the correct Railway configuration

echo "=========================================="
echo "Railway Frontend Setup Verification"
echo "=========================================="
echo ""

# Check current git repository
echo "📦 Current Repository:"
git remote -v | head -2
echo ""

# Check latest commits
echo "📝 Latest Frontend Commits:"
git log origin/main -5 --oneline --all -- dashboard-ui/ | head -5
echo ""

# Check frontend files exist
echo "✅ Frontend Files Check:"
if [ -d "dashboard-ui" ]; then
    echo "  ✓ dashboard-ui/ directory exists"
    if [ -f "dashboard-ui/package.json" ]; then
        VERSION=$(grep '"version"' dashboard-ui/package.json | head -1 | cut -d'"' -f4)
        echo "  ✓ package.json found (version: $VERSION)"
    fi
    if [ -f "dashboard-ui/nixpacks.toml" ]; then
        echo "  ✓ nixpacks.toml found"
    fi
    if [ -f "dashboard-ui/railway.json" ]; then
        echo "  ✓ railway.json found"
    fi
    if [ -d "dashboard-ui/src" ]; then
        echo "  ✓ src/ directory exists"
        FILE_COUNT=$(find dashboard-ui/src -name "*.jsx" -o -name "*.js" | wc -l | tr -d ' ')
        echo "  ✓ Found $FILE_COUNT frontend source files"
    fi
else
    echo "  ✗ dashboard-ui/ directory NOT found"
fi
echo ""

# Display Railway configuration instructions
echo "=========================================="
echo "Railway Configuration Instructions"
echo "=========================================="
echo ""
echo "1. Go to Railway Dashboard → ai-trading-ui service"
echo "2. Click Settings → Source tab"
echo "3. Connect Repository: adminpipelabs/pipelabs-dashboard"
echo "4. Set Root Directory: dashboard-ui"
echo "5. Set Branch: main"
echo "6. Save and Railway will auto-deploy"
echo ""
echo "Expected Configuration:"
echo "  Repository: adminpipelabs/pipelabs-dashboard"
echo "  Root Directory: dashboard-ui"
echo "  Branch: main"
echo ""

# Check if we can verify the setup via API (if Railway CLI is installed)
if command -v railway &> /dev/null; then
    echo "ℹ️  Railway CLI detected - you can verify config with:"
    echo "   railway status"
    echo "   railway variables"
else
    echo "ℹ️  Install Railway CLI for programmatic access:"
    echo "   npm i -g @railway/cli"
    echo "   railway login"
fi

echo ""
echo "=========================================="
echo "Latest Frontend Changes Ready to Deploy:"
echo "=========================================="
git log origin/main -3 --oneline --all -- dashboard-ui/ | while read line; do
    echo "  $line"
done
echo ""
echo "✅ Once Railway is configured correctly, these commits will deploy automatically!"
echo ""
