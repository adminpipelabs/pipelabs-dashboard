# MCP Integration Analysis & Implementation Plan

## Current Architecture vs. MCP Flow

### What We Have Now

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Web UI (React) │────►│  FastAPI Backend │────►│ Trading Bridge  │
│                 │     │                  │     │   (ccxt-based)  │
│  - Admin Panel  │     │  - REST API      │     │                 │
│  - Client Dash  │     │  - JWT Auth      │     │  - Accounts     │
│  - Forms/Modals │     │  - Scoped Agent  │     │  - Connectors   │
└─────────────────┘     └──────────────────┘     │  - Orders       │
                                                   │  - Portfolio    │
                                                   │  - Bots        │
                                                   └────────┬────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │   Exchanges     │
                                                   │  (BitMart, etc) │
                                                   └─────────────────┘
```

### What MCP Would Add

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Claude Desktop  │────►│   MCP Server      │────►│ Trading Bridge   │
│                 │     │  (Python)         │     │   (ccxt-based)   │
│  Natural Lang   │     │                   │     │                  │
│  Commands       │     │  - Tool Wrapper   │     │  - Same backend │
└─────────────────┘     │  - Validation     │     │  - Same data    │
                         │  - Scoping        │     └─────────────────┘
                         └───────────────────┘
```

## Key Differences: Trading Bridge vs. Hummingbot

| Aspect | Trading Bridge (What We Have) | Hummingbot (MCP Doc) |
|--------|-------------------------------|----------------------|
| **Purpose** | Direct exchange connection via ccxt | Advanced trading bot platform |
| **Architecture** | FastAPI + ccxt library | Docker containers + bot strategies |
| **Use Case** | Simple orders, balances, market data | Complex strategies, market making, arbitrage |
| **Setup** | ✅ Already deployed | ❌ Would need separate setup |
| **API Style** | REST API | REST API + MCP Server |
| **Bot Management** | Basic bot CRUD | Advanced strategy execution |

## Should We Integrate MCP?

### ✅ YES - Benefits

1. **Natural Language Trading**
   - Users can say "check SHARP balance" instead of clicking through UI
   - Faster for power users
   - Better UX for non-technical clients

2. **Complements Existing UI**
   - Web UI for visual management
   - MCP for quick commands via Claude Desktop
   - Both use same Trading Bridge backend

3. **Scoped Access Already Built**
   - We already have `ScopedAgentService` with client isolation
   - MCP tools can reuse same scoping logic
   - Security model already in place

4. **Future-Proof**
   - MCP is Anthropic's standard
   - Easy to add more tools later
   - Can integrate Hummingbot later if needed

### ⚠️ Considerations

1. **Trading Bridge vs. Hummingbot**
   - MCP doc describes Hummingbot MCP Server
   - We use Trading Bridge (ccxt-based)
   - **Solution**: Create MCP server that wraps Trading Bridge

2. **Additional Complexity**
   - Need to maintain MCP server
   - Claude Desktop dependency
   - But minimal - just a protocol wrapper

3. **Current Issues First**
   - Fix balances/orders first
   - Then add MCP as enhancement
   - MCP won't fix underlying connector issues

## Recommended Approach

### Phase 1: Fix Current Issues (NOW)
- ✅ Fix order placement (DONE)
- ✅ Fix balance fetching (DONE)
- ✅ Ensure Trading Bridge connectors initialize properly
- ✅ Test end-to-end flow

### Phase 2: Create Trading Bridge MCP Server (NEXT)

Create an MCP server that exposes Trading Bridge as MCP tools:

