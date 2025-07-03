import React, { useState, useCallback } from 'react';
import {
  Stepper,
  Group,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Alert,
  Stack,
  Badge,
  Select,
  Card,
  SimpleGrid,
  Loader,
  Center,
  Box,
  Timeline,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconUpload,
  IconTableImport,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconCloudUpload,
  IconDatabase,
  IconFileCheck,
  IconCheckupList,
  IconFileImport,
  IconHistory,
  IconRefresh,
  IconChevronRight,
  IconChevronLeft,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { ExcelUploadZone } from '../excel/ExcelUploadZone';
import ExcelDataPreview from '../excel/ExcelDataPreview';
import { ExcelValidationReport } from '../excel/ExcelValidationReport';
import { ImportProgress } from './ImportProgress';
import { ErrorCorrection } from './ErrorCorrection';
import { FileWithPath } from '@mantine/dropzone';

interface ImportWizardProps {
  entityType?: string;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
}

interface ImportResult {
  entityType: string;
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
  timestamp: Date;
}

interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
}

interface ImportState {
  file?: File;
  data: any[];
  validationErrors: ImportError[];
  correctedData: any[];
  importResult?: ImportResult;
  isValidating: boolean;
  isImporting: boolean;
}

const ENTITY_TYPES = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'personal', label: 'Personal' },
  { value: 'sites', label: 'Sites' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'tramos', label: 'Tramos' },
  { value: 'viajes', label: 'Viajes' },
  { value: 'extras', label: 'Extras' },
];

