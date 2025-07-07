import { useState, useRef } from 'react';
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Stepper,
  Alert,
  Switch,
  Progress,
  Title,
  Divider,
  Badge,
  ScrollArea,
  ActionIcon,
  Box
} from '@mantine/core';
import {
  IconFileUpload,
  IconFileCheck,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconEye,
  IconRefresh,
  IconDownload
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ExcelUploadZone } from '../excel/ExcelUploadZone';
import ExcelDataPreview from '../excel/ExcelDataPreview';
import { ExcelValidationReport } from '../excel/ExcelValidationReport';
import { ExcelImportProgress } from '../excel/ExcelImportProgress';

interface ExcelImportModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  entityType: 'cliente' | 'empresa' | 'personal' | 'sites';
  onImportComplete?: (result: any) => void;
  processExcelFile: (file: File, options: any) => Promise<any>;
  validateExcelFile: (file: File) => Promise<any>;
  previewExcelFile: (file: File, sampleSize?: number) => Promise<any>;
  getTemplate: () => Promise<void>;
}

export function ExcelImportModal({
  opened,
  onClose,
  title,
  entityType,
  onImportComplete,
  processExcelFile,
  validateExcelFile,
  previewExcelFile,
  getTemplate
}: ExcelImportModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [skipInvalidRows, setSkipInvalidRows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  // Función para descargar plantilla usando los servicios Excel
  const handleTemplateDownload = async () => {
    try {
      await getTemplate();
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      throw error;
    }
  };

  const resetState = () => {
    setCurrentStep(0);
    setFile(null);
    setPreviewData(null);
    setValidationResult(null);
    setImportProgress(0);
    setImportResult(null);
    setError(null);
    setLoading(false);
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setLoading(true);
      setError(null);
      setFile(uploadedFile);

      // Preview data
      const preview = await previewExcelFile(uploadedFile, 10);
      setPreviewData(preview);

      // Validate data
      const validation = await validateExcelFile(uploadedFile);
      setValidationResult(validation);

      setCurrentStep(1);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo');
      notifications.show({
        title: 'Error',
        message: 'No se pudo procesar el archivo Excel',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidationReview = () => {
    if (validationResult?.validationResult?.isValid || skipInvalidRows) {
      setCurrentStep(2);
    } else {
      notifications.show({
        title: 'Validación pendiente',
        message: 'Debe corregir los errores o habilitar "Saltar filas inválidas"',
        color: 'orange'
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setImportProgress(0);
      abortController.current = new AbortController();

      const options = {
        autoCorrect,
        skipInvalidRows,
        progressCallback: (progress: any) => {
          setImportProgress(progress.percentage || 0);
        }
      };

      const result = await processExcelFile(file, options);
      setImportResult(result);
      setCurrentStep(3);

      notifications.show({
        title: 'Importación completada',
        message: `Se importaron ${result.summary?.insertedRows || 0} registros correctamente`,
        color: 'green'
      });

      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err: any) {
      setError(err.message || 'Error durante la importación');
      notifications.show({
        title: 'Error en importación',
        message: err.message || 'Error durante la importación',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await getTemplate();
      notifications.show({
        title: 'Plantilla descargada',
        message: 'La plantilla Excel ha sido descargada',
        color: 'green'
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo descargar la plantilla',
        color: 'red'
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Stack gap="md">
            <Alert icon={<IconFileUpload size="1rem" />} color="blue">
              <Stack gap="xs">
                <Text size="sm">
                  Seleccione un archivo Excel (.xlsx) con los datos a importar.
                </Text>
                <Text size="xs" c="dimmed">
                  Los archivos deben seguir el formato de la plantilla oficial.
                </Text>
              </Stack>
            </Alert>

            <ExcelUploadZone
              onFileAccepted={handleFileUpload}
              isProcessing={loading}
              maxFileSize={10 * 1024 * 1024} // 10MB
              entityType={entityType}
              onTemplateDownload={handleTemplateDownload}
              showTemplate={true}
            />
          </Stack>
        );

      case 1:
        return (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Revisión de Datos</Title>
              <Badge color={validationResult?.validationResult?.isValid ? 'green' : 'red'}>
                {validationResult?.validationResult?.isValid ? 'Válido' : 'Con errores'}
              </Badge>
            </Group>

            {previewData && (
              <Stack gap="sm">
                <Text size="sm" fw={500}>Vista previa de datos:</Text>
                <ScrollArea h={200}>
                  <ExcelDataPreview 
                    data={previewData.samples?.[0]?.sample || []}
                    columns={[]} // Will auto-detect columns
                    entityType={entityType}
                  />
                </ScrollArea>
              </Stack>
            )}

            <Divider />

            {validationResult && (
              <Stack gap="sm">
                <Text size="sm" fw={500}>Resultado de validación:</Text>
                <ExcelValidationReport 
                  validationErrors={validationResult.validationResult?.errors || []}
                  validationSummary={{
                    totalRows: validationResult.processedData?.data?.length || 0,
                    validRows: validationResult.validationResult?.summary?.validRows || 0,
                    rowsWithErrors: validationResult.validationResult?.summary?.errorRows || 0,
                    rowsWithWarnings: validationResult.validationResult?.summary?.warningRows || 0,
                    totalErrors: validationResult.validationResult?.errors?.length || 0,
                    totalWarnings: validationResult.validationResult?.warnings?.length || 0,
                    duplicatedRows: [],
                    missingRequiredFields: [],
                    invalidDataTypes: []
                  }}
                  entityType={entityType}
                />
              </Stack>
            )}

            <Stack gap="xs">
              <Text size="sm" fw={500}>Opciones de importación:</Text>
              <Switch
                label="Auto-corregir errores menores"
                description="Corrige automáticamente formatos de CUIT, DNI, fechas, etc."
                checked={autoCorrect}
                onChange={(e) => setAutoCorrect(e.currentTarget.checked)}
              />
              <Switch
                label="Saltar filas con errores"
                description="Continúa la importación ignorando filas inválidas"
                checked={skipInvalidRows}
                onChange={(e) => setSkipInvalidRows(e.currentTarget.checked)}
              />
            </Stack>

            <Group justify="space-between" mt="md">
              <Button variant="subtle" onClick={() => setCurrentStep(0)}>
                Atrás
              </Button>
              <Button onClick={handleValidationReview}>
                Continuar Importación
              </Button>
            </Group>
          </Stack>
        );

      case 2:
        return (
          <Stack gap="md">
            <Alert icon={<IconAlertTriangle size="1rem" />} color="orange">
              <Text size="sm">
                ¿Está seguro de que desea importar los datos? Esta acción no se puede deshacer.
              </Text>
            </Alert>

            <Box>
              <Text size="sm" fw={500} mb="xs">Resumen de importación:</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Total de filas:</Text>
                  <Badge variant="light">{validationResult?.processedData?.data?.length || 0}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Filas válidas:</Text>
                  <Badge color="green" variant="light">
                    {validationResult?.validationResult?.summary?.validRows || 0}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Filas con errores:</Text>
                  <Badge color="red" variant="light">
                    {validationResult?.validationResult?.summary?.errorRows || 0}
                  </Badge>
                </Group>
              </Stack>
            </Box>

            {loading && (
              <Stack gap="sm">
                <Text size="sm">Importando datos...</Text>
                <Progress value={importProgress} animated />
                <Text size="xs" c="dimmed" ta="center">
                  {importProgress}% completado
                </Text>
              </Stack>
            )}

            <Group justify="space-between" mt="md">
              <Button variant="subtle" onClick={() => setCurrentStep(1)} disabled={loading}>
                Atrás
              </Button>
              <Button
                onClick={handleImport}
                loading={loading}
                disabled={loading}
              >
                Importar Datos
              </Button>
            </Group>
          </Stack>
        );

      case 3:
        return (
          <Stack gap="md" align="center">
            <ActionIcon size="xl" color="green" variant="light" radius="xl">
              <IconCheck size="2rem" />
            </ActionIcon>

            <Stack gap="xs" align="center">
              <Title order={4} c="green">¡Importación Completada!</Title>
              <Text size="sm" c="dimmed" ta="center">
                Los datos se han importado correctamente al sistema.
              </Text>
            </Stack>

            {importResult && (
              <Box w="100%">
                <Text size="sm" fw={500} mb="xs">Resultados:</Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Registros importados:</Text>
                    <Badge color="green" variant="light">
                      {importResult.summary?.insertedRows || 0}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Registros con errores:</Text>
                    <Badge color="red" variant="light">
                      {importResult.summary?.errorRows || 0}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Total procesado:</Text>
                    <Badge variant="light">
                      {importResult.summary?.totalRows || 0}
                    </Badge>
                  </Group>
                </Stack>
              </Box>
            )}

            <Group mt="md">
              <Button variant="subtle" onClick={handleClose}>
                Cerrar
              </Button>
              <Button onClick={() => {
                setCurrentStep(0);
                setFile(null);
                setPreviewData(null);
                setValidationResult(null);
                setImportResult(null);
              }}>
                Importar Otro Archivo
              </Button>
            </Group>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={!loading}
    >
      <Stack gap="lg">
        <Stepper active={currentStep}>
          <Stepper.Step 
            label="Cargar Archivo" 
            description="Seleccionar archivo Excel"
            icon={<IconFileUpload size="1rem" />}
          />
          <Stepper.Step 
            label="Validar Datos" 
            description="Revisar y configurar"
            icon={<IconFileCheck size="1rem" />}
          />
          <Stepper.Step 
            label="Importar" 
            description="Ejecutar importación"
            icon={<IconCheck size="1rem" />}
          />
          <Stepper.Step 
            label="Completado" 
            description="Resultados"
            icon={<IconCheck size="1rem" />}
          />
        </Stepper>

        {error && (
          <Alert icon={<IconX size="1rem" />} color="red" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Stack>
    </Modal>
  );
}

export default ExcelImportModal;