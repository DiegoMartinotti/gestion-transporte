import React, { useState, useEffect } from 'react';
import {
  Typography, Container, Box, Button, IconButton, Paper,
  Tabs, Tab, CircularProgress, Alert, Tooltip, Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import formulaClienteService from '../../services/formulaClienteService';
import clienteService from '../../services/clienteService';
import FormulasList from './FormulasList';
import FormulaForm from './FormulaForm';
import useNotification from '../../hooks/useNotification';
import logger from '../../utils/logger';

/**
 * Gestor de fórmulas personalizadas con historial versionado
 * @param {Object} props
 * @param {string} props.clienteId - ID del cliente seleccionado
 * @param {string} props.clienteNombre - Nombre del cliente
 * @param {Function} props.onBack - Función para volver atrás
 */
const FormulaPersonalizadaManager = ({ clienteId, clienteNombre, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formulas, setFormulas] = useState([]);
  const [selectedTipoUnidad, setSelectedTipoUnidad] = useState('General');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState(null);
  const { showNotification } = useNotification();

  // Cargar las fórmulas al iniciar
  useEffect(() => {
    fetchFormulas();
  }, [clienteId, selectedTipoUnidad]);

  /**
   * Carga las fórmulas del cliente
   */
  const fetchFormulas = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug(`Obteniendo fórmulas para cliente ${clienteId}, tipo ${selectedTipoUnidad}...`);
      const data = await formulaClienteService.getFormulasByCliente(clienteId, {
        tipoUnidad: selectedTipoUnidad
      });
      logger.debug('Datos recibidos:', data);
      setFormulas(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error al obtener fórmulas:', error);
      setError('Error al cargar las fórmulas personalizadas');
      showNotification('Error al cargar las fórmulas', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cambio de tipo de unidad
   * @param {Object} event - Evento de cambio
   * @param {string} newValue - Nuevo valor seleccionado
   */
  const handleTipoUnidadChange = (event, newValue) => {
    setSelectedTipoUnidad(newValue);
  };

  /**
   * Abre el formulario para crear/editar una fórmula
   * @param {Object} formula - Fórmula a editar (null para nueva)
   */
  const handleOpenForm = (formula = null) => {
    setEditingFormula(formula);
    setFormDialogOpen(true);
  };

  /**
   * Cierra el formulario de fórmula
   */
  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setEditingFormula(null);
  };

  /**
   * Guarda una fórmula (nueva o editada)
   * @param {Object} formulaData - Datos de la fórmula
   */
  const handleSaveFormula = async (formulaData) => {
    try {
      setLoading(true);
      
      if (editingFormula) {
        // Actualizar fórmula existente
        await formulaClienteService.updateFormula(editingFormula._id, formulaData);
        showNotification('Fórmula actualizada correctamente', 'success');
      } else {
        // Crear nueva fórmula
        await formulaClienteService.createFormula({
          ...formulaData,
          clienteId: clienteId
        });
        showNotification('Fórmula creada correctamente', 'success');
      }
      
      // Cerrar formulario y refrescar lista
      handleCloseForm();
      fetchFormulas();
    } catch (error) {
      logger.error('Error al guardar fórmula:', error);
      showNotification(
        error.response?.data?.message || 'Error al guardar la fórmula',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una fórmula
   * @param {string} id - ID de la fórmula a eliminar
   */
  const handleDeleteFormula = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta fórmula?')) return;
    
    try {
      setLoading(true);
      await formulaClienteService.deleteFormula(id);
      showNotification('Fórmula eliminada correctamente', 'success');
      fetchFormulas();
    } catch (error) {
      logger.error('Error al eliminar fórmula:', error);
      showNotification('Error al eliminar la fórmula', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Fórmulas Personalizadas - {clienteNombre}
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Gestione las fórmulas de cálculo personalizadas para este cliente. Las fórmulas se aplican según el tipo de unidad y las fechas de vigencia.
        </Typography>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={selectedTipoUnidad}
            onChange={handleTipoUnidadChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="General" value="General" />
            <Tab label="Sider" value="Sider" />
            <Tab label="Bitren" value="Bitren" />
          </Tabs>
        </Paper>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm(null)}
          >
            Nueva Fórmula
          </Button>
        </Box>

        {loading && !formDialogOpen ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <FormulasList
            formulas={formulas}
            tipoUnidad={selectedTipoUnidad}
            onEdit={handleOpenForm}
            onDelete={handleDeleteFormula}
          />
        )}
        
        {formDialogOpen && (
          <FormulaForm
            open={formDialogOpen}
            formula={editingFormula}
            tipoUnidad={selectedTipoUnidad}
            onClose={handleCloseForm}
            onSave={handleSaveFormula}
          />
        )}
      </Box>
    </Container>
  );
};

export default FormulaPersonalizadaManager; 