/**
 * API Service Layer
 * Centralized API calls to the FastAPI backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app';
// Mock mode toggle (set to false when backend is connected)
const USE_MOCK = false;

/**
 * Generic API call wrapper
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('access_token'); // JWT token - matches Login.jsx
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to extract error message from response
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        const text = await response.text().catch(() => '');
        if (text) errorMessage = text.substring(0, 200);
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = response;
      console.error('❌ API call failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ API call failed:', {
      url,
      error: error.message,
      status: error.status
    });
    throw error;
  }
}

/**
 * Admin API calls
 */
export const adminAPI = {
  /**
   * Get admin dashboard overview
   */
  async getDashboard() {
    return apiCall('/api/admin/overview');
  },

  async getClients() {
    return apiCall('/api/admin/clients');
  },

  async getClient(clientId) {
    return apiCall(`/api/admin/clients/${clientId}`);
  },

  async createClient(data) {
    return apiCall('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(clientId, data) {
    return apiCall(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  // API Keys Management
  async getClientAPIKeys(clientId) {
    return apiCall(`/api/admin/clients/${clientId}/api-keys`);
  },

  async addClientAPIKey(clientId, data) {
    return apiCall(`/api/admin/clients/${clientId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClientAPIKey(clientId, keyId, data) {
    return apiCall(`/api/admin/clients/${clientId}/api-keys/${keyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteClientAPIKey(clientId, keyId) {
    return apiCall(`/api/admin/clients/${clientId}/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  },

  // Trading Pairs / Bots Management
  async getClientPairs(clientId) {
    return apiCall(`/api/admin/clients/${clientId}/pairs`);
  },

  async createPair(clientId, data) {
    return apiCall(`/api/admin/clients/${clientId}/pairs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePair(pairId, data) {
    return apiCall(`/api/admin/pairs/${pairId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deletePair(pairId) {
    return apiCall(`/api/admin/pairs/${pairId}`, {
      method: 'DELETE',
    });
  },

  async sendOrder(clientId, orderData) {
    return apiCall(`/api/admin/clients/${clientId}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Trading Bridge Diagnostics
  async getTradingBridgeHealth() {
    return apiCall('/api/diagnostics/health');
  },

  async getClientTradingBridgeStatus(clientId) {
    return apiCall(`/api/diagnostics/clients/${clientId}/status`);
  },

  async reinitializeClientConnectors(clientId) {
    return apiCall(`/api/diagnostics/clients/${clientId}/reinitialize`, {
      method: 'POST',
    });
  },

  async getDashboard() {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        metrics: {
          totalClients: 24,
          activeClients: 21,
          totalTokens: 47,
          totalProjects: 32,
          totalExchanges: 5,
          activeBots: 89,
          totalBots: 112
        },
        financial: {
          totalVolume: 15750000,
          volumeChange: 18.5,
          totalRevenue: 126000,
          avgRevenuePerClient: 5250,
          totalTrades: 45230,
          avgTradeSize: 348
        },
        topClients: [
          {
            name: 'Acme Corp',
            projects: 5,
            tokens: 8,
            status: 'Active',
            volume: 3500000,
            revenue: 28000,
            activeBots: 15,
            totalBots: 18
          },
          {
            name: 'TechStart Inc',
            projects: 3,
            tokens: 6,
            status: 'Active',
            volume: 2800000,
            revenue: 22400,
            activeBots: 12,
            totalBots: 14
          },
          {
            name: 'CryptoVentures',
            projects: 4,
            tokens: 7,
            status: 'Active',
            volume: 2200000,
            revenue: 17600,
            activeBots: 10,
            totalBots: 12
          }
        ],
        systemHealth: [
          { service: 'API Server', status: 'Healthy', uptime: '99.9%' },
          { service: 'Database', status: 'Healthy', uptime: '99.8%' },
          { service: 'Redis Cache', status: 'Healthy', uptime: '100%' },
          { service: 'Claude API', status: 'Healthy', uptime: '99.5%' }
        ]
      };
    }
    return apiCall('/api/admin/dashboard');
  },

  /**
   * Get all clients
   */
  async getClients() {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return [
        {
          id: '1',
          name: 'Acme Corp',
          email: 'contact@acmecorp.com',
          status: 'Active',
          tier: 'Enterprise',
          projects: 5,
          tokens: 8,
          volume: 3500000,
          revenue: 28000,
          settings: { maxSpread: 0.5, maxDailyVolume: 100000 }
        },
        {
          id: '2',
          name: 'TechStart Inc',
          email: 'info@techstart.io',
          status: 'Active',
          tier: 'Premium',
          projects: 3,
          tokens: 6,
          volume: 2800000,
          revenue: 22400,
          settings: { maxSpread: 0.4, maxDailyVolume: 75000 }
        },
        {
          id: '3',
          name: 'CryptoVentures',
          email: 'team@cryptoventures.com',
          status: 'Active',
          tier: 'Standard',
          projects: 4,
          tokens: 7,
          volume: 2200000,
          revenue: 17600,
          settings: { maxSpread: 0.6, maxDailyVolume: 50000 }
        },
        {
          id: '4',
          name: 'DeFi Protocol',
          email: 'hello@defiprotocol.org',
          status: 'Active',
          tier: 'Premium',
          projects: 2,
          tokens: 5,
          volume: 1800000,
          revenue: 14400,
          settings: { maxSpread: 0.5, maxDailyVolume: 60000 }
        },
        {
          id: '5',
          name: 'BlockChain Solutions',
          email: 'contact@blockchainsol.com',
          status: 'Inactive',
          tier: 'Basic',
          projects: 1,
          tokens: 2,
          volume: 450000,
          revenue: 3600,
          settings: { maxSpread: 0.8, maxDailyVolume: 25000 }
        }
      ];
    }
    return apiCall('/api/admin/clients');
  },

  /**
   * Create new client
   */
  async createClient(clientData) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Client created successfully' };
    }
    return apiCall('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  },

  /**
   * Update client
   */
  async updateClient(clientId, clientData) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Client updated successfully' };
    }
    return apiCall(`/api/admin/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  },

  /**
   * Get all tokens
   */
  async getTokens() {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return [
        {
          id: '1',
          symbol: 'BTC',
          name: 'Bitcoin',
          client: 'Acme Corp',
          project: 'Bitcoin Market Making',
          exchanges: ['Binance', 'Kraken', 'Coinbase'],
          tradingPairs: ['BTC/USD', 'BTC/USDT', 'BTC/EUR'],
          volume: 8500000,
          volumeChange: 12.5,
          pnl: 68000,
          activeBots: 6,
          status: 'Active'
        },
        {
          id: '2',
          symbol: 'ETH',
          name: 'Ethereum',
          client: 'TechStart Inc',
          project: 'ETH Liquidity',
          exchanges: ['Binance', 'Coinbase'],
          tradingPairs: ['ETH/USD', 'ETH/USDT'],
          volume: 4200000,
          volumeChange: 8.3,
          pnl: 33600,
          activeBots: 4,
          status: 'Active'
        },
        {
          id: '3',
          symbol: 'SOL',
          name: 'Solana',
          client: 'CryptoVentures',
          project: 'Solana MM',
          exchanges: ['Binance', 'Kraken'],
          tradingPairs: ['SOL/USD', 'SOL/USDT'],
          volume: 1800000,
          volumeChange: -3.2,
          pnl: 14400,
          activeBots: 3,
          status: 'Active'
        },
        {
          id: '4',
          symbol: 'AVAX',
          name: 'Avalanche',
          client: 'DeFi Protocol',
          project: 'Avalanche Trading',
          exchanges: ['Binance'],
          tradingPairs: ['AVAX/USD', 'AVAX/USDT'],
          volume: 950000,
          volumeChange: 15.7,
          pnl: 7600,
          activeBots: 2,
          status: 'Active'
        },
        {
          id: '5',
          symbol: 'MATIC',
          name: 'Polygon',
          client: 'CryptoVentures',
          project: 'Polygon Liquidity',
          exchanges: ['Binance', 'Coinbase'],
          tradingPairs: ['MATIC/USD', 'MATIC/USDT'],
          volume: 1200000,
          volumeChange: 6.8,
          pnl: 9600,
          activeBots: 3,
          status: 'Active'
        }
      ];
    }
    return apiCall('/api/admin/tokens');
  },

  /**
   * Create new token
   */
  async createToken(tokenData) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Token added successfully' };
    }
    return apiCall('/api/admin/tokens', {
      method: 'POST',
      body: JSON.stringify(tokenData)
    });
  },

  /**
   * Get detailed client view with all their data
   */
  async getClientDetail(clientId) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock detailed client data
      const clientDataMap = {
        '1': {
          client: {
            id: '1',
            name: 'Acme Corp',
            email: 'contact@acmecorp.com',
            status: 'Active',
            tier: 'Enterprise',
            projects: 5,
            tokens: 8,
            settings: {
              maxSpread: 0.5,
              maxDailyVolume: 100000
            }
          },
          metrics: {
            portfolioValue: 3850000,
            pnl: 68000,
            volume: 3500000,
            activeBots: 15,
            totalBots: 18
          },
          tradingPairs: [
            {
              pair: 'BTC/USD',
              exchange: 'Binance',
              token: 'BTC',
              volume: 1200000,
              pnl: 24000,
              activeBots: 4,
              status: 'Active'
            },
            {
              pair: 'ETH/USDT',
              exchange: 'Binance',
              token: 'ETH',
              volume: 850000,
              pnl: 17000,
              activeBots: 3,
              status: 'Active'
            },
            {
              pair: 'BTC/EUR',
              exchange: 'Kraken',
              token: 'BTC',
              volume: 680000,
              pnl: 13600,
              activeBots: 3,
              status: 'Active'
            },
            {
              pair: 'SOL/USD',
              exchange: 'Coinbase',
              token: 'SOL',
              volume: 420000,
              pnl: 8400,
              activeBots: 2,
              status: 'Active'
            },
            {
              pair: 'AVAX/USDT',
              exchange: 'Binance',
              token: 'AVAX',
              volume: 350000,
              pnl: 5000,
              activeBots: 3,
              status: 'Active'
            }
          ],
          bots: [
            {
              name: 'BTC-SpreadBot-1',
              pair: 'BTC/USD',
              exchange: 'Binance',
              status: 'Running',
              volume: 45000,
              pnl: 900,
              uptime: 99.2
            },
            {
              name: 'BTC-SpreadBot-2',
              pair: 'BTC/USD',
              exchange: 'Binance',
              status: 'Running',
              volume: 38000,
              pnl: 760,
              uptime: 98.8
            },
            {
              name: 'ETH-VolumeBot-1',
              pair: 'ETH/USDT',
              exchange: 'Binance',
              status: 'Running',
              volume: 32000,
              pnl: 640,
              uptime: 99.5
            },
            {
              name: 'BTC-ArbitrageBot',
              pair: 'BTC/EUR',
              exchange: 'Kraken',
              status: 'Running',
              volume: 28000,
              pnl: 560,
              uptime: 97.3
            },
            {
              name: 'SOL-MarketMaker',
              pair: 'SOL/USD',
              exchange: 'Coinbase',
              status: 'Paused',
              volume: 15000,
              pnl: 300,
              uptime: 95.1
            }
          ],
          recentOrders: [
            {
              id: 'ORD-45821',
              pair: 'BTC/USD',
              side: 'Buy',
              type: 'Limit',
              amount: '0.5 BTC',
              price: 42350,
              status: 'Filled',
              time: '2 min ago'
            },
            {
              id: 'ORD-45820',
              pair: 'ETH/USDT',
              side: 'Sell',
              type: 'Limit',
              amount: '5.2 ETH',
              price: 2240,
              status: 'Filled',
              time: '5 min ago'
            },
            {
              id: 'ORD-45819',
              pair: 'BTC/USD',
              side: 'Sell',
              type: 'Market',
              amount: '0.3 BTC',
              price: 42380,
              status: 'Filled',
              time: '8 min ago'
            },
            {
              id: 'ORD-45818',
              pair: 'SOL/USD',
              side: 'Buy',
              type: 'Limit',
              amount: '120 SOL',
              price: 98,
              status: 'Partial',
              time: '12 min ago'
            },
            {
              id: 'ORD-45817',
              pair: 'BTC/EUR',
              side: 'Buy',
              type: 'Limit',
              amount: '0.4 BTC',
              price: 38900,
              status: 'Filled',
              time: '15 min ago'
            }
          ]
        },
        '2': {
          client: {
            id: '2',
            name: 'TechStart Inc',
            email: 'info@techstart.io',
            status: 'Active',
            tier: 'Premium',
            projects: 3,
            tokens: 6,
            settings: {
              maxSpread: 0.4,
              maxDailyVolume: 75000
            }
          },
          metrics: {
            portfolioValue: 2950000,
            pnl: 45000,
            volume: 2800000,
            activeBots: 12,
            totalBots: 14
          },
          tradingPairs: [
            {
              pair: 'ETH/USD',
              exchange: 'Coinbase',
              token: 'ETH',
              volume: 980000,
              pnl: 19600,
              activeBots: 4,
              status: 'Active'
            },
            {
              pair: 'BTC/USDT',
              exchange: 'Binance',
              token: 'BTC',
              volume: 750000,
              pnl: 15000,
              activeBots: 3,
              status: 'Active'
            },
            {
              pair: 'MATIC/USD',
              exchange: 'Binance',
              token: 'MATIC',
              volume: 520000,
              pnl: 10400,
              activeBots: 3,
              status: 'Active'
            },
            {
              pair: 'SOL/USDT',
              exchange: 'Kraken',
              token: 'SOL',
              volume: 350000,
              pnl: 0,
              activeBots: 2,
              status: 'Active'
            }
          ],
          bots: [
            {
              name: 'ETH-SpreadBot-A',
              pair: 'ETH/USD',
              exchange: 'Coinbase',
              status: 'Running',
              volume: 38000,
              pnl: 760,
              uptime: 99.1
            },
            {
              name: 'BTC-VolumeBot-B',
              pair: 'BTC/USDT',
              exchange: 'Binance',
              status: 'Running',
              volume: 32000,
              pnl: 640,
              uptime: 98.5
            },
            {
              name: 'MATIC-MarketMaker',
              pair: 'MATIC/USD',
              exchange: 'Binance',
              status: 'Running',
              volume: 28000,
              pnl: 560,
              uptime: 97.8
            }
          ],
          recentOrders: [
            {
              id: 'ORD-78901',
              pair: 'ETH/USD',
              side: 'Buy',
              type: 'Limit',
              amount: '8.5 ETH',
              price: 2235,
              status: 'Filled',
              time: '3 min ago'
            },
            {
              id: 'ORD-78900',
              pair: 'BTC/USDT',
              side: 'Sell',
              type: 'Market',
              amount: '0.25 BTC',
              price: 42400,
              status: 'Filled',
              time: '7 min ago'
            }
          ]
        }
      };
      
      // Return specific client data or first client as default
      return clientDataMap[clientId] || clientDataMap['1'];
    }
    
    return apiCall(`/api/admin/clients/${clientId}/detail`);
  }
};

/**
 * Reports API calls
 */
export const reportsAPI = {
  /**
   * Get trading report for a time period
   */
  async getReport(period = '7d') {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      return {
        period,
        summary: {
          totalVolume: 1250000,
          volumeChange: 12.5,
          pnl: 15750,
          roi: 1.26,
          totalTrades: 1247,
          winRate: 67.8,
          avgTradeSize: 1002,
          maxTradeSize: 15000
        },
        byExchange: [
          { exchange: 'Binance', volume: 650000, trades: 687, pnl: 8500, roi: 1.31 },
          { exchange: 'Kraken', volume: 380000, trades: 342, pnl: 4200, roi: 1.11 },
          { exchange: 'Coinbase', volume: 220000, trades: 218, pnl: 3050, roi: 1.39 }
        ],
        byPair: [
          { pair: 'BTC/USD', volume: 580000, trades: 423, pnl: 9200, winRate: 72.3 },
          { pair: 'ETH/USDT', volume: 420000, trades: 518, pnl: 4800, winRate: 65.4 },
          { pair: 'BTC/EUR', volume: 180000, trades: 201, pnl: 1200, winRate: 59.7 },
          { pair: 'ADA/EUR', volume: 70000, trades: 105, pnl: 550, winRate: 68.6 }
        ],
        byBot: [
          { botName: 'SpreadBot 1', status: 'Running', volume: 520000, trades: 612, pnl: 6800, uptime: 98.5 },
          { botName: 'VolumeBot 2', status: 'Running', volume: 430000, trades: 385, pnl: 5200, uptime: 99.2 },
          { botName: 'ArbitrageBot 3', status: 'Paused', volume: 220000, trades: 188, pnl: 2900, uptime: 87.3 },
          { botName: 'MarketMaker 4', status: 'Running', volume: 80000, trades: 62, pnl: 850, uptime: 95.1 }
        ]
      };
    }
    
    return apiCall(`/api/reports?period=${period}`);
  },

  /**
   * Export report in specified format
   */
  async exportReport(period, format = 'pdf') {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: `Report exported as ${format}` };
    }
    
    const response = await fetch(`${API_BASE_URL}/api/reports/export?period=${period}&format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-report-${period}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    return { message: 'Export successful' };
  }
};

/**
 * Agent API calls
 */
export const agentAPI = {
  /**
   * Send a message to the AI agent
   */
  async sendMessage(message) {
    if (USE_MOCK) {
      // Mock response for testing
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      return {
        response: `Mock AI response to: "${message}"\n\nBTC/USD Balance: 1.4 BTC ($56,300)\nETH/USDT Balance: 15.2 ETH ($38,000)\nNo open orders.`,
        actions_taken: null
      };
    }
    
    return apiCall('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  /**
   * Get chat history
   */
  async getHistory(limit = 50) {
    if (USE_MOCK) {
      return [
        {
          id: '1',
          role: 'user',
          message: 'Check BTC/USD balance',
          actions_taken: null,
          timestamp: new Date(Date.now() - 120000).toISOString()
        },
        {
          id: '2',
          role: 'assistant',
          message: 'BTC/USD balance: 1.4 BTC ($56,300), no open orders.',
          actions_taken: null,
          timestamp: new Date(Date.now() - 119000).toISOString()
        }
      ];
    }
    
    return apiCall(`/api/agent/history?limit=${limit}`);
  },

  /**
   * Clear chat history
   */
  async clearHistory() {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Chat history cleared' };
    }
    
    return apiCall('/api/agent/history', {
      method: 'DELETE',
    });
  }
};

/**
 * Default export for convenience (wraps all APIs)
 */
const api = {
  admin: adminAPI,
  reports: reportsAPI,
  agent: agentAPI
};

export default api;
