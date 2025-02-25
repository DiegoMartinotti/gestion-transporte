import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
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

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenu}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleNavigate('/')} sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
            Dashboard
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/tarifario')} sx={{ display: 'flex', alignItems: 'center' }}>
            <ListAltIcon fontSize="small" sx={{ mr: 1 }} />
            Tarifario
          </MenuItem>
        </Menu>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Mi Proyecto
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.username || user.email}
            </Typography>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;