import React, { useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import EmpresaList from '../components/empresas/EmpresaList';
import EmpresaForm from '../components/empresas/EmpresaForm';
import EmpresaBulkImporter from '../components/empresas/EmpresaBulkImporter';
import useNotification from '../hooks/useNotification';

/**
 * Página principal para la gestión de empresas
 * @component
 */
const Empresas = () => {
  const [tabValue, setTabValue] = useState('1');
  const [openForm, setOpenForm] = useState(false);
  const [openImporter, setOpenImporter] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const { showNotification } = useNotification();

  // Cambiar de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Abrir formulario para nueva empresa
  const handleAddEmpresa = () => {
    setSelectedEmpresa(null);
    setOpenForm(true);
  };

  // Abrir formulario para editar empresa
  const handleEditEmpresa = (empresa) => {
    setSelectedEmpresa(empresa);
    setOpenForm(true);
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedEmpresa(null);
  };

  // Guardar empresa (crear o actualizar)
  const handleSaveEmpresa = (savedEmpresa) => {
    showNotification(
      selectedEmpresa ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente',
      'success'
    );
    
    // Cerrar el formulario después de guardar
    setOpenForm(false);
    setSelectedEmpresa(null);
  };

  // Abrir importador de empresas
  const handleOpenImporter = () => {
    setOpenImporter(true);
  };

  // Cerrar importador de empresas
  const handleCloseImporter = () => {
    setOpenImporter(false);
  };

  // Manejar finalización de importación
  const handleImportComplete = () => {
    showNotification('Importación de empresas completada', 'success');
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Gestión de Empresas
      </Typography>

      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Listado de Empresas" value="1" />
            <Tab label="Importación Masiva" value="2" />
          </Tabs>
        </Box>

        <TabPanel value="1" sx={{ p: 0, pt: 2, height: 'calc(100% - 48px)' }}>
          <EmpresaList 
            onAddEmpresa={handleAddEmpresa}
            onEditEmpresa={handleEditEmpresa}
          />
        </TabPanel>

        <TabPanel value="2" sx={{ p: 0, pt: 2, height: 'calc(100% - 48px)' }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Importación Masiva de Empresas
            </Typography>
            <Typography variant="body1" paragraph>
              Utilice esta opción para importar múltiples empresas desde un archivo Excel. 
              El sistema verificará y validará los datos antes de importarlos.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <EmpresaBulkImporter 
                open={openImporter}
                onClose={handleCloseImporter}
                onComplete={handleImportComplete}
              />
            </Box>
          </Paper>
        </TabPanel>
      </TabContext>

      {/* Formulario para crear/editar empresa */}
      <EmpresaForm
        open={openForm}
        onClose={handleCloseForm}
        empresa={selectedEmpresa}
        onSave={handleSaveEmpresa}
      />
    </Box>
  );
};

export default Empresas; 