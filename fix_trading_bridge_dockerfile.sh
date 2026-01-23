#!/bin/bash

# Fix Trading Bridge Dockerfile for Railway deployment
# Updates Dockerfile to use Railway's PORT environment variable

REPO_DIR="/tmp/trading-bridge-check"

if [ ! -d "$REPO_DIR" ]; then
    echo "Cloning trading-bridge repo..."
    git clone https://github.com/adminpipelabs/trading-bridge.git "$REPO_DIR"
fi

cd "$REPO_DIR"

echo "Current Dockerfile CMD:"
grep "^CMD" Dockerfile

echo ""
echo "Updating Dockerfile to use Railway PORT..."

# Update Dockerfile to use PORT env var
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app ./app

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-8080}

# Run the application (use PORT env var, default to 8080)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
EOF

echo ""
echo "Updated Dockerfile:"
cat Dockerfile

echo ""
echo "Ready to commit and push? (y/n)"
read -r answer

if [ "$answer" = "y" ]; then
    git add Dockerfile
    git commit -m "Fix: Use Railway PORT environment variable"
    git push origin main
    echo "✅ Pushed to GitHub. Railway should detect and redeploy."
else
    echo "Dockerfile updated locally. Review and push manually."
fi
