# Trading Bridge UI Integration Plan

## Current State ✅

**ai-trading-ui** already has:
- ✅ `tradingBridge` service with basic methods:
  - `getStatus()`
  - `getSupportedExchanges()`
  - `addConnector()`
  - `getPortfolio()`
  - `getPrice()`

**trading-bridge** provides:
- ✅ Accounts management
- ✅ Connectors (exchanges)
- ✅ Market data (prices, orderbooks)
- ✅ Orders (place, cancel, list)
- ✅ Portfolio (balances, history)
- ✅ Bots & Strategies (create, start, stop, manage)

---

## Integration Plan

### Phase 1: Complete Trading Bridge API Service

**File:** `src/services/api.js` - Extend `tradingBridge` object

**Add Missing Methods:**

```javascript
export const tradingBridge = {
  // ... existing methods ...
  
  // Accounts
  async createAccount(accountName) {
    return apiCall(`${TRADING_BRIDGE_URL}/accounts/create`, {
      method: 'POST',
      body: JSON.stringify({ account_name: accountName }),
    });
  },
  
  async getAccounts() {
    return apiCall(`${TRADING_BRIDGE_URL}/accounts`);
  },
  
  async getAccount(name) {
    return apiCall(`${TRADING_BRIDGE_URL}/accounts/${name}`);
  },
  
  // Orders
  async getOrders(account, pair = null) {
    const params = new URLSearchParams({ account });
    if (pair) params.append('pair', pair);
    return apiCall(`${TRADING_BRIDGE_URL}/orders?${params}`);
  },
  
  async placeOrder(orderData) {
    return apiCall(`${TRADING_BRIDGE_URL}/orders/place`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  
  async cancelOrder(accountName, orderId, connectorName = null) {
    return apiCall(`${TRADING_BRIDGE_URL}/orders/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        account_name: accountName,
        order_id: orderId,
        connector_name: connectorName,
      }),
    });
  },
  
  // Trade History
  async getTradeHistory(account, pair = null) {
    const params = new URLSearchParams({ account });
    if (pair) params.append('pair', pair);
    return apiCall(`${TRADING_BRIDGE_URL}/history?${params}`);
  },
  
  // Order Book
  async getOrderBook(connector, pair) {
    return apiCall(`${TRADING_BRIDGE_URL}/market/orderbook?connector=${connector}&pair=${encodeURIComponent(pair)}`);
  },
  
  // Bots
  async listBots() {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/bots`);
  },
  
  async getBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/bots/${botId}`);
  },
  
  async createBot(botData) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/create`, {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  },
  
  async startBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/start`, { method: 'POST' });
  },
  
  async stopBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/stop`, { method: 'POST' });
  },
  
  async updateBot(botId, config) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/update`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
  
  async deleteBot(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}`, { method: 'DELETE' });
  },
  
  async getBotStatus(botId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/${botId}/status`);
  },
  
  async getStrategies() {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/strategies`);
  },
  
  async getStrategy(strategyId) {
    return apiCall(`${TRADING_BRIDGE_URL}/bots/strategies/${strategyId}`);
  },
};
```

---

### Phase 2: Update Existing Components

#### 2.1 Send Order Modal
**File:** `src/components/SendOrderModal.jsx` (if exists)

**Current:** Placeholder alert  
**Update:** Use `tradingBridge.placeOrder()`

```javascript
const handleSubmit = async () => {
  const accountName = `client_${clientName.toLowerCase().replace(' ', '_')}`;
  
  const orderData = {
    account_name: accountName,
    connector_name: formData.exchange.toLowerCase(),
    trading_pair: formData.trading_pair,
    side: formData.side.toLowerCase(),
    order_type: formData.order_type.toLowerCase(),
    amount: parseFloat(formData.quantity),
    price: formData.order_type === 'LIMIT' ? parseFloat(formData.price) : null,
  };
  
  try {
    const result = await tradingBridge.placeOrder(orderData);
    // Show success message
    alert(`Order placed! Order ID: ${result.order_id}`);
    onSuccess?.();
    onClose();
  } catch (error) {
    setError(error.message);
  }
};
```

#### 2.2 Bots Modal
**File:** `src/components/BotsModal.jsx` (if exists)

**Update:** Use `tradingBridge.createBot()` and `tradingBridge.getStrategies()`

```javascript
// Fetch available strategies
const loadStrategies = async () => {
  const strategies = await tradingBridge.getStrategies();
  setStrategies(strategies);
};

// Create bot
const handleCreateBot = async () => {
  const accountName = `client_${clientName.toLowerCase().replace(' ', '_')}`;
  
  const botData = {
    name: formData.bot_name,
    account: accountName,
    strategy: formData.strategy,
    connector: formData.exchange.toLowerCase(),
    pair: formData.trading_pair,
    config: {
      spread_target: parseFloat(formData.spread_target),
      volume_target_daily: parseFloat(formData.volume_target_daily),
      // ... other config
    },
  };
  
  await tradingBridge.createBot(botData);
};
```

#### 2.3 Client Dashboard
**File:** `src/pages/ClientDashboard.jsx`

**Add Real Data:**
```javascript
// Fetch balances
const loadBalances = async () => {
  const accountName = `client_${clientName.toLowerCase().replace(' ', '_')}`;
  const portfolio = await tradingBridge.getPortfolio(accountName);
  setBalances(portfolio.balances);
};

// Fetch orders
const loadOrders = async () => {
  const accountName = `client_${clientName.toLowerCase().replace(' ', '_')}`;
  const orders = await tradingBridge.getOrders(accountName);
  setOrders(orders.orders);
};

// Fetch trade history
const loadTradeHistory = async () => {
  const accountName = `client_${clientName.toLowerCase().replace(' ', '_')}`;
  const history = await tradingBridge.getTradeHistory(accountName);
  setTradeHistory(history.trades);
};
```

---

### Phase 3: New Components

#### 3.1 Bot Management Component
**File:** `src/components/BotManagement.jsx` (NEW)

**Features:**
- List all bots with status
- Start/Stop/Delete actions
- Bot performance metrics
- Strategy configuration editor

#### 3.2 Order Management Component  
**File:** `src/components/OrderManagement.jsx` (NEW)

**Features:**
- Display open orders table
- Cancel order button
- Order status indicators
- Order history

#### 3.3 Market Data Widget
**File:** `src/components/MarketDataWidget.jsx` (NEW)

**Features:**
- Real-time price display
- Price change indicators
- Order book depth chart
- 24h volume

---

### Phase 4: Integration Flow

#### Account Setup Flow
1. Admin creates client → Backend stores client
2. Admin adds API keys → Backend stores encrypted keys
3. Frontend calls `tradingBridge.createAccount('client_{name}')`
4. Frontend calls `tradingBridge.addConnector()` with decrypted keys
5. Account ready for trading

#### Order Flow
1. User fills SendOrderModal form
2. Frontend calls `tradingBridge.getPrice()` for current price (optional)
3. User confirms → `tradingBridge.placeOrder()`
4. Show order confirmation
5. Poll `tradingBridge.getOrders()` to show in OrderManagement

#### Bot Flow
1. Admin selects client account
2. Admin selects strategy from `tradingBridge.getStrategies()`
3. Admin configures bot parameters
4. Frontend calls `tradingBridge.createBot()`
5. Bot appears in BotManagement with start/stop controls

---

## Implementation Checklist

### Step 1: API Service ✅
- [x] Basic tradingBridge methods exist
- [ ] Add missing methods (accounts, orders, bots, history)
- [ ] Test all API calls

### Step 2: Order Integration
- [ ] Update SendOrderModal to use `tradingBridge.placeOrder()`
- [ ] Create OrderManagement component
- [ ] Add order status polling
- [ ] Add cancel order functionality

### Step 3: Bot Integration
- [ ] Update BotsModal to use `tradingBridge.createBot()`
- [ ] Fetch strategies from `tradingBridge.getStrategies()`
- [ ] Create BotManagement component
- [ ] Add start/stop/delete bot functionality

### Step 4: Portfolio Integration
- [ ] Update ClientDashboard to use `tradingBridge.getPortfolio()`
- [ ] Add real-time balance updates
- [ ] Add trade history display
- [ ] Add order history display

### Step 5: Market Data
- [ ] Add real-time price display
- [ ] Add order book visualization
- [ ] Add price change indicators

---

## Next Steps

1. **Extend `tradingBridge` service** with all missing methods
2. **Update SendOrderModal** to place real orders
3. **Update BotsModal** to create real bots
4. **Create BotManagement component** for bot control
5. **Create OrderManagement component** for order tracking
6. **Update ClientDashboard** with real data

Would you like me to start implementing any of these?
