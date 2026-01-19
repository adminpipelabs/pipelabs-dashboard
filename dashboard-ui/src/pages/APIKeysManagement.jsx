import React, { useState } from 'react';
import { Box, Button, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const EXCHANGES = ['binance', 'kraken', 'coinbase', 'okx', 'kucoin', 'bybit', 'gate.io'];

export default function APIKeysManagement() {
        const [keys, setKeys] = useState([]);
        const [exchange, setExchange] = useState('');
        const [apiKey, setApiKey] = useState('');
        const [secret, setSecret] = useState('');

  const handleAdd = () => {
            if (exchange && apiKey && secret) {
                        setKeys([...keys, { id: Date.now(), exchange, apiKey, secret }]);
                        setExchange('');
                        setApiKey('');
                        setSecret('');
            }
  };

  const handleDelete = (id) => {
            setKeys(keys.filter(k => k.id !== id));
  };

  const maskKey = (key) => key.substring(0, 6) + '***' + key.substring(key.length - 4);

  return (
            <Box sx={{ p: 3 }}>
                        <h1>API Keys Management</h1>h1>
            
                  <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Select value={exchange} onChange={(e) => setExchange(e.target.value)} sx={{ minWidth: 150 }}>
                                    <MenuItem value="">Select Exchange</MenuItem>MenuItem>
                                {EXCHANGES.map(ex => <MenuItem key={ex} value={ex}>{ex}</MenuItem>MenuItem>)}
                          </Select>Select>
                          <TextField label="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                          <TextField label="Secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
                          <Button variant="contained" onClick={handleAdd}>Add Key</Button>Button>
                  </Box>Box>
            
                  <TableContainer component={Paper}>
                          <Table>
                                    <TableHead>
                                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                              <TableCell>Exchange</TableCell>TableCell>
                                                              <TableCell>API Key</TableCell>TableCell>
                                                              <TableCell>Actions</TableCell>TableCell>
                                                </TableRow>TableRow>
                                    </TableHead>TableHead>
                                    <TableBody>
                                          {keys.map(key => (
                                <TableRow key={key.id}>
                                                <TableCell>{key.exchange}</TableCell>TableCell>
                                                <TableCell>{maskKey(key.apiKey)}</TableCell>TableCell>
                                                <TableCell>
                                                                  <Button size="small" color="error" onClick={() => handleDelete(key.id)}>Delete</Button>Button>
                                                </TableCell>TableCell>
                                </TableRow>TableRow>
                              ))}
                                    </TableBody>TableBody>
                          </Table>Table>
                  </TableContainer>TableContainer>
            </Box>Box>
          );
}</h1>
