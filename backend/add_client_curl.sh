#!/bin/bash
# Simple curl script to create clients via API
# Usage: ./add_client_curl.sh "Client Name" "0xWalletAddress" "your-admin-token"

if [ $# -lt 3 ]; then
    echo "Usage: ./add_client_curl.sh \"Client Name\" \"0xWalletAddress\" \"admin-token\""
    echo ""
    echo "To get your admin token:"
    echo "1. Log in to the frontend"
    echo "2. Open browser console (F12)"
    echo "3. Run: localStorage.getItem('access_token')"
    echo "4. Copy the token"
    exit 1
fi

CLIENT_NAME="$1"
WALLET_ADDRESS="$2"
ADMIN_TOKEN="$3"
API_URL="${REACT_APP_API_URL:-https://pipelabs-dashboard-production.up.railway.app}"

echo "Creating client: $CLIENT_NAME"
echo "Wallet: $WALLET_ADDRESS"
echo "API: $API_URL"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d "{
    \"name\": \"${CLIENT_NAME}\",
    \"wallet_address\": \"${WALLET_ADDRESS}\",
    \"email\": null,
    \"status\": \"Active\"
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo "✅ Client created successfully!"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ Failed to create client (HTTP $http_code)"
    echo "$body"
    exit 1
fi
