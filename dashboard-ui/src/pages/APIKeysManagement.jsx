import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

const APIKeysManagement = () => {
          const [keys, setKeys] = useState([]);
          const [apiKey, setApiKey] = useState('');
          const [secret, setSecret] = useState('');

          const handleAdd = () => {
                      if (apiKey && secret) {
                                    setKeys([...keys, { id: Date.now(), apiKey, secret }]);
                                    setApiKey('');
                                    setSecret('');
                      }
          };

          const handleDelete = id => {
                      setKeys(keys.filter(k => k.id !== id));
          };

          const maskKey = key => key.substring(0, 6) + '***' + key.substring(key.length - 4);

          return React.createElement(Box, { sx: { p: 3 } },
                                         React.createElement('h1', {}, 'API Keys Management'),
                                         React.createElement(Box, { sx: { mb: 3, display: 'flex', gap: 2 } },
                                                                   React.createElement(TextField, { label: 'API Key', value: apiKey, onChange: e => setApiKey(e.target.value) }),
                                                                   React.createElement(TextField, { label: 'Secret', type: 'password', value: secret, onChange: e => setSecret(e.target.value) }),
                                                                   React.createElement(Button, { variant: 'contained', onClick: handleAdd }, 'Add Key')
                                                                 ),
                                         React.createElement(Box, {},
                                                                   keys.map(key =>
                                                                                   React.createElement(Box, { key: key.id, sx: { p: 1, mb: 1, border: '1px solid #ccc' } },
                                                                                                                 React.createElement('div', {}, maskKey(key.apiKey)),
                                                                                                                 React.createElement(Button, { size: 'small', color: 'error', onClick: () => handleDelete(key.id) }, 'Delete')
                                                                                                               )
                                                                                  )
                                                                 )
                                       );
};

export default APIKeysManagement;
