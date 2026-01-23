# Trading Bridge Integration Plan for ai-trading-ui

## Overview
Integrate trading-bridge service with ai-trading-ui frontend to enable:
- Real-time market data
- Order placement and management
- Portfolio/balance tracking
- Bot creation and management
- Exchange connector management

---

## Trading Bridge API Endpoints

### Base URL
```
REACT_APP_TRADING_BRIDGE_URL=https://trading-bridge-production.up.railway.app
```

### Available Endpoints

#### 1. Accounts
- `POST /accounts/create` - Create trading account
- `GET /accounts` - List all accounts
- `GET /accounts/{name}` - Get account details

#### 2. Connectors (Exchanges)
- `POST /connectors/add` - Add exchange API keys
- `GET /connectors/supported` - List supported exchanges

#### 3. Market Data
- `GET /market/price?connector={exchange}&pair={pair}` - Get current price
- `POST /market-data/prices` - Get multiple prices (Hummingbot compatible)
- `GET /market/orderbook?connector={exchange}&pair={pair}` - Get order book

#### 4. Orders
- `GET /orders?account={account}&pair={pair}` - Get open orders
- `POST /orders/place` - Place new order
- `POST /orders/cancel` - Cancel order

#### 5. Portfolio
- `GET /portfolio?account={account}` - Get balances
- `GET /history?account={account}&pair={pair}` - Get trade history

#### 6. Bots & Strategies
- `GET /bots/bots` - List all bots
- `GET /bots/bots/{bot_id}` - Get bot details
- `POST /bots/create` - Create new bot
- `POST /bots/{bot_id}/start` - Start bot
- `POST /bots/{bot_id}/stop` - Stop bot
- `POST /bots/{bot_id}/update` - Update bot config
- `DELETE /bots/{bot_id}` - Delete bot
- `GET /bots/strategies` - List available strategies

---

## Frontend Integration Plan

### Step 1: Add Trading Bridge API Service

**File:** `src/services/tradingBridge.js` (NEW)

