import React, { useState } from 'react';
import { 
  Box, 
  Tab, 
  Tabs, 
  Typography, 
  Paper
} from '@mui/material';
import TramoManager from './TramoManager';
import SitesManager from './SitesManager';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tarifario-tabpanel-${index}`}
      aria-labelledby={`tarifario-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `tarifario-tab-${index}`,
    'aria-controls': `tarifario-tabpanel-${index}`,
  };
}

const Tarifario = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Typography
          component="h1"
          variant="h4"
          align="center"
          color="primary"
          gutterBottom
          sx={{ pt: 2 }}
        >
          Gestión de Tarifario
        </Typography>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="tarifario tabs"
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tramos" {...a11yProps(0)} />
          <Tab label="Sites" {...a11yProps(1)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TramoManager />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <SitesManager />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Tarifario;