```python
# backend/mcp_server/trading_bridge_mcp.py

from mcp.server import Server
from mcp.types import Tool, TextContent
import httpx

server = Server("trading-bridge")

@server.tool()
async def get_portfolio_overview(
    account_name: str,
    connector_names: list[str] = None
) -> dict:
    """Get portfolio balances and active orders"""
    # Call Trading Bridge /portfolio endpoint
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TRADING_BRIDGE_URL}/portfolio",
            params={"account": account_name}
        )
        return response.json()

@server.tool()
async def place_order(
    account_name: str,
    connector_name: str,
    trading_pair: str,
    side: str,
    order_type: str,
    amount: float,
    price: float = None
) -> dict:
    """Place a trading order"""
    # Call Trading Bridge /orders/place endpoint
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{TRADING_BRIDGE_URL}/orders/place",
            json={
                "account_name": account_name,
                "connector_name": connector_name,
                "trading_pair": trading_pair,
                "side": side.lower(),
                "order_type": order_type.lower(),
                "amount": amount,
                "price": price
            }
        )
        return response.json()

@server.tool()
async def get_prices(
    connector_name: str,
    trading_pairs: list[str]
) -> dict:
    """Get current prices for trading pairs"""
    # Call Trading Bridge /market/price endpoint
    prices = {}
    async with httpx.AsyncClient() as client:
        for pair in trading_pairs:
            response = await client.get(
                f"{TRADING_BRIDGE_URL}/market/price",
                params={"connector": connector_name, "pair": pair}
            )
            prices[pair] = response.json()
    return prices

# ... more tools
```

### Phase 3: Scoped MCP Server (ADVANCED)

Create client-specific MCP servers with scoping:

```python
# Each client gets their own MCP server instance
# Scoped to their account, exchanges, pairs

def create_scoped_mcp_server(client_scope: ClientScope):
    server = Server(f"trading-bridge-{client_scope.client_id}")
    
    @server.tool()
    async def get_portfolio_overview(...):
        # Validate account_name is in client_scope.allowed_accounts
        if account_name not in client_scope.allowed_accounts:
            raise PermissionError("Account not allowed")
        # ... rest of implementation
    
    return server
```

## Implementation Plan

### Step 1: Install MCP SDK

```bash
pip install mcp
```

### Step 2: Create MCP Server Module

**File:** `backend/app/mcp_server/__init__.py`
**File:** `backend/app/mcp_server/trading_bridge_tools.py`

### Step 3: Expose Trading Bridge as MCP Tools

Map Trading Bridge endpoints to MCP tools:
- `GET /portfolio` → `get_portfolio_overview`
- `POST /orders/place` → `place_order`
- `GET /market/price` → `get_prices`
- `GET /orders` → `get_open_orders`
- `POST /bots/create` → `create_bot`
- etc.

### Step 4: Claude Desktop Configuration

Users configure Claude Desktop to connect to our MCP server:

```json
{
  "mcpServers": {
    "pipelabs-trading": {
      "command": "python",
      "args": ["-m", "app.mcp_server.trading_bridge_mcp"],
      "env": {
        "TRADING_BRIDGE_URL": "https://trading-bridge-production.up.railway.app",
        "DATABASE_URL": "..."
      }
    }
  }
}
```

### Step 5: Test Flow

1. User opens Claude Desktop
2. Claude connects to MCP server
3. User: "Check my SHARP balance"
4. Claude calls `get_portfolio_overview(account_name="client_sharp")`
5. Returns formatted response

## Will MCP Solve Current Issues?

### ❌ NO - MCP Won't Fix These:
- **Balances showing $0**: This is a Trading Bridge connector initialization issue
- **Orders failing**: This is an API endpoint/connector matching issue
- **API keys not active**: This is a connector setup issue

### ✅ YES - MCP Will Enable:
- **Natural language trading**: "Place a buy order for 2000 SHARP at $0.008"
- **Quick balance checks**: "What's my balance?"
- **Bot management**: "Start the SHARP spread bot"
- **Better UX**: Power users can use Claude Desktop instead of web UI

## Recommendation

**Priority Order:**

1. **NOW**: Fix current issues (orders, balances) ✅ Mostly done
2. **NEXT**: Verify Trading Bridge connectors work end-to-end
3. **THEN**: Add MCP server as enhancement layer
4. **FUTURE**: Consider Hummingbot integration if advanced strategies needed

**MCP is a UX enhancement, not a fix for underlying issues.**

## Next Steps

1. ✅ Fix order placement (DONE)
2. ✅ Fix balance fetching (DONE)
3. ⏳ Test with real API keys
4. ⏳ Verify connectors initialize
5. ⏳ Then add MCP server

Would you like me to:
- **A)** Create the MCP server now (while we test current fixes)
- **B)** Wait until current issues are resolved
- **C)** Create a proof-of-concept MCP server to test
