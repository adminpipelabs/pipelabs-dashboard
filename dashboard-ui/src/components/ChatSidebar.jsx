import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Drawer
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { agentAPI } from '../services/api';

const SIDEBAR_WIDTH = 380;

export default function ChatSidebar({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Quick action buttons
  const quickActions = [
    { label: 'Balance', query: 'Check my current balances' },
    { label: 'P&L', query: 'Show me my P&L report' },
    { label: 'Bots', query: 'Show my active bots' },
  ];

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const history = await agentAPI.getHistory();
      setMessages(history.map(h => ({
        role: h.role,
        content: h.message,
        timestamp: h.timestamp,
        actions: h.actions_taken
      })));
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSend = async (message = input) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await agentAPI.sendMessage(message);
      
      const agentMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        actions: response.actions_taken
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (err) {
      setError('Failed to send message.');
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (query) => {
    handleSend(query);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        width: open ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          top: 64,
          height: 'calc(100% - 64px)',
          borderLeft: 1,
          borderColor: 'divider'
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6">AI Assistant</Typography>
          </Box>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickActions.map((action, idx) => (
            <Chip
              key={idx}
              label={action.label}
              size="small"
              onClick={() => handleQuickAction(action.query)}
              disabled={loading}
              clickable
            />
          ))}
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default'
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
              <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">
                Ask me anything about your trading activity
              </Typography>
            </Box>
          ) : (
            messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                {msg.role === 'assistant' && (
                  <SmartToyIcon color="primary" sx={{ mt: 0.5, fontSize: 20 }} />
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                  {msg.actions && msg.actions.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {msg.actions.map((action, i) => (
                        <Chip key={i} label={action} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </Paper>
                {msg.role === 'user' && (
                  <PersonIcon color="action" sx={{ mt: 0.5, fontSize: 20 }} />
                )}
              </Box>
            ))
          )}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, alignItems: 'flex-start', gap: 1 }}>
              <SmartToyIcon color="primary" sx={{ fontSize: 20 }} />
              <Paper elevation={1} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Thinking...</Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Error Display */}
        {error && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography color="error" variant="caption">{error}</Typography>
          </Box>
        )}

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
