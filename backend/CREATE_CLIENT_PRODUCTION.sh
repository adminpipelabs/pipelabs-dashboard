#!/bin/bash
# Production client creation script
# Usage: ./CREATE_CLIENT_PRODUCTION.sh "Client Name" "0xWalletAddress" "your-admin-token" [email]

if [ $# -lt 3 ]; then
    echo "Usage: ./CREATE_CLIENT_PRODUCTION.sh \"Client Name\" \"0xWalletAddress\" \"admin-token\" [email]"
    echo ""
    echo "Example:"
    echo '  ./CREATE_CLIENT_PRODUCTION.sh "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5" "eyJhbGci..." "sharp@example.com"'
    exit 1
fi

CLIENT_NAME="$1"
WALLET_ADDRESS="$2"
ADMIN_TOKEN="$3"
CLIENT_EMAIL="${4:-}"

API_URL="https://pipelabs-dashboard-production.up.railway.app"

# Build JSON payload
if [ -z "$CLIENT_EMAIL" ]; then
    JSON_PAYLOAD="{\"name\": \"$CLIENT_NAME\", \"wallet_address\": \"$WALLET_ADDRESS\"}"
else
    JSON_PAYLOAD="{\"name\": \"$CLIENT_NAME\", \"wallet_address\": \"$WALLET_ADDRESS\", \"email\": \"$CLIENT_EMAIL\"}"
fi

echo "Creating client: $CLIENT_NAME"
echo "Wallet: $WALLET_ADDRESS"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/admin/quick-client" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d "$JSON_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ SUCCESS - Client created!"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "Client can now log in at: https://ai-trading-ui-production.up.railway.app"
else
    echo "❌ ERROR (HTTP $HTTP_CODE)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi
