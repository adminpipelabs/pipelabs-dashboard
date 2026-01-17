# Trading Reports Feature - Documentation

## Overview

The **Trading Reports** feature allows clients to generate comprehensive performance reports with detailed metrics across different time periods. This gives traders visibility into their volume, P&L, ROI, and performance breakdowns by exchange, trading pair, and bot.

---

## ✨ Features

### 📊 **Time Period Selection**
- **24 Hours** - Intraday performance
- **7 Days** - Weekly summary
- **30 Days** - Monthly performance
- **90 Days** - Quarterly overview
- **Year to Date** - Annual tracking

### 📈 **Key Metrics Dashboard**

**Summary Cards:**
- **Total Volume** - Trading volume with % change
- **P&L** - Profit & Loss with ROI percentage
- **Total Trades** - Number of executed trades with win rate
- **Avg Trade Size** - Average and maximum trade sizes

### 📉 **Performance Breakdowns**

1. **By Exchange**
   - Volume, trades, P&L, ROI per exchange
   - Compare performance across Binance, Kraken, Coinbase, etc.

2. **By Trading Pair**
   - Detailed metrics for each pair (BTC/USD, ETH/USDT, etc.)
   - Win rate and profitability by asset

3. **By Bot**
   - Individual bot performance tracking
   - Status, volume, trades, P&L, uptime percentage

### 📄 **Export Options**
- **PDF** - Professional formatted report
- **CSV** - Raw data for Excel/analysis tools

---

## 🎯 Use Cases

### For Traders:
✅ **Track daily performance** - Monitor 24h volume and P&L  
✅ **Identify best pairs** - See which trading pairs are most profitable  
✅ **Compare exchanges** - Find the best performing exchange  
✅ **Monitor bot efficiency** - Check which bots generate highest ROI  
✅ **Export for accounting** - Download reports for tax/bookkeeping  

### For Admins:
✅ **Client performance review** - Analyze individual client results  
✅ **Platform analytics** - Aggregate data across all clients  
✅ **Compliance reporting** - Generate audit trails  

---

## 🛠️ Technical Implementation

### **Frontend (React)**

**Component:** `src/pages/Reports.jsx`

**Key Functions:**
```javascript
loadReport()           // Fetch report data for selected period
handleExport(format)   // Export report as PDF or CSV
formatCurrency()       // Format numbers as currency
formatPercentage()     // Format as percentage with +/- sign
```

**State Management:**
```javascript
period      // Selected time period (24h, 7d, etc.)
loading     // Loading indicator
error       // Error messages
reportData  // Full report data structure
```

### **Backend API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports?period={period}` | GET | Fetch report data |
| `/api/reports/export?period={period}&format={format}` | GET | Export report |

**Request Example:**
```bash
GET /api/reports?period=7d
Authorization: Bearer {jwt_token}
```

**Response Structure:**
```json
{
  "period": "7d",
  "summary": {
    "totalVolume": 1250000,
    "volumeChange": 12.5,
    "pnl": 15750,
    "roi": 1.26,
    "totalTrades": 1247,
    "winRate": 67.8,
    "avgTradeSize": 1002,
    "maxTradeSize": 15000
  },
  "byExchange": [...],
  "byPair": [...],
  "byBot": [...]
}
```

---

## 📐 UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Trading Reports          [Time Period ▼] [Export PDF] [Export CSV] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Total   │  │   P&L    │  │  Total   │  │   Avg    │       │
│  │  Volume  │  │          │  │  Trades  │  │  Trade   │       │
│  │ $1.25M   │  │ +$15.7K  │  │  1,247   │  │  $1,002  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Performance by Exchange                                 │   │
│  ├──────────┬─────────┬────────┬──────────┬────────┤       │
│  │ Exchange │ Volume  │ Trades │   P&L    │  ROI   │       │
│  ├──────────┼─────────┼────────┼──────────┼────────┤       │
│  │ Binance  │ $650K   │  687   │ +$8,500  │ +1.31% │       │
│  │ Kraken   │ $380K   │  342   │ +$4,200  │ +1.11% │       │
│  │ Coinbase │ $220K   │  218   │ +$3,050  │ +1.39% │       │
│  └──────────┴─────────┴────────┴──────────┴────────┘       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Performance by Trading Pair                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Bot Performance                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Elements

### **Color Coding:**
- 🟢 **Green** - Positive P&L, upward trends
- 🔴 **Red** - Negative P&L, downward trends
- 🔵 **Blue** - Neutral metrics, chip badges

### **Icons:**
- 📈 **TrendingUpIcon** - Positive change
- 📉 **TrendingDownIcon** - Negative change
- 💾 **DownloadIcon** - Export buttons

### **Badges:**
- Exchange names as colored chips
- Trading pairs as outlined chips
- Bot status indicators (Running/Paused)

---

## 🚀 Usage Guide

### **For Customers:**

