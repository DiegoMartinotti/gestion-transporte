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
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // Estilos para la barra de navegación
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #3F7CAC 30%, #4FB9BE 90%)',
          boxShadow: '0 3px 5px 2px rgba(63, 124, 172, .3)',
        },
      },
    },
    // Estilos para botones
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          boxShadow: 'none',
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    // Estilos para tarjetas
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },
    // Estilos para campos de texto
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    // Estilos para desplegables (Select)
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          marginTop: 8,
        },
      },
    },
    // Estilos para tablas
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(79, 185, 190, 0.1)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(63, 124, 172, 0.08)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#4FB9BE',
        },
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    // Estilos para diálogos
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    // Estilos para pestañas
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            color: '#4FB9BE',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    // Estilos para chips
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    // Estilos para tooltips
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#242424',
          color: '#ffffff',
          fontSize: '0.75rem',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
});