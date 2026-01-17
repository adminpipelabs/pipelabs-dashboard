# Admin Dashboard - Documentation

## Overview

The **Admin Dashboard** is a comprehensive multi-tenant management system for Pipe Labs administrators to oversee all clients, projects, tokens, exchanges, and platform operations from a single interface.

---

## 🎯 **Key Features**

### 📊 **Platform Overview**
- Real-time metrics across all clients
- Total clients, tokens, projects, exchanges
- Active bots and system health
- Platform-wide volume and revenue tracking

### 👥 **Client Management**
- View all clients with detailed metrics
- Add new clients with custom configurations
- Edit client settings (limits, tiers, permissions)
- Monitor client performance (volume, revenue, P&L)
- Client status management (Active/Inactive/Suspended)

### 🪙 **Token & Project Management**
- View all tokens being market made
- Add new tokens to the platform
- Assign tokens to clients and projects
- Configure trading pairs and exchanges per token
- Monitor token performance (volume, P&L, active bots)

### 📈 **Platform Analytics**
- Cross-client performance comparison
- Revenue tracking and forecasting
- System health monitoring
- Top performing clients dashboard

---

## 🖥️ **Admin Dashboard Pages**

### 1. **Admin Overview** (`/admin`)

**Purpose:** High-level platform metrics and health

**Metrics Displayed:**
- **Total Clients** - Active vs total
- **Tokens** - Number of tokens across projects
- **Exchanges** - Connected exchanges count
- **Active Bots** - Running bots vs total

**Financial Summary (30d):**
- Platform Volume
- Total Revenue
- Average Revenue per Client
- Total Trades & Average Trade Size

**Top Performing Clients:**
- Client cards showing:
  - Name, projects, tokens
  - Volume & revenue
  - Active bots status

**System Health:**
- API Server status & uptime
- Database health
- Redis Cache status
- Claude API connectivity

---

### 2. **Client Management** (`/admin/clients`)

**Purpose:** Manage all client accounts and configurations

**Features:**
- **Client List Table**
  - Name, Email, Status, Tier
  - Projects, Tokens count
  - Volume & Revenue (30d)
  - Edit/View actions

- **Add/Edit Client Dialog**
  - Client name & email
  - Status (Active/Inactive/Suspended)
  - Tier (Basic/Standard/Premium/Enterprise)
  - Trading Limits:
    - Max Spread (%)
    - Max Daily Volume ($)

**Client Tiers:**
```
Basic       - Entry level, basic features
Standard    - Standard features, moderate limits
Premium     - Advanced features, higher limits
Enterprise  - Full features, custom limits
```

---

### 3. **Token Management** (`/admin/tokens`)

**Purpose:** Manage all tokens and market making projects

**Features:**
- **Token List Table**
  - Token symbol & name with avatar
  - Assigned client & project
  - Connected exchanges (chips)
  - Trading pairs (chips)
  - Volume (30d) with % change
  - P&L (30d)
  - Active bots count
  - Status

- **Add Token Dialog**
  - Token Symbol (e.g., BTC, ETH)
  - Token Name (e.g., Bitcoin, Ethereum)
  - Assign to Client (dropdown)
  - Project Name
  - Select Exchanges (multi-select)
  - Trading Pairs (comma-separated)
  - Status (Active/Inactive)

---

## 📊 **Sample Data Structure**

### **Admin Dashboard Metrics:**
```json
{
  "metrics": {
    "totalClients": 24,
    "activeClients": 21,
    "totalTokens": 47,
    "totalProjects": 32,
    "totalExchanges": 5,
    "activeBots": 89,
    "totalBots": 112
  },
  "financial": {
    "totalVolume": 15750000,
    "totalRevenue": 126000,
    "avgRevenuePerClient": 5250,
    "totalTrades": 45230,
    "avgTradeSize": 348
  }
}
```

### **Client Object:**
```json
{
  "id": "1",
  "name": "Acme Corp",
  "email": "contact@acmecorp.com",
  "status": "Active",
  "tier": "Enterprise",
  "projects": 5,
  "tokens": 8,
  "volume": 3500000,
  "revenue": 28000,
  "settings": {
    "maxSpread": 0.5,
    "maxDailyVolume": 100000
  }
}
```

### **Token Object:**
```json
{
  "id": "1",
  "symbol": "BTC",
  "name": "Bitcoin",
  "client": "Acme Corp",
  "project": "Bitcoin Market Making",
  "exchanges": ["Binance", "Kraken", "Coinbase"],
  "tradingPairs": ["BTC/USD", "BTC/USDT", "BTC/EUR"],
  "volume": 8500000,
  "volumeChange": 12.5,
  "pnl": 68000,
  "activeBots": 6,
  "status": "Active"
}
```

---

## 🚀 **Usage Guide**

### **For Administrators:**

#### **1. Access Admin Dashboard**
- Login with **admin** role
- See "Admin" section appear in sidebar (below regular menu)
- Click "Admin Overview" to see platform metrics

#### **2. Add a New Client**
1. Navigate to **Client Management**
2. Click **"Add Client"** button
3. Fill in:
   - Client name
   - Email address
   - Status (Active)
   - Tier (Standard/Premium/etc.)
   - Max Spread % (e.g., 0.5%)
   - Max Daily Volume $ (e.g., $50,000)
4. Click **"Create"**

#### **3. Add a New Token/Project**
1. Navigate to **Token Management**
2. Click **"Add Token"** button
3. Fill in:
   - Token Symbol (BTC, ETH, etc.)
   - Token Name
   - Assign to Client (dropdown)
   - Project Name
   - Select Exchanges (Binance, Kraken, etc.)
   - Trading Pairs (BTC/USD, BTC/USDT, etc.)
   - Status (Active)
