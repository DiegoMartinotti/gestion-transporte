import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4FB9BE', // Verde agua
      light: '#6CCCD1',
      dark: '#3A8A8E',
    },
    secondary: {
      main: '#3F7CAC', // Azul
      light: '#5B98C7',
      dark: '#2C5879',
    },
    background: {
      default: '#1A1A1A',
      paper: '#242424',
    },
    text: {
      primary: '#ffffff',
      secondary: '#B0B0B0',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #3F7CAC 30%, #4FB9BE 90%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});