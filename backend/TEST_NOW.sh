#!/bin/bash
# Quick test script for the enterprise client creation endpoint

echo "🧪 Testing Enterprise Client Creation Endpoint"
echo "=============================================="
echo ""

# Get admin token from user
echo "Step 1: Get your admin token"
echo "  - Log in to frontend"
echo "  - Press F12 → Console"
echo "  - Run: localStorage.getItem('access_token')"
echo "  - Copy the token"
echo ""
read -p "Paste your admin token: " ADMIN_TOKEN

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Token is required"
    exit 1
fi

echo ""
echo "Step 2: Enter client details"
read -p "Client Name: " CLIENT_NAME
read -p "Wallet Address (0x...): " WALLET_ADDRESS
read -p "Email (optional, press Enter to skip): " CLIENT_EMAIL

if [ -z "$CLIENT_NAME" ] || [ -z "$WALLET_ADDRESS" ]; then
    echo "❌ Client name and wallet address are required"
    exit 1
fi

API_URL="https://pipelabs-dashboard-production.up.railway.app"

echo ""
echo "Creating client..."
echo ""

# Build JSON payload
if [ -z "$CLIENT_EMAIL" ]; then
    JSON_PAYLOAD="{\"name\": \"$CLIENT_NAME\", \"wallet_address\": \"$WALLET_ADDRESS\"}"
else
    JSON_PAYLOAD="{\"name\": \"$CLIENT_NAME\", \"wallet_address\": \"$WALLET_ADDRESS\", \"email\": \"$CLIENT_EMAIL\"}"
fi

# Make request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/quick-client" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d "$JSON_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response (HTTP $HTTP_CODE):"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" -eq 201 ]; then
    echo ""
    echo "✅ SUCCESS! Client created."
    echo ""
    echo "Client can now log in at:"
    echo "https://ai-trading-ui-production.up.railway.app"
else
    echo ""
    echo "❌ Failed (HTTP $HTTP_CODE)"
    echo "Check the error message above"
fi
