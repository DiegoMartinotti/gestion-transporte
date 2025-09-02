import React, { useState } from 'react';
import {
  Button,
  Stack,
  Group,
  Text,
  Paper,
  Switch,
  Checkbox,
  Alert,
  Badge,
  Box,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconDownload, IconInfoCircle } from '@tabler/icons-react';
import { useTemplateGenerator } from './hooks/useTemplateGenerator';
import { TemplateConfig } from './types/ExcelTemplateTypes';
import { ENTITY_TEMPLATES } from './constants/templateConfigs';

interface FieldListProps {
  config: TemplateConfig;
  selectedFields: string[];
  onFieldToggle: (fieldKey: string) => void;
}

const FieldList: React.FC<FieldListProps> = ({ config, selectedFields, onFieldToggle }) => (
  <Stack gap="xs">
    {config.fields.map((field) => (
      <Group key={field.key} justify="space-between" align="flex-start">
        <Group gap="sm" style={{ flex: 1 }}>
          <Checkbox
            checked={selectedFields.includes(field.key)}
            onChange={() => onFieldToggle(field.key)}
            disabled={field.required}
          />
          <Box style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={field.required ? 500 : 400}>
                {field.label}
              </Text>
              {field.required && (
                <Badge size="xs" color="red" variant="light">
                  Obligatorio
                </Badge>
              )}
              {field.description && (
                <Tooltip label={field.description}>
                  <ActionIcon size="xs" variant="subtle">
                    <IconInfoCircle size={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
            {field.description && (
              <Text size="xs" c="dimmed">
                {field.description}
              </Text>
            )}
          </Box>
        </Group>
      </Group>
    ))}
  </Stack>
);

interface ConfigurationSwitchesProps {
  config: TemplateConfig;
  referenceData: Record<string, unknown[]>;
  onConfigChange: (newConfig: Partial<TemplateConfig>) => void;
}

const ConfigurationSwitches: React.FC<ConfigurationSwitchesProps> = ({
  config,
  referenceData,
  onConfigChange,
}) => (
  <Group gap="md">
    <Switch
      label="Incluir ejemplos"
      description="Agregar fila con datos de ejemplo"
      checked={config.includeExamples}
      onChange={(event) => onConfigChange({ includeExamples: event.currentTarget.checked })}
    />
    <Switch
      label="Incluir instrucciones"
      description="Hoja adicional con instrucciones"
      checked={config.includeInstructions}
      onChange={(event) => onConfigChange({ includeInstructions: event.currentTarget.checked })}
    />
    {Object.keys(referenceData).length > 0 && (
      <Switch
        label="Incluir datos de referencia"
        description="Hojas con datos existentes para consulta"
        checked={config.includeReferenceData}
        onChange={(event) => onConfigChange({ includeReferenceData: event.currentTarget.checked })}
      />
    )}
  </Group>
);

export interface ExcelTemplateGeneratorProps {
  entityType?: keyof typeof ENTITY_TEMPLATES;
  onTemplateGenerated?: (blob: Blob, filename: string) => void;
  referenceData?: Record<string, unknown[]>;
}

export const ExcelTemplateGenerator: React.FC<ExcelTemplateGeneratorProps> = ({
  entityType = 'cliente',
  onTemplateGenerated,
  referenceData = {},
}) => {
  const [config, setConfig] = useState<TemplateConfig>(ENTITY_TEMPLATES[entityType]);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    config.fields.filter((f) => f.required).map((f) => f.key)
  );
  const { isGenerating, generateTemplate } = useTemplateGenerator();

  const handleFieldToggle = (fieldKey: string) => {
    const field = config.fields.find((f) => f.key === fieldKey);
    if (field?.required) return; // No permitir desmarcar campos requeridos

    setSelectedFields((prev) =>
      prev.includes(fieldKey) ? prev.filter((key) => key !== fieldKey) : [...prev, fieldKey]
    );
  };

  const handleGenerateTemplate = () => {
    generateTemplate(config, selectedFields, referenceData, onTemplateGenerated);
  };

  const handleConfigChange = (newConfig: Partial<TemplateConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const requiredCount = config.fields.filter((f) => f.required).length;
  const selectedCount = selectedFields.length;

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Text fw={600} size="lg">
              Generador de Plantillas Excel
            </Text>
            <Text size="sm" c="dimmed">
              {config.entityName} - {selectedCount} campos seleccionados
            </Text>
          </Box>
          <Badge color="blue" variant="light">
            {requiredCount} obligatorios
          </Badge>
        </Group>

        <Stack gap="sm">
          <Text fw={500} size="sm">
            Configuración de la plantilla:
          </Text>

          <ConfigurationSwitches
            config={config}
            referenceData={referenceData}
            onConfigChange={handleConfigChange}
          />
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Text fw={500} size="sm" mb="md">
          Campos a incluir en la plantilla:
        </Text>

        <FieldList
          config={config}
          selectedFields={selectedFields}
          onFieldToggle={handleFieldToggle}
        />
      </Paper>

      {selectedCount === 0 && (
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" title="Sin campos seleccionados">
          Debes seleccionar al menos un campo para generar la plantilla.
        </Alert>
      )}

      <Group justify="center">
        <Button
          leftSection={<IconDownload size={16} />}
          size="md"
          onClick={handleGenerateTemplate}
          loading={isGenerating}
          disabled={selectedCount === 0}
        >
          Generar y Descargar Plantilla
        </Button>
      </Group>
    </Stack>
  );
};

export default ExcelTemplateGenerator;
