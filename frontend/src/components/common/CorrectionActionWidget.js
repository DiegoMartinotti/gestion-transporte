import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
  Paper,
  Divider
} from '@mui/material';
import { Download, UploadFile, CheckCircle, Error, CloudUpload } from '@mui/icons-material';

/**
 * Widget reutilizable para mostrar acciones de corrección (descargar plantilla, subir archivo, procesar).
 * Se usa dentro de ViajeBulkImporter para cada tipo de error corregible.
 */
const CorrectionActionWidget = ({
  templateType,
  label,
  count,
  onDownload,
  onFileChange,
  onProcess,
  selectedFile,
  processingStatus,
  isLoading
}) => {

  const handleButtonClick = () => {
    // Lógica para simular clic en input oculto podría ir aquí si fuera necesario,
    // pero el Button con component="label" ya lo maneja.
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}> {/* Añadido mb para separación */}
      <Typography variant="subtitle1" gutterBottom>
        {label}: {count}
      </Typography>
      <Divider sx={{ mb: 1.5 }} /> {/* Separador */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}> {/* Flex column para ordenar botones */}

        {/* Descargar Plantilla */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download />}
          onClick={() => onDownload(templateType)}
          disabled={isLoading}
          fullWidth // Ocupar ancho completo
        >
          Descargar Plantilla {templateType}
        </Button>

        {/* Subir Plantilla */}
        <Button
          variant="contained"
          component="label" // Hace que el botón actúe como label para el input
          size="small"
          startIcon={<UploadFile />}
          disabled={isLoading}
          fullWidth // Ocupar ancho completo
        >
          Subir {templateType}
          <input
            type="file"
            hidden
            accept=".xlsx, .xls"
            // Resetear key para permitir subir el mismo archivo si se canceló antes
            key={selectedFile ? selectedFile.name + selectedFile.lastModified : 'file-input-' + templateType}
            onChange={(e) => onFileChange(e, templateType)}
          />
        </Button>

        {/* Mostrar Archivo Seleccionado */}
        {selectedFile && (
          <Typography variant="caption" display="block" sx={{ mt: -0.5, textAlign: 'center' }}> {/* Ajuste margen y centrado */}
            Archivo: {selectedFile.name}
          </Typography>
        )}

        {/* Procesar Plantilla */}
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<CloudUpload />}
          onClick={() => onProcess(templateType)}
          disabled={isLoading || !selectedFile || processingStatus?.status === 'processing'}
          fullWidth // Ocupar ancho completo
        >
          {processingStatus?.status === 'processing' ? <CircularProgress size={20} color="inherit" /> : `Procesar ${templateType}`}
        </Button>

        {/* Estado del Procesamiento */}
        <Collapse in={!!processingStatus} timeout="auto" unmountOnExit>
          <Alert
            severity={processingStatus?.status === 'success' ? 'success' : processingStatus?.status === 'error' ? 'error' : 'info'}
            icon={
              processingStatus?.status === 'success' ? <CheckCircle fontSize="inherit" /> :
              processingStatus?.status === 'error' ? <Error fontSize="inherit" /> :
              processingStatus?.status === 'processing' ? <CircularProgress size={16} color="inherit" /> : // Icono para 'processing'
              false // No icono para otros estados como 'idle' o indefinido
            }
            sx={{ mt: 1 }} // Margen superior
          >
            {processingStatus?.message || 'Procesando...'}
          </Alert>
        </Collapse>
      </Box>
    </Paper>
  );
};

CorrectionActionWidget.propTypes = {
  templateType: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  onDownload: PropTypes.func.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onProcess: PropTypes.func.isRequired,
  selectedFile: PropTypes.object, // Puede ser null
  processingStatus: PropTypes.shape({
    status: PropTypes.oneOf(['idle', 'processing', 'success', 'error']),
    message: PropTypes.string,
  }),
  isLoading: PropTypes.bool.isRequired,
};

export default CorrectionActionWidget; 