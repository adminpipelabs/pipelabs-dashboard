// pages/admin/APIKeysManagement.jsx
import React, { useState, useEffect } from 'react';
import './APIKeysManagement.css';

export default function APIKeysManagement() {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [formData, setFormData] = useState({
          serviceName: 'GitHub',
          keyName: '',
          keyValue: '',
          expiryDate: '',
    });

  useEffect(() => {
        fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
        try {
                setLoading(true);
                const response = await fetch('/api/admin/api-keys');
                const data = await response.json();
                setApiKeys(data);
        } catch (error) {
                console.error('Failed to load API keys:', error);
        } finally {
                setLoading(false);
        }
  };

  const handleAddKey = async () => {
        try {
                const response = await fetch('/api/admin/api-keys', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(formData),
                });

          if (response.ok) {
                    fetchApiKeys();
                    setShowAddModal(false);
                    setFormData({ serviceName: 'GitHub', keyName: '', keyValue: '', expiryDate: '' });
          }
        } catch (error) {
                console.error('Failed to add API key:', error);
        }
  };

  const handleRevokeKey = async (keyId) => {
        if (window.confirm('Are you sure you want to revoke this API key?')) {
                try {
                          await fetch(`/api/admin/api-keys/${keyId}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'revoked' }),
                          });
                          fetchApiKeys();
                } catch (error) {
                          console.error('Failed to revoke API key:', error);
                }
        }
  };

  const handleDeleteKey = async (keyId) => {
        if (window.confirm('This action cannot be undone. Delete this API key?')) {
                try {
                          await fetch(`/api/admin/api-keys/${keyId}`, {
                                      method: 'DELETE',
                          });
                          fetchApiKeys();
                } catch (error) {
                          console.error('Failed to delete API key:', error);
                }
        }
  };

  const maskKey = (key) => {
        if (!key) return '';
        return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
  };

  return (
        <div className="api-keys-container">
              <div className="api-keys-header">
                      <div>
                                <h1>API Keys Management</h1>h1>
                                <p>Manage API keys for GitHub and other integrations</p>p>
                      </div>div>
                      <button className="btn-add" onClick={() => setShowAddModal(true)}>
                                + Add API Key
                      </button>button>
              </div>div>
        
          {loading ? (
                  <div className="loading">Loading API keys...</div>div>
                ) : apiKeys.length === 0 ? (
                  <div className="empty-state">
                            <p>No API keys configured yet.</p>p>
                            <button className="btn-add" onClick={() => setShowAddModal(true)}>
                                        + Add Your First API Key
                            </button>button>
                  </div>div>
                ) : (
                  <div className="api-keys-table">
                            <table>
                                        <thead>
                                                      <tr>
                                                                      <th>Service</th>th>
                                                                      <th>Key Name</th>th>
                                                                      <th>Key</th>th>
                                                                      <th>Status</th>th>
                                                                      <th>Created</th>th>
                                                                      <th>Last Used</th>th>
                                                                      <th>Expires</th>th>
                                                                      <th>Actions</th>th>
                                                      </tr>tr>
                                        </thead>thead>
                                        <tbody>
                                          {apiKeys.map((key) => (
                                    <tr key={key.id} className={`row-${key.status}`}>
                                                      <td>
                                                                          <div className="service-badge">{key.serviceName}</div>div>
                                                      </td>td>
                                                      <td>{key.keyName}</td>td>
                                                      <td>
                                                                          <code className="masked-key">{maskKey(key.keyValue)}</code>code>
                                                                          <button 
                                                                                                  className="btn-copy" 
                                                                            onClick={() => copyToClipboard(key.keyValue)}
                                                                                                  title="Copy full key"
                                                                                                >
                                                                                                📋
                                                                          </button>button>
                                                      </td>td>
                                                      <td>
                                                                          <span className={`status-badge status-${key.status}`}>
                                                                            {key.status}
                                                                          </span>span>
                                                      </td>td>
                                                      <td>{new Date(key.createdAt).toLocaleDateString()}</td>td>
                                                      <td>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</td>td>
                                                      <td>
                                                        {key.expiryDate ? (
                                                            <span className={new Date(key.expiryDate) < new Date() ? 'expired' : ''}>
                                                              {new Date(key.expiryDate).toLocaleDateString()}
                                                            </span>span>
                                                          ) : (
                                                            'Never'
                                                          )}
                                                      </td>td>
                                                      <td className="actions-cell">
                                                                          <button 
                                                                                                  className="btn-action btn-view"
                                                                                                  onClick={() => setSelectedKey(key)}
                                                                                                  title="View details"
                                                                                                >
                                                                                                👁️
                                                                          </button>button>
                                                        {key.status === 'active' && (
                                                            <button 
                                                                                      className="btn-action btn-revoke"
                                                                                      onClick={() => handleRevokeKey(key.id)}
                                                                                      title="Revoke key"
                                                                                    >
                                                                                    ✓
                                                            </button>button>
                                                                          )}
                                                                          <button 
                                                                                                  className="btn-action btn-delete"
                                                                                                  onClick={() => handleDeleteKey(key.id)}
                                                                                                  title="Delete key"
                                                                                                >
                                                                                                🗑️
                                                                          </button>button>
                                                      </td>td>
                                    </tr>tr>
                                  ))}
                                        </tbody>tbody>
                            </table>table>
                  </div>div>
              )}
        
          {showAddModal && (
                  <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                        <div className="modal-header">
                                                      <h2>Add New API Key</h2>h2>
                                                      <button className="btn-close" onClick={() => setShowAddModal(false)}>✕</button>button>
                                        </div>div>
                                        <div className="modal-body">
                                                      <div className="form-group">
                                                                      <label>Service</label>label>
                                                                      <select 
                                                                                          value={formData.serviceName}
                                                                                          onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                                                                                        >
                                                                                        <option>GitHub</option>option>
                                                                                        <option>GitLab</option>option>
                                                                                        <option>Bitbucket</option>option>
                                                                                        <option>Other</option>option>
                                                                      </select>select>
                                                      </div>div>
                                                      <div className="form-group">
                                                                      <label>Key Name</label>label>
                                                                      <input 
                                                                                          type="text"
                                                                                          placeholder="e.g., Production GitHub Key"
                                                                                          value={formData.keyName}
                                                                                          onChange={(e) => setFormData({...formData, keyName: e.target.value})}
                                                                                        />
                                                      </div>div>
                                                      <div className="form-group">
                                                                      <label>API Key Value</label>label>
                                                                      <input 
                                                                                          type="password"
                                                                                          placeholder="Paste your API key here"
                                                                                          value={formData.keyValue}
                                                                                          onChange={(e) => setFormData({...formData, keyValue: e.target.value})}
                                                                                        />
                                                                      <small>⚠️ Keep this secure. Never share your API key.</small>small>
                                                      </div>div>
                                                      <div className="form-group">
                                                                      <label>Expiry Date (Optional)</label>label>
                                                                      <input 
                                                                                          type="date"
                                                                                          value={formData.expiryDate}
                                                                                          onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                                                                        />
                                                      </div>div>
                                        </div>div>
                                        <div className="modal-footer">
                                                      <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>button>
                                                      <button className="btn-save" onClick={handleAddKey}>Save API Key</button>button>
                                        </div>div>
                            </div>div>
                  </div>div>
              )}
        
          {selectedKey && (
                  <div className="modal-overlay" onClick={() => setSelectedKey(null)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                        <div className="modal-header">
                                                      <h2>API Key Details</h2>h2>
                                                      <button className="btn-close" onClick={() => setSelectedKey(null)}>✕</button>button>
                                        </div>div>
                                        <div className="modal-body">
                                                      <div className="detail-row">
                                                                      <label>Service:</label>label>
                                                                      <span>{selectedKey.serviceName}</span>span>
                                                      </div>div>
                                                      <div className="detail-row">
                                                                      <label>Name:</label>label>
                                                                      <span>{selectedKey.keyName}</span>span>
                                                      </div>div>
                                                      <div className="detail-row">
                                                                      <label>Status:</label>label>
                                                                      <span className={`status-badge status-${selectedKey.status}`}>{selectedKey.status}</span>span>
                                                      </div>div>
                                                      <div className="detail-row">
                                                                      <label>Created:</label>label>
                                                                      <span>{new Date(selectedKey.createdAt).toLocaleString()}</span>span>
                                                      </div>div>
                                                      <div className="detail-row">
                                                                      <label>Last Used:</label>label>
                                                                      <span>{selectedKey.lastUsed ? new Date(selectedKey.lastUsed).toLocaleString() : 'Never'}</span>span>
                                                      </div>div>
                                                      <div className="detail-row">
                                                                      <label>Expires:</label>label>
                                                                      <span>{selectedKey.expiryDate ? new Date(selectedKey.expiryDate).toLocaleDateString() : 'Never'}</span>span>
                                                      </div>div>
                                        </div>div>
                                        <div className="modal-footer">
                                                      <button className="btn-cancel" onClick={() => setSelectedKey(null)}>Close</button>button>
                                        </div>div>
                            </div>div>
                  </div>div>
              )}
        </div>div>
      );
}</div>
