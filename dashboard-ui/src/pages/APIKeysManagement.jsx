import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Alert, CircularProgress } from '@mui/material';
import api from '../../services/api';

const APIKeysManagement = () => {
              const [keys, setKeys] = useState([]);
              const [name, setName] = useState('');
              const [apiKey, setApiKey] = useState('');
              const [secret, setSecret] = useState('');
              const [memo, setMemo] = useState('');
              const [exchange, setExchange] = useState('bitmart');
              const [loading, setLoading] = useState(true);
              const [error, setError] = useState(null);
              const clientId = localStorage.getItem('client_id');

              useEffect(() => { fetchApiKeys(); }, []);

              const fetchApiKeys = async () => {
                              try {
                                                setLoading(true);
                                                setError(null);
                                                const response = await api.get(`/api/clients/${clientId}/api-keys`);
                                                setKeys(response.data || []);
                              } catch (err) {
                                                setError('Failed to load API keys');
                              } finally {
                                                setLoading(false);
                              }
              };

              const handleAdd = async () => {
                              if (!name || !apiKey || !secret) {
                                                setError('Required fields missing');
                                                return;
                              }
                              try {
                                                setError(null);
                                                await api.post(`/api/clients/${clientId}/api-keys`, {
                                                                    client_id: clientId, exchange, api_key: apiKey, api_secret: secret, label: name, notes: memo
                                                });
                                                setName(''); setApiKey(''); setSecret(''); setMemo(''); setExchange('bitmart');
                                                await fetchApiKeys();
                              } catch (err) {
                                                setError('Failed to add API key');
                              }
              };

              const handleDelete = async (keyId) => {
                              if (!window.confirm('Delete this key?')) return;
                              try {
                                                setError(null);
                                                await api.delete(`/api/clients/${clientId}/api-keys/${keyId}`);
                                                await fetchApiKeys();
                              } catch (err) {
                                                setError('Failed to delete API key');
                              }
              };

              const maskKey = (key) => !key || key.length < 10 ? '***' : key.substring(0, 6) + '***' + key.substring(key.length - 4);

              if (loading) {
                              return React.createElement(Box, { sx: { p: 3, textAlign: 'center' } },
                                                               React.createElement(CircularProgress)
                                                             );
              }

              return React.createElement(Box, { sx: { p: 3 } },
                                             React.createElement('h1', null, 'API Keys Management'),
                                             error && React.createElement(Alert, { severity: 'error', sx: { mb: 2 } }, error),
                                             React.createElement(Box, { sx: { mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 } },
                                                                       React.createElement('h2', null, 'Add New API Key'),
                                                                       React.createElement(TextField, { label: 'Name', value: name, onChange: (e) => setName(e.target.value), fullWidth: true, margin: 'normal' }),
                                                                       React.createElement(TextField, { label: 'Exchange', value: exchange, onChange: (e) => setExchange(e.target.value), fullWidth: true, margin: 'normal' }),
                                                                       React.createElement(TextField, { label: 'API Key', type: 'password', value: apiKey, onChange: (e) => setApiKey(e.target.value), fullWidth: true, margin: 'normal' }),
                                                                       React.createElement(TextField, { label: 'Secret', type: 'password', value: secret, onChange: (e) => setSecret(e.target.value), fullWidth: true, margin: 'normal' }),
                                                                       React.createElement(TextField, { label: 'Memo', value: memo, onChange: (e) => setMemo(e.target.value), fullWidth: true, margin: 'normal' }),
                                                                       React.createElement(Button, { variant: 'contained', color: 'primary', onClick: handleAdd, sx: { mt: 2 } }, 'Add Key')
                                                                     ),
                                             React.createElement('h2', null, 'Your API Keys'),
                                             keys.length === 0 ? 
                                               React.createElement(Alert, { severity: 'info' }, 'No API keys') :
                                               React.createElement(Box, null,
                                                                           keys.map((key) =>
                                                                                                 React.createElement(Box, { key: key.id, sx: { mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 } },
                                                                                                                                 React.createElement('strong', null, 'Name: ' + key.label),
                                                                                                                                 React.createElement('br', null),
                                                                                                                                 React.createElement('span', null, 'Exchange: ' + key.exchange),
                                                                                                                                 React.createElement('br', null),
                                                                                                                                 React.createElement('span', null, 'API Key: ' + maskKey(key.api_key_encrypted)),
                                                                                                                                 React.createElement('br', null),
                                                                                                                                 React.createElement('span', null, 'Secret: ' + maskKey(key.api_secret_encrypted)),
                                                                                                                                 React.createElement('br', null),
                                                                                                                                 key.notes && React.createElement('span', null, 'Memo: ' + key.notes),
                                                                                                                                 key.notes && React.createElement('br', null),
                                                                                                                                 React.createElement(Button, { variant: 'outlined', color: 'error', onClick: () => handleDelete(key.id), sx: { mt: 1 } }, 'Delete')
                                                                                                                               )
                                                                                            )
                                                                         )
                                           );
};

export default APIKeysManagement;
