import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

const APIKeysManagement = () => {
            const [keys, setKeys] = useState([]);
            const [name, setName] = useState('');
            const [apiKey, setApiKey] = useState('');
            const [secret, setSecret] = useState('');
            const [memo, setMemo] = useState('');

            const handleAdd = () => {
                          if (name && apiKey && secret) {
                                          setKeys([...keys, { id: Date.now(), name, apiKey, secret, memo }]);
                                          setName('');
                                          setApiKey('');
                                          setSecret('');
                                          setMemo('');
                          }
            };

            const handleDelete = id => {
                          setKeys(keys.filter(k => k.id !== id));
            };

            const maskKey = key => key.substring(0, 6) + '***' + key.substring(key.length - 4);

            return React.createElement(Box, { sx: { p: 3 } },
                                           React.createElement('h1', {}, 'API Keys Management'),
                                           React.createElement(Box, { sx: { mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' } },
                                                                     React.createElement(TextField, { label: 'Name', value: name, onChange: e => setName(e.target.value), sx: { minWidth: 150 } }),
                                                                     React.createElement(TextField, { label: 'API Key', value: apiKey, onChange: e => setApiKey(e.target.value), sx: { minWidth: 200 } }),
                                                                     React.createElement(TextField, { label: 'Secret', type: 'password', value: secret, onChange: e => setSecret(e.target.value), sx: { minWidth: 200 } }),
                                                                     React.createElement(TextField, { label: 'Memo', value: memo, onChange: e => setMemo(e.target.value), sx: { minWidth: 200 } }),
                                                                     React.createElement(Button, { variant: 'contained', onClick: handleAdd }, 'Add Key')
                                                                   ),
                                           React.createElement(Box, {},
                                                                     keys.map(key =>
                                                                                       React.createElement(Box, { key: key.id, sx: { p: 2, mb: 2, border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' } },
                                                                                                                     React.createElement('div', { style: { marginBottom: '8px', fontWeight: 'bold' } }, 'Name: ' + key.name),
                                                                                                                     React.createElement('div', { style: { marginBottom: '8px' } }, 'API Key: ' + maskKey(key.apiKey)),
                                                                                                                     React.createElement('div', { style: { marginBottom: '8px' } }, 'Secret: ' + maskKey(key.secret)),
                                                                                                                     key.memo && React.createElement('div', { style: { marginBottom: '8px', color: '#666' } }, 'Memo: ' + key.memo),
                                                                                                                     React.createElement(Button, { size: 'small', color: 'error', onClick: () => handleDelete(key.id) }, 'Delete')
                                                                                                                   )
                                                                                    )
                                                                   )
                                         );
};

export default APIKeysManagement;
