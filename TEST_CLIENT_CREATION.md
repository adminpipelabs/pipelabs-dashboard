# Quick Test - Client Creation Issue

## Test in Browser Console

Open browser DevTools (F12) → Console tab, then paste this:

```javascript
// Test client creation
const API = 'https://pipelabs-dashboard-production.up.railway.app';
const token = localStorage.getItem('access_token');

console.log('Token:', token ? 'Found' : 'MISSING');

fetch(`${API}/api/admin/clients`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Test Client',
    wallet_address: '0xD4F6ed1DAEBc3877E2C6F95E9d24A0c041A35472',
    email: null,
    status: 'Active'
  })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

This will show:
- If token exists
- The actual error message
- Response status code
