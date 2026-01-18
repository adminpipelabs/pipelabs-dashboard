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
          main: mode === 'light' ? '#1A1F3A' : '#3B82F6',  // Dark navy / Blue
          dark: '#0F1422',
          light: '#2D3548',
        },
        secondary: { 
          main: '#3B82F6',  // Subtle blue accent
          dark: '#2563EB',
          light: '#60A5FA',
        },
        background: {
          default: mode === 'light' ? '#FFFFFF' : '#0F1422',
          paper: mode === 'light' ? '#FFFFFF' : '#1A1F3A',
        },
        text: {
          primary: mode === 'light' ? '#1A1F3A' : '#F9FAFB',
          secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
        },
        divider: mode === 'light' ? '#E5E7EB' : '#374151',
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        h1: { fontWeight: 600, letterSpacing: '-0.02em', fontSize: '2.5rem' },
        h2: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '2rem' },
        h3: { fontWeight: 600, fontSize: '1.75rem' },
        h4: { fontWeight: 600, fontSize: '1.5rem' },
        h5: { fontWeight: 500, fontSize: '1.25rem' },
        h6: { fontWeight: 500, fontSize: '1.125rem' },
        button: { fontWeight: 500, textTransform: 'none' },
        body1: { fontSize: '1rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      },
      shape: { borderRadius: 8 },
      spacing: 8,
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              padding: '10px 20px',
              fontSize: '0.9375rem',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
            contained: {
              backgroundColor: mode === 'light' ? '#1A1F3A' : '#3B82F6',
              '&:hover': {
                backgroundColor: mode === 'light' ? '#0F1422' : '#2563EB',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light' 
                ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)'
                : '0 1px 3px rgba(0,0,0,0.3)',
              border: mode === 'light' ? '1px solid #E5E7EB' : '1px solid #374151',
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
                '&:hover fieldset': {
                  borderColor: mode === 'light' ? '#D1D5DB' : '#4B5563',
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