```javascript
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 
  'https://trading-bridge-production.up.railway.app';

async function bridgeCall(endpoint, options = {}) {
  const response = await fetch(`${TRADING_BRIDGE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const tradingBridge = {
  // Accounts
  async createAccount(accountName) {
    return bridgeCall('/accounts/create', {
      method: 'POST',
      body: JSON.stringify({ account_name: accountName }),
    });
  },
  
  async getAccounts() {
    return bridgeCall('/accounts');
  },
  
  async getAccount(name) {
    return bridgeCall(`/accounts/${name}`);
  },
  
  // Connectors
  async getSupportedExchanges() {
    return bridgeCall('/connectors/supported');
  },
  
  async addConnector(accountName, connectorName, apiKey, apiSecret, extraParams = {}) {
    return bridgeCall('/connectors/add', {
      method: 'POST',
      body: JSON.stringify({
        account_name: accountName,
        connector_name: connectorName,
        api_key: apiKey,
        api_secret: apiSecret,
        ...extraParams,
      }),
    });
  },
  
  // Market Data
  async getPrice(connector, pair) {
    return bridgeCall(`/market/price?connector=${connector}&pair=${encodeURIComponent(pair)}`);
  },
  
  async getOrderBook(connector, pair) {
    return bridgeCall(`/market/orderbook?connector=${connector}&pair=${encodeURIComponent(pair)}`);
  },
  
  // Orders
  async getOrders(account, pair = null) {
    const params = new URLSearchParams({ account });
    if (pair) params.append('pair', pair);
    return bridgeCall(`/orders?${params}`);
  },
  
  async placeOrder(orderData) {
    return bridgeCall('/orders/place', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  
  async cancelOrder(accountName, orderId, connectorName = null) {
    return bridgeCall('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({
        account_name: accountName,
        order_id: orderId,
        connector_name: connectorName,
      }),
    });
  },
  
  // Portfolio
  async getPortfolio(account) {
    return bridgeCall(`/portfolio?account=${account}`);
  },
  
  async getTradeHistory(account, pair = null) {
    const params = new URLSearchParams({ account });
    if (pair) params.append('pair', pair);
    return bridgeCall(`/history?${params}`);
  },
  
  // Bots
  async listBots() {
    return bridgeCall('/bots/bots');
  },
  
  async getBot(botId) {
    return bridgeCall(`/bots/bots/${botId}`);
  },
  
  async createBot(botData) {
    return bridgeCall('/bots/create', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  },
  
  async startBot(botId) {
    return bridgeCall(`/bots/${botId}/start`, { method: 'POST' });
  },
  
  async stopBot(botId) {
    return bridgeCall(`/bots/${botId}/stop`, { method: 'POST' });
  },
  
  async updateBot(botId, config) {
    return bridgeCall(`/bots/${botId}/update`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
  
  async deleteBot(botId) {
    return bridgeCall(`/bots/${botId}`, { method: 'DELETE' });
  },
  
  async getStrategies() {
    return bridgeCall('/bots/strategies');
  },
};
```

---

### Step 2: Update Existing Components

#### 2.1 Send Order Modal
**File:** `src/components/SendOrderModal.jsx`

**Changes:**
- Replace placeholder `alert()` with actual `tradingBridge.placeOrder()` call
- Use account name from client (e.g., `client_{clientName}`)
- Handle order response and show success/error

#### 2.2 Bots Modal
**File:** `src/components/BotsModal.jsx`

**Changes:**
- Use `tradingBridge.createBot()` instead of backend API
- Fetch available strategies: `tradingBridge.getStrategies()`
- Show bot status (running/stopped)

#### 2.3 Client Dashboard
**File:** `src/pages/ClientDashboard.jsx`

**Changes:**
- Fetch real balances: `tradingBridge.getPortfolio(accountName)`
- Fetch trade history: `tradingBridge.getTradeHistory(accountName)`
- Show open orders: `tradingBridge.getOrders(accountName)`

#### 2.4 Admin Dashboard
**File:** `src/pages/AdminDashboard.jsx`

**Changes:**
- Show all bots: `tradingBridge.listBots()`
- Bot management (start/stop/delete)
- Real-time market data display

---

### Step 3: New Components to Create

#### 3.1 Bot Management Component
**File:** `src/components/BotManagement.jsx` (NEW)

**Features:**
- List all bots with status
- Start/Stop/Delete buttons
- Bot performance metrics
- Strategy configuration

#### 3.2 Market Data Component
**File:** `src/components/MarketData.jsx` (NEW)

**Features:**
- Real-time price display
- Order book visualization
- Price charts (optional)

#### 3.3 Order Management Component
**File:** `src/components/OrderManagement.jsx` (NEW)

**Features:**
- List open orders
- Cancel orders
- Order history
- Order status tracking

---

### Step 4: Integration Flow

#### Account Creation Flow
1. Admin creates client in dashboard backend
2. Admin adds exchange API keys via backend API
3. Frontend calls `tradingBridge.createAccount()` with `client_{name}`
4. Frontend calls `tradingBridge.addConnector()` with API keys
5. Account ready for trading

#### Order Placement Flow
1. User selects exchange, pair, side, quantity
2. Frontend calls `tradingBridge.getPrice()` for current price
3. User confirms order
4. Frontend calls `tradingBridge.placeOrder()`
5. Show order confirmation
6. Poll `tradingBridge.getOrders()` to show status

#### Bot Creation Flow
1. Admin selects client account
2. Admin selects strategy (market_making, grid, dca, twap, volume)
3. Admin configures bot parameters
4. Frontend calls `tradingBridge.createBot()`
5. Show bot in list with start/stop controls

---

### Step 5: Environment Variables

**File:** `.env` or Railway Variables

```env
REACT_APP_TRADING_BRIDGE_URL=https://trading-bridge-production.up.railway.app
```

---

## Implementation Priority

### Phase 1: Core Integration (High Priority)
1. ✅ Create `tradingBridge.js` service
2. ✅ Update SendOrderModal to use trading-bridge
3. ✅ Update ClientDashboard to show real balances
4. ✅ Update BotsModal to use trading-bridge

### Phase 2: Enhanced Features (Medium Priority)
5. Create BotManagement component
6. Create OrderManagement component
7. Add real-time price updates
8. Add order status polling

### Phase 3: Advanced Features (Low Priority)
9. Market data charts
10. Bot performance analytics
11. Trade history visualization
12. Strategy backtesting UI

---

## Testing Checklist

- [ ] Trading bridge service connects successfully
- [ ] Account creation works
- [ ] Connector addition works
- [ ] Price fetching works
- [ ] Order placement works
- [ ] Order cancellation works
- [ ] Portfolio/balance fetching works
- [ ] Bot creation works
- [ ] Bot start/stop works
- [ ] Error handling works
- [ ] Loading states work
- [ ] Success/error messages display correctly

---

## Next Steps

1. Create `src/services/tradingBridge.js` with all API methods
2. Update existing components to use trading-bridge
3. Test each integration point
4. Deploy and verify
