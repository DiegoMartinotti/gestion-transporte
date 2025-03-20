import React, { useState } from 'react';
import { Typography, Container, Box, Tabs, Tab, Button } from '@mui/material';
import ClienteList from '../components/clientes/ClienteList';
import ClienteForm from '../components/clientes/ClienteForm';
import ClienteBulkImporter from '../components/clientes/ClienteBulkImporter';
import SitesManager from '../components/SitesManager';
import TarifarioViewer from '../components/TarifarioViewer';
import ExtrasManager from '../components/ExtrasManager';
import useNotification from '../hooks/useNotification';

/**
 * Página principal para gestión de clientes
 */
const Clientes = () => {
  // Estados para controlar diálogos y selecciones
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tarifarioOpen, setTarifarioOpen] = useState(false);
  const [selectedClienteTarifario, setSelectedClienteTarifario] = useState(null);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [currentClienteFormulas, setCurrentClienteFormulas] = useState(null);
  const [extrasManagerOpen, setExtrasManagerOpen] = useState(false);
  const [selectedClienteExtras, setSelectedClienteExtras] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [importerOpen, setImporterOpen] = useState(false);
  
  const { showNotification } = useNotification();

  /**
   * Maneja el cambio de pestaña
   * @param {Object} event - Evento de cambio
   * @param {number} newValue - Nuevo valor de pestaña
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Maneja la acción de editar un cliente
   * @param {Object} cliente - Cliente a editar (null para nuevo)
   */
  const handleEdit = (cliente) => {
    setEditingClient(cliente);
    setOpenDialog(true);
  };

  /**
   * Abre el gestor de sites para un cliente
   * @param {Object} cliente - Cliente seleccionado
   */
  const handleSites = (cliente) => {
    setSelectedClient(cliente);
  };

  /**
   * Abre el visor de tarifario para un cliente
   * @param {Object} cliente - Cliente seleccionado
   */
  const handleTarifario = (cliente) => {
    setSelectedClienteTarifario(cliente);
    setTarifarioOpen(true);
  };

  /**
   * Abre el editor de fórmulas para un cliente
   * @param {Object} cliente - Cliente seleccionado
   */
  const handleFormulas = (cliente) => {
    setCurrentClienteFormulas({
      _id: cliente._id,
      Cliente: cliente.Cliente,
      formulaPaletSider: cliente.formulaPaletSider || 'Valor * Palets + Peaje',
      formulaPaletBitren: cliente.formulaPaletBitren || 'Valor * Palets + Peaje'
    });
    setFormulaDialogOpen(true);
  };

  /**
   * Abre el gestor de extras para un cliente
   * @param {Object} cliente - Cliente seleccionado
   */
  const handleExtras = (cliente) => {
    setSelectedClienteExtras(cliente);
    setExtrasManagerOpen(true);
  };

  /**
   * Maneja la finalización de importación masiva
   */
  const handleImportComplete = () => {
    showNotification('Importación de clientes completada', 'success');
  };

  // Renderizado condicional según el estado actual
  if (selectedClient) {
    return <SitesManager 
      cliente={selectedClient.Cliente} 
      onBack={() => setSelectedClient(null)} 
    />;
  }

  if (extrasManagerOpen && selectedClienteExtras) {
    return <ExtrasManager 
      cliente={selectedClienteExtras.Cliente} 
      onBack={() => {
        setExtrasManagerOpen(false);
        setSelectedClienteExtras(null);
      }} 
    />;
  }

  if (tarifarioOpen && selectedClienteTarifario) {
    return <TarifarioViewer 
      cliente={selectedClienteTarifario.Cliente} 
      onBack={() => {
        setTarifarioOpen(false);
        setSelectedClienteTarifario(null);
      }} 
    />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Clientes
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Lista de Clientes" />
            <Tab label="Importación Masiva" />
          </Tabs>
        </Box>
        
        {/* Panel de lista de clientes */}
        {activeTab === 0 && (
          <ClienteList 
            onEdit={handleEdit}
            onSites={handleSites}
            onTarifario={handleTarifario}
            onFormulas={handleFormulas}
            onExtras={handleExtras}
          />
        )}
        
        {/* Panel de importación masiva */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Importación Masiva de Clientes
            </Typography>
            <Typography variant="body1" paragraph>
              Esta herramienta permite importar múltiples clientes desde un archivo Excel.
              Haga clic en el botón para iniciar el proceso.
            </Typography>
            <Box sx={{ my: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setImporterOpen(true)}
              >
                Iniciar Importación
              </Button>
            </Box>

            <ClienteBulkImporter 
              open={importerOpen}
              onClose={() => setImporterOpen(false)}
              onComplete={handleImportComplete}
            />
          </Box>
        )}
        
        {/* Formulario de cliente */}
        <ClienteForm 
          open={openDialog}
          cliente={editingClient}
          onClose={() => {
            setOpenDialog(false);
            setEditingClient(null);
          }}
          onSave={() => {
            showNotification(
              editingClient ? 'Cliente actualizado con éxito' : 'Cliente creado con éxito', 
              'success'
            );
          }}
        />
        
        {/* Diálogo de edición de fórmulas (pendiente extraer a componente) */}
        {currentClienteFormulas && (
          <ClienteForm 
            open={formulaDialogOpen}
            cliente={currentClienteFormulas}
            onClose={() => {
              setFormulaDialogOpen(false);
              setCurrentClienteFormulas(null);
            }}
            onSave={() => {
              showNotification('Fórmulas actualizadas con éxito', 'success');
            }}
          />
        )}
      </Box>
    </Container>
  );
};

export default Clientes; 