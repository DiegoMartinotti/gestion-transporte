import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box,
  Menu,
  MenuItem,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Calculate as CalculateIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  // Definir los elementos del menú para evitar repetición
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { path: '/clientes', label: 'Gestión de Clientes', icon: <PeopleIcon fontSize="small" /> },
    { path: '/viajes', label: 'Gestión de Viajes', icon: <LocalShippingIcon fontSize="small" /> },
    { path: '/calcular-tarifa', label: 'Calcular Tarifa', icon: <CalculateIcon fontSize="small" /> },
    { path: '/empresas', label: 'Gestión de Empresas', icon: <BusinessIcon fontSize="small" /> }
  ];

  // Estilo común para los elementos del menú
  const menuItemStyle = { 
    display: 'flex', 
    alignItems: 'center',
    gap: 1,
    minWidth: 200,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    }
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenu}
          sx={{ 
            mr: 2,
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.1),
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1,
              background: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }
          }}
        >
          {menuItems.map((item, index) => (
            <MenuItem 
              key={index}
              onClick={() => handleNavigate(item.path)} 
              sx={menuItemStyle}
            >
              {item.icon}
              {item.label}
            </MenuItem>
          ))}
        </Menu>

        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          Mi Proyecto
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              px: 2, 
              py: 0.5, 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.common.white, 0.1),
            }}>
              <AccountCircleIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                {user.username || user.email}
              </Typography>
            </Box>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                }
              }}
            >
              Salir
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;