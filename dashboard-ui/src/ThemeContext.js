import React, { useMemo, useState, createContext, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext();

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function AppColorProvider({ children }) {
  const [mode, setMode] = useState('light');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    }
  }), []);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        primary: { 
          main: '#0066FF',      // Pipe Labs blue
          dark: '#0052CC',
          light: '#3385FF',
        },
        secondary: { 
          main: '#00D9FF',      // Accent cyan
          dark: '#00B8D9',
          light: '#33E0FF',
        },
        background: {
          default: mode === 'light' ? '#F8F9FA' : '#0A0E27',
          paper: mode === 'light' ? '#FFFFFF' : '#1A1F3A',
        },
        text: {
          primary: mode === 'light' ? '#1A1F3A' : '#FFFFFF',
          secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
        }
      },
      typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, letterSpacing: '-0.01em' },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { fontWeight: 600, textTransform: 'none' },
      },
      shape: { borderRadius: 8 },
      spacing: 8,  // More compact spacing
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              padding: '10px 24px',
              fontSize: '0.95rem',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light' 
                ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
                : '0 1px 3px rgba(0,0,0,0.3)',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'light' ? '#E5E7EB' : '#374151',
                },
              },
            },
          },
        },
      },
    }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
