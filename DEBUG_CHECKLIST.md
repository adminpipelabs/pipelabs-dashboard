# Debug Checklist - Let's Find the REAL Problem

## I Need Specific Information

Instead of saying "it doesn't work", I need to know:

### 1. What EXACT Error Message Do You See?

**For Orders:**
- What is the EXACT error message when you try to send an order?
- Is it in a red alert box?
- Is it in browser console?
- Copy/paste the EXACT text

**For Balances:**
- What do you see? $0? Empty? Error message?
- What's in browser console when balances load?

**For Portfolio Navigation:**
- What EXACTLY happens when you click Portfolio?
- Does page reload?
- Does it navigate to blank page?
- What URL does it go to?
- Any errors in browser console?

### 2. Is Trading Bridge Diagnostics Component Visible?

- Do you see "Trading Bridge Diagnostics" card at top of client detail page?
- If NO, check browser console for errors
- If YES, what happens when you click buttons?

### 3. What Happens When You Click "Reinitialize"?

- Does button work?
- What error message appears?
- Check browser Network tab - what request fails?
- Check backend logs - what errors appear?

### 4. Backend Logs - What Do They Say?

When you try to:
- Send order → What error in backend logs?
- Check balances → What error in backend logs?
- Reinitialize → What error in backend logs?

Copy/paste the EXACT error from Railway backend logs.

### 5. Browser Console - What Errors?

Open browser console (F12) and:
- Try sending order → What error?
- Check balances → What error?
- Click Portfolio → What error?

Copy/paste the EXACT errors.

## Common Issues & How to Check

### Issue: Orders Fail
**Check:**
1. Browser console error message
2. Backend logs for Trading Bridge errors
3. Network tab - what HTTP status code?
4. Is connector initialized? (Check Status button)

### Issue: Balances $0
**Check:**
1. Did you reinitialize connectors?
2. Backend logs - what does Trading Bridge return?
3. Network tab - what does `/portfolio` endpoint return?
4. Are API keys valid?

### Issue: Portfolio Kicks You Out
**Check:**
1. Browser console - any errors?
2. Network tab - what request fails?
3. What URL does it navigate to?
4. Is route defined in App.js?

## What I Need From You

**Please provide:**

1. **EXACT error message** (copy/paste)
2. **Browser console errors** (F12 → Console tab)
3. **Backend logs** (Railway → Backend service → Logs)
4. **Network tab** (F12 → Network tab → Failed requests)

**Example format:**
```
Error: "Failed to send order: Account client_sharp_foundation not found in Trading Bridge"
Browser Console: "POST /api/admin/clients/xxx/orders 404"
Backend Logs: "❌ Trading Bridge HTTP error: 404 - Account not found"
```

## Why This Matters

I can't fix what I can't see. I need to know:
- **WHAT** is failing (specific error)
- **WHERE** it's failing (frontend/backend/Trading Bridge)
- **WHY** it's failing (connector not initialized? API key invalid? Service down?)

Once I have this information, I can fix the ACTUAL problem instead of guessing.

## Next Steps

1. **Try to send an order** → Copy the EXACT error message
2. **Check browser console** → Copy any errors
3. **Check backend logs** → Copy relevant errors
4. **Send me all of this** → I'll fix the REAL issue

Let's stop guessing and fix what's actually broken.