4. Click **"Add Token"**

#### **4. Edit Existing Client**
1. Navigate to **Client Management**
2. Click the **Edit icon** (pencil) next to client
3. Modify any settings
4. Click **"Update"**

#### **5. Monitor Platform Health**
1. Go to **Admin Overview**
2. Check **System Health** section
3. Verify all services show "Healthy" status
4. Review uptime percentages

---

## 🎨 **UI Components**

### **Color Coding:**
- 🟢 **Green** - Active, Healthy, Positive metrics
- 🔴 **Red** - Inactive, Error, Negative metrics
- 🟡 **Yellow/Orange** - Warning, Suspended
- 🔵 **Blue** - Information, Neutral

### **Status Badges:**
- **Active** (green) - Operational
- **Inactive** (gray) - Not active
- **Suspended** (red) - Suspended access
- **Healthy** (green) - System OK

### **Tier Badges:**
- Basic, Standard, Premium, Enterprise

---

## 🔐 **Access Control**

### **Admin-Only Features:**
- Only users with `role: 'admin'` can access
- Regular users don't see Admin menu items
- Admin routes are protected by role check

### **Backend Validation:**
When connecting to real backend, ensure:
```python
@router.get("/admin/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_current_admin_user)  # Admin check
):
    # Only admins can access
    pass
```

---

## 📋 **Backend API Requirements**

### **Endpoints Needed:**

```python
# Admin Dashboard
GET  /api/admin/dashboard              # Platform overview metrics
GET  /api/admin/clients                # List all clients
POST /api/admin/clients                # Create new client
PUT  /api/admin/clients/{id}           # Update client
GET  /api/admin/clients/{id}           # Get client details

# Token Management
GET  /api/admin/tokens                 # List all tokens
POST /api/admin/tokens                 # Add new token
PUT  /api/admin/tokens/{id}            # Update token
DELETE /api/admin/tokens/{id}          # Remove token

# System Health
GET  /api/admin/system/health          # System health status
GET  /api/admin/analytics              # Platform analytics
```

---

## 🎯 **Use Cases**

### **Onboard New Client:**
1. Admin creates client account with tier
2. Sets trading limits (spread, volume)
3. Admin adds tokens for the client
4. Assigns exchanges and trading pairs
5. Client logs in and starts trading

### **Monitor Platform Performance:**
1. Admin checks overview dashboard
2. Reviews total volume and revenue
3. Identifies top performing clients
4. Checks system health
5. Makes decisions on scaling/resources

### **Adjust Client Limits:**
1. Admin reviews client performance
2. Opens client edit dialog
3. Increases max daily volume
4. Upgrades tier if needed
5. Saves changes

### **Add New Token to Platform:**
1. Client requests new token support
2. Admin navigates to Token Management
3. Creates new token entry
4. Assigns to client's project
5. Configures exchanges and pairs
6. Activates token

---

## 📊 **Metrics & KPIs**

### **Platform Health Indicators:**
- **Client Growth Rate** - New clients per month
- **Platform Volume** - Total trading volume
- **Revenue** - Platform earnings
- **Active Bots Ratio** - Active vs total bots
- **System Uptime** - Service availability %

### **Client Health Indicators:**
- **Volume per Client** - Trading activity
- **Revenue per Client** - Profitability
- **Token Count** - Diversification
- **Bot Utilization** - Efficiency

---

## 🔧 **Configuration**

### **Mock Mode (Development):**
In `src/services/api.js`:
```javascript
const USE_MOCK = true;  // Uses sample data
```

**Mock data includes:**
- 5 sample clients
- 5 sample tokens
- Realistic metrics and trends
- System health statuses

### **Production Mode:**
```javascript
const USE_MOCK = false;  // Connects to real API
```

---

## 🎨 **Visual Layout**

```
┌─────────────────────────────────────────────────────────────┐
│  Platform Overview                                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Total   │  │  Tokens  │  │ Exchange │  │  Active  │  │
│  │ Clients  │  │    47    │  │    5     │  │  Bots    │  │
│  │    24    │  │          │  │          │  │    89    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Top Performing Clients                              │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │  Acme Corp    TechStart Inc    CryptoVentures       │ │
│  │  $3.5M vol    $2.8M vol        $2.2M vol            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  System Health                                       │ │
│  │  [API: Healthy] [DB: Healthy] [Redis: Healthy]      │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Future Enhancements**

### **Phase 2:**
- [ ] Client activity timeline
- [ ] Revenue forecasting charts
- [ ] Client tier upgrade workflows
- [ ] Bulk operations (multi-client actions)
- [ ] Advanced filtering & search

### **Phase 3:**
- [ ] Client notifications system
- [ ] Automated alerts for anomalies
- [ ] Audit logs (who changed what)
- [ ] Client performance reports (auto-generated)
- [ ] API usage tracking per client

---

## 🐛 **Troubleshooting**

### **Issue: Admin menu not showing**
- Ensure logged in as **admin** role
- Check `user.role === 'admin'` in browser console
- Verify AuthContext has correct role

### **Issue: Can't add client**
- Check form validation (all required fields)
- Verify backend endpoint is working
- Check browser console for errors

### **Issue: Metrics not loading**
- Check `adminAPI.getDashboard()` call
- Verify mock mode is enabled or backend is running
- Check network tab for API errors

---

## 📞 **Support**

For questions or issues:
- **UI Issues:** Check browser console and network tab
- **Backend Issues:** Review FastAPI logs
- **Data Issues:** Verify database queries and permissions

---

**Built for Pipe Labs - Empowering administrators to scale multi-tenant trading operations** 🚀