const ImportWizard: React.FC<ImportWizardProps> = ({
  entityType: initialEntityType,
  onComplete,
  onCancel,
}) => {
  const [active, setActive] = useState(0);
  const [entityType, setEntityType] = useState(initialEntityType || '');
  const [importState, setImportState] = useState<ImportState>({
    data: [],
    validationErrors: [],
    correctedData: [],
    isValidating: false,
    isImporting: false,
  });

  const nextStep = () => setActive((current) => (current < 5 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleFileUpload = useCallback((file: FileWithPath) => {
    // Procesar archivo Excel localmente (simulación)
    const data = [
      { nombre: 'Cliente 1', email: 'cliente1@email.com', ruc: '20123456789' },
      { nombre: 'Cliente 2', email: 'invalid-email', ruc: '20987654321' },
      { nombre: 'Cliente 3', email: 'cliente3@email.com', telefono: '123' },
    ];
    
    setImportState(prev => ({
      ...prev,
      file,
      data,
      validationErrors: [],
      correctedData: [],
    }));
    nextStep();
  }, []);

  const handleValidation = useCallback(async () => {
    setImportState(prev => ({ ...prev, isValidating: true }));
    
    // Simulación de validación - en producción esto llamaría al backend
    setTimeout(() => {
      const errors: ImportError[] = [];
      
      // Simular algunos errores de validación
      if (importState.data.length > 0) {
        // Error en fila 3
        errors.push({
          row: 3,
          field: 'email',
          value: 'invalid-email',
          error: 'Email inválido',
          severity: 'error',
        });
        
        // Warning en fila 5
        errors.push({
          row: 5,
          field: 'telefono',
          value: '123',
          error: 'Teléfono muy corto',
          severity: 'warning',
        });
      }
      
      setImportState(prev => ({
        ...prev,
        validationErrors: errors,
        isValidating: false,
      }));
      
      nextStep();
    }, 2000);
  }, [importState.data]);

  const handleCorrection = useCallback((correctedData: any[]) => {
    setImportState(prev => ({ ...prev, correctedData }));
    nextStep();
  }, []);

  const handleImport = useCallback(async () => {
    setImportState(prev => ({ ...prev, isImporting: true }));
    
    // Simulación de importación - en producción esto llamaría al backend
    setTimeout(() => {
      const result: ImportResult = {
        entityType,
        total: importState.data.length,
        success: importState.data.length - importState.validationErrors.filter(e => e.severity === 'error').length,
        failed: importState.validationErrors.filter(e => e.severity === 'error').length,
        errors: importState.validationErrors,
        timestamp: new Date(),
      };
      
      setImportState(prev => ({
        ...prev,
        importResult: result,
        isImporting: false,
      }));
      
      nextStep();
      
      if (onComplete) {
        onComplete(result);
      }
    }, 3000);
  }, [entityType, importState.data, importState.validationErrors, onComplete]);

  const getStepContent = () => {
    switch (active) {
      case 0:
        return (
          <Stack>
            <Title order={3}>Seleccionar tipo de entidad</Title>
            <Text c="dimmed">
              Seleccione el tipo de datos que desea importar
            </Text>
            
            <Select
              label="Tipo de entidad"
              placeholder="Seleccione una opción"
              data={ENTITY_TYPES}
              value={entityType}
              onChange={(value) => setEntityType(value || '')}
              size="md"
              required
              leftSection={<IconDatabase size={20} />}
            />
            
            {entityType && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                Asegúrese de que el archivo Excel contenga las columnas requeridas para {ENTITY_TYPES.find(e => e.value === entityType)?.label}.
                Puede descargar una plantilla desde el botón de plantillas en la sección de cada entidad.
              </Alert>
            )}
          </Stack>
        );
      
      case 1:
        return (
          <Stack>
            <Title order={3}>Cargar archivo Excel</Title>
            <Text c="dimmed">
              Arrastre un archivo Excel o haga clic para seleccionarlo
            </Text>
            
            <ExcelUploadZone
              onFileAccepted={handleFileUpload}
              maxFileSize={10 * 1024 * 1024} // 10MB
              supportedFormats={['.xlsx', '.xls']}
            />
            
            <Card withBorder>
              <Stack gap="xs">
                <Group>
                  <IconFileSpreadsheet size={20} />
                  <Text size="sm" fw={500}>Formatos aceptados:</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  • Excel 2007+ (.xlsx)
                  • Excel 97-2003 (.xls)
                  • Tamaño máximo: 10MB
                </Text>
              </Stack>
            </Card>
          </Stack>
        );
      
      case 2:
        return (
          <Stack>
            <Title order={3}>Vista previa de datos</Title>
            <Text c="dimmed">
              Revise los datos antes de continuar con la validación
            </Text>
            
            {importState.file && (
              <Group justify="space-between" mb="md">
                <Badge size="lg" variant="filled">
                  {importState.file.name}
                </Badge>
                <Badge size="lg" c="blue" variant="light">
                  {importState.data.length} registros
                </Badge>
              </Group>
            )}
            
            <ExcelDataPreview
              data={importState.data}
              columns={importState.data.length > 0 ? 
                Object.keys(importState.data[0]).map(key => ({
                  key,
                  label: key,
                  type: 'text' as const,
                  visible: true
                })) : []
              }
              pageSize={10}
              entityType={entityType}
            />
            
            <Group justify="center" mt="xl">
              <Button
                size="lg"
                rightSection={<IconCheckupList size={20} />}
                onClick={handleValidation}
                loading={importState.isValidating}
              >
                Validar datos
              </Button>
            </Group>
          </Stack>
        );
      
      case 3:
        return (
          <Stack>
            <Title order={3}>Validación de datos</Title>
            <Text c="dimmed">
              Resultado de la validación y errores encontrados
            </Text>
            
            <SimpleGrid cols={3} spacing="lg" mb="xl">
              <Card withBorder>
                <Stack gap="xs" align="center">
                  <IconFileCheck size={40} color="var(--mantine-color-green-6)" />
                  <Text size="xl" fw={700}>
                    {importState.data.length - importState.validationErrors.length}
                  </Text>
                  <Text size="sm" c="dimmed">Registros válidos</Text>
                </Stack>
              </Card>
              
              <Card withBorder>
                <Stack gap="xs" align="center">
                  <IconAlertCircle size={40} color="var(--mantine-color-yellow-6)" />
                  <Text size="xl" fw={700}>
                    {importState.validationErrors.filter(e => e.severity === 'warning').length}
                  </Text>
                  <Text size="sm" c="dimmed">Advertencias</Text>
                </Stack>
              </Card>
              
              <Card withBorder>
                <Stack gap="xs" align="center">
                  <IconX size={40} color="var(--mantine-color-red-6)" />
                  <Text size="xl" fw={700}>
                    {importState.validationErrors.filter(e => e.severity === 'error').length}
                  </Text>
                  <Text size="sm" c="dimmed">Errores</Text>
                </Stack>
              </Card>
            </SimpleGrid>
            
            <ExcelValidationReport
              validationErrors={importState.validationErrors.map(error => ({
                ...error,
                column: error.field,
                message: error.error
              }))}
              validationSummary={{
                totalRows: importState.data.length,
                validRows: importState.data.length - importState.validationErrors.filter(e => e.severity === 'error').length,
                rowsWithErrors: importState.validationErrors.filter(e => e.severity === 'error').length,
                rowsWithWarnings: importState.validationErrors.filter(e => e.severity === 'warning').length,
                totalErrors: importState.validationErrors.filter(e => e.severity === 'error').length,
                totalWarnings: importState.validationErrors.filter(e => e.severity === 'warning').length,
                duplicatedRows: [],
                missingRequiredFields: [],
                invalidDataTypes: []
              }}
              onFixSuggestion={(error) => {
                // Handle individual error fix suggestion
                console.log('Fix suggestion for error:', error);
              }}
            />
          </Stack>
        );
      
      case 4:
        return (
          <Stack>
            <Title order={3}>Proceso de importación</Title>
            <Text c="dimmed">
              Importando datos al sistema...
            </Text>
            
            <ImportProgress
              total={importState.data.length}
              processed={importState.isImporting ? Math.floor(importState.data.length * 0.7) : importState.data.length}
              errors={importState.validationErrors.filter(e => e.severity === 'error').length}
              warnings={importState.validationErrors.filter(e => e.severity === 'warning').length}
              isProcessing={importState.isImporting}
            />
            
            {!importState.isImporting && (
              <Group justify="center" mt="xl">
                <Button
                  size="lg"
                  rightSection={<IconCloudUpload size={20} />}
                  onClick={handleImport}
                  loading={importState.isImporting}
                >
                  Iniciar importación
                </Button>
              </Group>
            )}
          </Stack>
        );
      
      case 5:
        return (
          <Stack>
            <Center mb="xl">
              <IconCheck size={80} color="var(--mantine-color-green-6)" />
            </Center>
            
            <Title order={3} ta="center">
              Importación completada
            </Title>
            
            {importState.importResult && (
              <>
                <SimpleGrid cols={3} spacing="lg" mt="xl">
                  <Card withBorder>
                    <Stack gap="xs" align="center">
                      <Text size="sm" c="dimmed">Total procesados</Text>
                      <Text size="xl" fw={700}>
                        {importState.importResult.total}
                      </Text>
                    </Stack>
                  </Card>
                  
                  <Card withBorder>
                    <Stack gap="xs" align="center">
                      <Text size="sm" c="dimmed">Importados</Text>
                      <Text size="xl" fw={700} c="green">
                        {importState.importResult.success}
                      </Text>
                    </Stack>
                  </Card>
                  
                  <Card withBorder>
                    <Stack gap="xs" align="center">
                      <Text size="sm" c="dimmed">Fallidos</Text>
                      <Text size="xl" fw={700} c="red">
                        {importState.importResult.failed}
                      </Text>
                    </Stack>
                  </Card>
                </SimpleGrid>
                
                <Timeline active={-1} bulletSize={24} lineWidth={2} mt="xl">
                  <Timeline.Item
                    bullet={<IconUpload size={12} />}
                    title="Archivo cargado"
                  >
                    <Text c="dimmed" size="sm">
                      {importState.file?.name}
                    </Text>
                  </Timeline.Item>
                  
                  <Timeline.Item
                    bullet={<IconCheckupList size={12} />}
                    title="Datos validados"
                  >
                    <Text c="dimmed" size="sm">
                      {importState.validationErrors.length} errores encontrados
                    </Text>
                  </Timeline.Item>
                  
                  <Timeline.Item
                    bullet={<IconDatabase size={12} />}
                    title="Importación completada"
                  >
                    <Text c="dimmed" size="sm">
                      {new Date(importState.importResult.timestamp).toLocaleString()}
                    </Text>
                  </Timeline.Item>
                </Timeline>
              </>
            )}
          </Stack>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container size="lg">
      <Paper shadow="sm" p="xl" radius="md">
        <Group justify="space-between" mb="xl">
          <Title order={2}>Importación de datos</Title>
          {onCancel && (
            <Button variant="subtle" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </Group>
        
        <Stepper
          active={active}
          onStepClick={setActive}
          mb="xl"
        >
          <Stepper.Step
            label="Tipo de datos"
            description="Seleccionar entidad"
            icon={<IconDatabase size={18} />}
            loading={false}
          />
          <Stepper.Step
            label="Cargar archivo"
            description="Subir Excel"
            icon={<IconUpload size={18} />}
            loading={false}
          />
          <Stepper.Step
            label="Vista previa"
            description="Revisar datos"
            icon={<IconTableImport size={18} />}
            loading={false}
          />
          <Stepper.Step
            label="Validación"
            description="Verificar errores"
            icon={<IconCheckupList size={18} />}
            loading={importState.isValidating}
          />
          <Stepper.Step
            label="Importación"
            description="Procesar datos"
            icon={<IconCloudUpload size={18} />}
            loading={importState.isImporting}
          />
          <Stepper.Step
            label="Completado"
            description="Resultado final"
            icon={<IconCheck size={18} />}
            loading={false}
          />
        </Stepper>
        
        <Divider my="xl" />
        
        <Box style={{ minHeight: 400 }}>
          {getStepContent()}
        </Box>
        
        <Divider my="xl" />
        
        <Group justify="space-between">
          <Button
            variant="default"
            onClick={prevStep}
            disabled={active === 0}
            leftSection={<IconChevronLeft size={16} />}
          >
            Anterior
          </Button>
          
          {active < 5 && active !== 2 && active !== 4 && (
            <Button
              onClick={nextStep}
              disabled={
                (active === 0 && !entityType) ||
                (active === 1 && !importState.file)
              }
              rightSection={<IconChevronRight size={16} />}
            >
              Siguiente
            </Button>
          )}
          
          {active === 5 && (
            <Group>
              <Button
                variant="light"
                leftSection={<IconHistory size={16} />}
                onClick={() => {
                  // Ir al historial de importaciones
                }}
              >
                Ver historial
              </Button>
              <Button
                variant="filled"
                leftSection={<IconRefresh size={16} />}
                onClick={() => {
                  setActive(0);
                  setImportState({
                    data: [],
                    validationErrors: [],
                    correctedData: [],
                    isValidating: false,
                    isImporting: false,
                  });
                }}
              >
                Nueva importación
              </Button>
            </Group>
          )}
        </Group>
      </Paper>
    </Container>
  );
};

// Comparador para React.memo
const arePropsEqual = (prevProps: ImportWizardProps, nextProps: ImportWizardProps): boolean => {
  return (
    prevProps.entityType === nextProps.entityType &&
    prevProps.onComplete === nextProps.onComplete &&
    prevProps.onCancel === nextProps.onCancel
  );
};

export default React.memo(ImportWizard, arePropsEqual);