#!/bin/bash

# Sync Frontend Code from pipelabs-dashboard to ai-trading-ui Repository
# This script copies all frontend code to the ai-trading-ui repo for Railway deployment

set -e

echo "=========================================="
echo "Syncing Frontend Code to ai-trading-ui"
echo "=========================================="
echo ""

SOURCE_DIR="/Users/mikaelo/dashboard/dashboard-ui"
TEMP_DIR="/tmp/ai-trading-ui-sync"
REPO_URL="https://github.com/adminpipelabs/ai-trading-ui.git"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory not found: $SOURCE_DIR"
    exit 1
fi

echo "📦 Source: $SOURCE_DIR"
echo "🎯 Target: $REPO_URL"
echo ""

# Clone or update ai-trading-ui repo
if [ -d "$TEMP_DIR" ]; then
    echo "📥 Updating existing clone..."
    cd "$TEMP_DIR"
    git pull origin main || git fetch origin
else
    echo "📥 Cloning ai-trading-ui repository..."
    git clone "$REPO_URL" "$TEMP_DIR"
    cd "$TEMP_DIR"
fi

echo ""
echo "🔄 Copying files (excluding node_modules, build, .git)..."
echo ""

# Copy all files except node_modules, build, and .git
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude 'build' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude '*.log' \
  "$SOURCE_DIR/" .

echo ""
echo "📝 Checking changes..."
git status --short | head -20

echo ""
echo "=========================================="
echo "Ready to Commit and Push"
echo "=========================================="
echo ""
echo "Files copied successfully!"
echo ""
echo "Next steps:"
echo "1. Review changes: cd $TEMP_DIR && git status"
echo "2. Commit: git add . && git commit -m 'Sync latest frontend code from pipelabs-dashboard (v0.1.4)'"
echo "3. Push: git push origin main"
echo ""
echo "Or run with --auto-commit to automatically commit and push:"
echo "  $0 --auto-commit"
echo ""

# Auto-commit if requested
if [ "$1" == "--auto-commit" ]; then
    echo "🤖 Auto-commit mode enabled..."
    echo ""
    
    # Check if there are changes
    if git diff --quiet && git diff --cached --quiet; then
        echo "✅ No changes to commit"
    else
        echo "📝 Committing changes..."
        git add .
        git commit -m "Sync latest frontend code from pipelabs-dashboard (v0.1.4)

- Added SendOrderModal.jsx with order endpoint integration
- Added BotsModal.jsx for bot creation
- Added PairsModal.jsx for trading pair management
- Updated api.js with sendOrder() method
- Updated package.json to v0.1.4
- Updated nixpacks.toml for Railway deployment"
        
        echo ""
        echo "🚀 Pushing to GitHub..."
        git push origin main
        
        echo ""
        echo "✅ Successfully synced to ai-trading-ui repository!"
        echo "Railway will automatically detect the new commit and deploy."
    fi
fi

echo ""
echo "📁 Working directory: $TEMP_DIR"
