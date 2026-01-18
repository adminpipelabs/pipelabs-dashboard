import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

// Supported exchanges with their required fields
const EXCHANGES = [
  { id: 'binance', name: 'Binance', requiresPassphrase: false },
  { id: 'binance_perpetual', name: 'Binance Perpetual', requiresPassphrase: false },
  { id: 'bitmart', name: 'BitMart', requiresPassphrase: true, passphraseLabel: 'Memo' },
  { id: 'gate_io', name: 'Gate.io', requiresPassphrase: false },
  { id: 'kucoin', name: 'KuCoin', requiresPassphrase: true, passphraseLabel: 'Passphrase' },
  { id: 'okx', name: 'OKX', requiresPassphrase: true, passphraseLabel: 'Passphrase' },
  { id: 'bybit', name: 'Bybit', requiresPassphrase: false },
  { id: 'hyperliquid', name: 'Hyperliquid', requiresPassphrase: false },
  { id: 'mexc', name: 'MEXC', requiresPassphrase: false },
  { id: 'htx', name: 'HTX (Huobi)', requiresPassphrase: false },
];

const APIKeysManagement = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    exchange: '',
    api_key: '',
    api_secret: '',
    passphrase: '',
    label: '',
    is_testnet: false,
    notes: ''
  });

  useEffect(() => {
    if (clientId) {
      fetchClientAndKeys();
    }
  }, [clientId]);

  const fetchClientAndKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch client details
      const clientData = await adminAPI.getClient(clientId);
      setClient(clientData);
      
      // Fetch API keys for this client
      const keysData = await adminAPI.getClientAPIKeys(clientId);
      setApiKeys(keysData || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load client data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleExchangeChange = (e) => {
    const exchange = e.target.value;
    setFormData(prev => ({
      ...prev,
      exchange,
      passphrase: '' // Reset passphrase when exchange changes
    }));
  };

  const getSelectedExchange = () => {
    return EXCHANGES.find(ex => ex.id === formData.exchange);
  };

  const resetForm = () => {
    setFormData({
      exchange: '',
      api_key: '',
      api_secret: '',
      passphrase: '',
      label: '',
      is_testnet: false,
      notes: ''
    });
    setEditingKey(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (key) => {
    setFormData({
      exchange: key.exchange,
      api_key: '', // Don't show existing key for security
      api_secret: '', // Don't show existing secret for security
      passphrase: '',
      label: key.label || '',
      is_testnet: key.is_testnet || false,
      notes: key.notes || ''
    });
    setEditingKey(key);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.exchange || !formData.api_key || !formData.api_secret) {
      setError('Please fill in all required fields');
      return;
    }

    const selectedExchange = getSelectedExchange();
    if (selectedExchange?.requiresPassphrase && !formData.passphrase) {
      setError(`${selectedExchange.passphraseLabel} is required for ${selectedExchange.name}`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        client_id: clientId,
        exchange: formData.exchange,
        api_key: formData.api_key,
        api_secret: formData.api_secret,
        passphrase: formData.passphrase || null,
        label: formData.label || `${formData.exchange} API Key`,
        is_testnet: formData.is_testnet,
        notes: formData.notes || null
      };

      if (editingKey) {
        await adminAPI.updateClientAPIKey(clientId, editingKey.id, payload);
      } else {
        await adminAPI.addClientAPIKey(clientId, payload);
      }

      await fetchClientAndKeys();
      closeModal();
    } catch (err) {
      console.error('Failed to save API key:', err);
      setError('Failed to save API key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteClientAPIKey(clientId, keyId);
      await fetchClientAndKeys();
    } catch (err) {
      console.error('Failed to delete API key:', err);
      setError('Failed to delete API key. Please try again.');
    }
  };

  const maskKey = (key) => {
    if (!key) return '••••••••';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          ← Back
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys Management</h1>
            {client && (
              <p className="text-gray-600 mt-1">
                Managing exchange API keys for <span className="font-semibold">{client.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <span>+</span> Add API Key
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exchange
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <p className="text-lg font-medium">No API keys configured</p>
                    <p className="text-sm text-gray-400 mt-1">Add exchange API keys to enable trading</p>
                  </div>
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => {
                const exchange = EXCHANGES.find(ex => ex.id === key.exchange);
                return (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">
                          {exchange?.name || key.exchange}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {key.label || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                      {maskKey(key.api_key_preview)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.is_testnet 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {key.is_testnet ? 'Testnet' : 'Mainnet'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.created_at ? new Date(key.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(key)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingKey ? 'Edit API Key' : 'Add New API Key'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Exchange */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="exchange"
                    value={formData.exchange}
                    onChange={handleExchangeChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={!!editingKey}
                  >
                    <option value="">Select an exchange</option>
                    {EXCHANGES.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Trading Account"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="api_key"
                    value={formData.api_key}
                    onChange={handleInputChange}
                    placeholder={editingKey ? 'Enter new API key to update' : 'Enter API key'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required={!editingKey}
                  />
                </div>

                {/* API Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="api_secret"
                    value={formData.api_secret}
                    onChange={handleInputChange}
                    placeholder={editingKey ? 'Enter new secret to update' : 'Enter API secret'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required={!editingKey}
                  />
                </div>

                {/* Passphrase (conditional) */}
                {getSelectedExchange()?.requiresPassphrase && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getSelectedExchange().passphraseLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="passphrase"
                      value={formData.passphrase}
                      onChange={handleInputChange}
                      placeholder={`Enter ${getSelectedExchange().passphraseLabel.toLowerCase()}`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={!editingKey}
                    />
                  </div>
                )}

                {/* Testnet Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_testnet"
                    id="is_testnet"
                    checked={formData.is_testnet}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_testnet" className="ml-2 block text-sm text-gray-700">
                    This is a testnet/sandbox API key
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Optional notes about this API key"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <strong>Security:</strong> API keys are encrypted before storage. Never share your API secret or passphrase.
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : (editingKey ? 'Update API Key' : 'Add API Key')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIKeysManagement;