1. **Navigate to Reports**
   - Click "Reports" in the sidebar

2. **Select Time Period**
   - Use dropdown to choose 24h, 7d, 30d, etc.
   - Report automatically refreshes

3. **Review Metrics**
   - Check summary cards for high-level overview
   - Scroll down for detailed breakdowns

4. **Compare Performance**
   - See which exchange performs best
   - Identify most profitable trading pairs
   - Monitor individual bot efficiency

5. **Export Report**
   - Click "Export PDF" for formatted report
   - Click "Export CSV" for raw data

---

## 📊 Sample Report Data

### **Summary Metrics (7 Days):**
```
Total Volume:     $1,250,000  (+12.5%)
P&L:             +$15,750    (ROI: +1.26%)
Total Trades:     1,247      (Win Rate: 67.8%)
Avg Trade Size:   $1,002     (Max: $15,000)
```

### **Top Performing Pair:**
```
BTC/USD
Volume: $580,000
Trades: 423
P&L: +$9,200
Win Rate: 72.3%
```

### **Best Bot:**
```
SpreadBot 1
Status: Running
Volume: $520,000
P&L: +$6,800
Uptime: 98.5%
```

---

## 🔧 Configuration

### **Mock Mode (Development)**

In `src/services/api.js`:
```javascript
const USE_MOCK = true;  // Uses sample data for testing
```

Mock data includes:
- Realistic metrics and trends
- Multiple exchanges, pairs, and bots
- Positive and negative P&L examples

### **Production Mode**

Set `USE_MOCK = false` to connect to real backend:
```javascript
const USE_MOCK = false;  // Connects to FastAPI backend
```

Backend must implement:
- `GET /api/reports?period={period}`
- `GET /api/reports/export?period={period}&format={format}`

---

## 📋 Backend Implementation Guide

### **Required Endpoints:**

#### 1. Get Report Data
```python
@router.get("/reports")
async def get_report(
    period: str,
    current_user: Client = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Calculate metrics for the period
    # Group by exchange, pair, bot
    # Return structured JSON
    pass
```

#### 2. Export Report
```python
@router.get("/reports/export")
async def export_report(
    period: str,
    format: str,  # 'pdf' or 'csv'
    current_user: Client = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Generate PDF or CSV
    # Return file download
    pass
```

### **Database Queries Needed:**

1. **Total Volume:**
   ```sql
   SELECT SUM(volume) FROM orders 
   WHERE client_id = ? AND timestamp >= ?
   ```

2. **P&L Calculation:**
   ```sql
   SELECT SUM(realized_pnl) FROM trades
   WHERE client_id = ? AND timestamp >= ?
   ```

3. **By Exchange:**
   ```sql
   SELECT exchange, SUM(volume), COUNT(*), SUM(pnl)
   FROM orders
   GROUP BY exchange
   ```

---

## 🎯 Future Enhancements

### **Phase 2:**
- [ ] **Interactive charts** (line graphs, bar charts)
- [ ] **Custom date range picker** (select any start/end date)
- [ ] **Real-time updates** (auto-refresh every 60s)
- [ ] **Comparison view** (compare two time periods)
- [ ] **Email scheduled reports** (daily/weekly digest)

### **Phase 3:**
- [ ] **Advanced filters** (by strategy, risk level)
- [ ] **Benchmark comparison** (vs. market indices)
- [ ] **Risk metrics** (Sharpe ratio, max drawdown)
- [ ] **Transaction-level details** (drill down to individual trades)
- [ ] **Multi-currency support** (EUR, GBP, etc.)

---

## 🐛 Troubleshooting

### **Issue: Report not loading**
- Check browser console for errors
- Verify backend is running
- Ensure user is authenticated (JWT token valid)

### **Issue: Export not working**
- Check if `reportsAPI.exportReport()` is called
- Verify backend returns proper file format
- Check browser download permissions

### **Issue: Wrong metrics displayed**
- Verify correct time period is selected
- Check if mock data matches expectations
- Review backend calculation logic

---

## 📈 Performance Considerations

### **Optimization Tips:**

1. **Cache Reports:**
   - Store recently generated reports in Redis
   - Invalidate cache on new trades

2. **Pagination:**
   - For large datasets, paginate table rows
   - Load top 10, show "Load More"

3. **Background Jobs:**
   - Pre-calculate daily reports overnight
   - Store aggregated metrics in separate table

4. **Database Indexing:**
   - Index `client_id`, `timestamp`, `exchange`
   - Create composite indexes for common queries

---

## 📊 Analytics & Metrics

Track these metrics for the Reports feature:

- **Usage:** How many reports generated per day?
- **Popular periods:** Which time period is most viewed?
- **Export frequency:** How often do users export?
- **Load time:** Average report generation time
- **Errors:** Failed report requests

---

**Built for Pipe Labs - Empowering traders with data-driven insights** 📊✨
