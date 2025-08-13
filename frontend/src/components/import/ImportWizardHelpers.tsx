import React from 'react';
import { Stack, Title, Text, Alert, Select, Card, Group, Badge, SimpleGrid } from '@mantine/core';
import {
  IconDatabase,
  IconAlertCircle,
  IconFileSpreadsheet,
  IconFileCheck,
} from '@tabler/icons-react';
import { ExcelUploadZone } from '../excel/ExcelUploadZone';
import ExcelDataPreview from '../excel/ExcelDataPreview';
import { ExcelValidationReport } from '../excel/ExcelValidationReport';
import { ImportProgress } from './ImportProgress';
import { FileWithPath } from '@mantine/dropzone';
import { ImportState } from './ImportWizardTypes';

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

interface EntitySelectionStepProps {
  entityType: string;
  onEntityTypeChange: (value: string) => void;
}

export const EntitySelectionStep: React.FC<EntitySelectionStepProps> = ({
  entityType,
  onEntityTypeChange,
}) => (
  <Stack>
    <Title order={3}>Seleccionar tipo de entidad</Title>
    <Text c="dimmed">Seleccione el tipo de datos que desea importar</Text>

    <Select
      label="Tipo de entidad"
      placeholder="Seleccione una opción"
      data={ENTITY_TYPES}
      value={entityType}
      onChange={(value) => onEntityTypeChange(value || '')}
      size="md"
      required
      leftSection={<IconDatabase size={20} />}
    />

    {entityType && (
      <Alert icon={<IconAlertCircle size={16} />} color="blue">
        Asegúrese de que el archivo Excel contenga las columnas requeridas para{' '}
        {ENTITY_TYPES.find((e) => e.value === entityType)?.label}. Puede descargar una plantilla
        desde el botón de plantillas en la sección de cada entidad.
      </Alert>
    )}
  </Stack>
);

interface FileUploadStepProps {
  entityType: string;
  onFileUpload: (file: FileWithPath) => void;
  onTemplateDownload: () => Promise<void>;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({
  entityType,
  onFileUpload,
  onTemplateDownload,
}) => (
  <Stack>
    <Title order={3}>Cargar archivo Excel</Title>
    <Text c="dimmed">Arrastre un archivo Excel o haga clic para seleccionarlo</Text>

    <ExcelUploadZone
      onFileAccepted={onFileUpload}
      maxFileSize={10 * 1024 * 1024} // 10MB
      supportedFormats={['.xlsx', '.xls']}
      onTemplateDownload={entityType ? onTemplateDownload : undefined}
      entityType={entityType}
      showTemplate={true}
    />

    <Card withBorder>
      <Stack gap="xs">
        <Group>
          <IconFileSpreadsheet size={20} />
          <Text size="sm" fw={500}>
            Formatos aceptados:
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          • Excel 2007+ (.xlsx) • Excel 97-2003 (.xls) • Tamaño máximo: 10MB
        </Text>
      </Stack>
    </Card>
  </Stack>
);

interface DataPreviewStepProps {
  importState: ImportState;
  entityType: string;
}

export const DataPreviewStep: React.FC<DataPreviewStepProps> = ({ importState, entityType }) => (
  <Stack>
    <Title order={3}>Vista previa de datos</Title>
    <Text c="dimmed">Revise los datos antes de continuar con la validación</Text>

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
      columns={
        importState.data.length > 0
          ? Object.keys(importState.data[0]).map((key) => ({
              key,
              label: key,
              type: 'text' as const,
              visible: true,
            }))
          : []
      }
      pageSize={10}
      entityType={entityType}
    />
  </Stack>
);

interface ValidationStepProps {
  importState: ImportState;
}

export const ValidationStep: React.FC<ValidationStepProps> = ({ importState }) => (
  <Stack>
    <Title order={3}>Validación de datos</Title>
    <Text c="dimmed">Resultado de la validación y errores encontrados</Text>

    <SimpleGrid cols={3} spacing="lg" mb="xl">
      <Card withBorder>
        <Stack gap="xs" align="center">
          <IconFileCheck size={40} color="var(--mantine-color-green-6)" />
          <Text size="xl" fw={700}>
            {importState.data.length - importState.validationErrors.length}
          </Text>
          <Text size="sm" c="dimmed">
            Registros válidos
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="xs" align="center">
          <IconAlertCircle size={40} color="var(--mantine-color-yellow-6)" />
          <Text size="xl" fw={700}>
            {importState.validationErrors.filter((e) => e.severity === 'warning').length}
          </Text>
          <Text size="sm" c="dimmed">
            Advertencias
          </Text>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="xs" align="center">
          <IconAlertCircle size={40} color="var(--mantine-color-red-6)" />
          <Text size="xl" fw={700}>
            {importState.validationErrors.filter((e) => e.severity === 'error').length}
          </Text>
          <Text size="sm" c="dimmed">
            Errores
          </Text>
        </Stack>
      </Card>
    </SimpleGrid>

    <ExcelValidationReport
      validationErrors={importState.validationErrors.map((error) => ({
        ...error,
        column: error.field,
        message: error.error,
      }))}
      validationSummary={{
        totalRows: importState.data.length,
        validRows:
          importState.data.length -
          importState.validationErrors.filter((e) => e.severity === 'error').length,
        rowsWithErrors: importState.validationErrors.filter((e) => e.severity === 'error').length,
        rowsWithWarnings: importState.validationErrors.filter((e) => e.severity === 'warning')
          .length,
        totalErrors: importState.validationErrors.filter((e) => e.severity === 'error').length,
        totalWarnings: importState.validationErrors.filter((e) => e.severity === 'warning').length,
        duplicatedRows: [],
        missingRequiredFields: [],
        invalidDataTypes: [],
      }}
      onFixSuggestion={(error) => {
        console.log('Fix suggestion for error:', error);
      }}
    />
  </Stack>
);

interface ImportStepProps {
  importState: ImportState;
}

export const ImportStep: React.FC<ImportStepProps> = ({ importState }) => (
  <Stack>
    <Title order={3}>Proceso de importación</Title>
    <Text c="dimmed">Importando datos al sistema...</Text>

    <ImportProgress
      total={importState.data.length}
      processed={
        importState.isImporting
          ? Math.floor(importState.data.length * 0.7)
          : importState.data.length
      }
      errors={importState.validationErrors.filter((e) => e.severity === 'error').length}
      warnings={importState.validationErrors.filter((e) => e.severity === 'warning').length}
      isProcessing={importState.isImporting}
    />
  </Stack>
);

interface CompletionStepProps {
  importState: ImportState;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ importState }) => (
  <Stack>
    <Title order={3} ta="center">
      Importación completada
    </Title>

    {importState.importResult && (
      <SimpleGrid cols={3} spacing="lg" mt="xl">
        <Card withBorder>
          <Stack gap="xs" align="center">
            <Text size="sm" c="dimmed">
              Total procesados
            </Text>
            <Text size="xl" fw={700}>
              {importState.importResult.total}
            </Text>
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="xs" align="center">
            <Text size="sm" c="dimmed">
              Importados
            </Text>
            <Text size="xl" fw={700} c="green">
              {importState.importResult.success}
            </Text>
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="xs" align="center">
            <Text size="sm" c="dimmed">
              Fallidos
            </Text>
            <Text size="xl" fw={700} c="red">
              {importState.importResult.failed}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>
    )}
  </Stack>
);
