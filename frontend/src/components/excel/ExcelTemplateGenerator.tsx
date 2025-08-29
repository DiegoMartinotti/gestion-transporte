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
import {
  IconDownload,
  IconInfoCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useTemplateGenerator } from './hooks/useTemplateGenerator';

export interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  description?: string;
  example?: string;
  validation?: string;
}

export interface TemplateConfig {
  entityType: string;
  entityName: string;
  fields: FieldConfig[];
  includeExamples: boolean;
  includeValidation: boolean;
  includeInstructions: boolean;
  includeReferenceData: boolean;
}

const ENTITY_TEMPLATES: Record<string, TemplateConfig> = {
  cliente: {
    entityType: 'cliente',
    entityName: 'Clientes',
    includeExamples: true,
    includeValidation: true,
    includeInstructions: true,
    includeReferenceData: false,
    fields: [
      {
        key: 'nombre',
        label: 'Nombre*',
        required: true,
        type: 'text',
        description: 'Razón social o nombre comercial del cliente',
        example: 'Empresa Transportes ABC S.A.',
        validation: 'Mínimo 2 caracteres, máximo 100',
      },
      {
        key: 'cuit',
        label: 'CUIT*',
        required: true,
        type: 'text',
        description: 'CUIT sin guiones ni espacios',
        example: '20123456789',
        validation: 'Formato: 11 dígitos',
      },
      {
        key: 'email',
        label: 'Email',
        required: false,
        type: 'text',
        description: 'Correo electrónico de contacto',
        example: 'contacto@empresa.com',
        validation: 'Formato de email válido',
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        required: false,
        type: 'text',
        description: 'Número de teléfono',
        example: '+54 11 1234-5678',
      },
      {
        key: 'direccion',
        label: 'Dirección',
        required: false,
        type: 'text',
        description: 'Dirección fiscal',
        example: 'Av. Corrientes 1234, CABA',
      },
      {
        key: 'activo',
        label: 'Activo',
        required: false,
        type: 'boolean',
        description: 'Estado del cliente (VERDADERO/FALSO)',
        example: 'VERDADERO',
        validation: 'VERDADERO o FALSO',
      },
    ],
  },
  empresa: {
    entityType: 'empresa',
    entityName: 'Empresas',
    includeExamples: true,
    includeValidation: true,
    includeInstructions: true,
    includeReferenceData: false,
    fields: [
      {
        key: 'nombre',
        label: 'Nombre*',
        required: true,
        type: 'text',
        description: 'Nombre de la empresa',
        example: 'Transportes del Sur',
      },
      {
        key: 'tipo',
        label: 'Tipo*',
        required: true,
        type: 'select',
        options: ['Propia', 'Subcontratada'],
        description: 'Tipo de empresa',
        example: 'Propia',
      },
      {
        key: 'cuit',
        label: 'CUIT*',
        required: true,
        type: 'text',
        description: 'CUIT de la empresa',
        example: '30123456789',
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        required: false,
        type: 'text',
        description: 'Teléfono de contacto',
        example: '+54 11 1234-5678',
      },
      {
        key: 'email',
        label: 'Email',
        required: false,
        type: 'text',
        description: 'Email de contacto',
        example: 'info@empresa.com',
      },
    ],
  },
  personal: {
    entityType: 'personal',
    entityName: 'Personal',
    includeExamples: true,
    includeValidation: true,
    includeInstructions: true,
    includeReferenceData: true,
    fields: [
      {
        key: 'nombre',
        label: 'Nombre*',
        required: true,
        type: 'text',
        description: 'Nombre completo',
        example: 'Juan Carlos Pérez',
      },
      {
        key: 'dni',
        label: 'DNI*',
        required: true,
        type: 'text',
        description: 'Documento Nacional de Identidad',
        example: '12345678',
      },
      {
        key: 'tipoPersonal',
        label: 'Tipo Personal*',
        required: true,
        type: 'select',
        options: ['Conductor', 'Ayudante', 'Administrativo', 'Mantenimiento'],
        description: 'Tipo de personal',
        example: 'Conductor',
      },
      {
        key: 'empresaId',
        label: 'ID Empresa*',
        required: true,
        type: 'text',
        description: 'ID de la empresa (ver hoja Referencias)',
        example: '507f1f77bcf86cd799439011',
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        required: false,
        type: 'text',
        description: 'Teléfono de contacto',
        example: '+54 11 9876-5432',
      },
      {
        key: 'email',
        label: 'Email',
        required: false,
        type: 'text',
        description: 'Email personal',
        example: 'juan.perez@email.com',
      },
    ],
  },
  sites: {
    entityType: 'sites',
    entityName: 'Sites',
    includeExamples: true,
    includeValidation: true,
    includeInstructions: true,
    includeReferenceData: true,
    fields: [
      {
        key: 'nombre',
        label: 'Nombre *',
        required: true,
        type: 'text',
        description: 'Nombre del sitio',
        example: 'Almacén Central',
        validation: 'Mínimo 2 caracteres, único por cliente',
      },
      {
        key: 'cliente',
        label: 'Cliente *',
        required: true,
        type: 'text',
        description: 'Nombre del cliente (debe existir en el sistema)',
        example: 'Empresa Ejemplo S.A.C.',
      },
      {
        key: 'codigo',
        label: 'Código',
        required: false,
        type: 'text',
        description: 'Código identificador único por cliente',
        example: 'ALM001',
      },
      {
        key: 'direccion',
        label: 'Dirección',
        required: false,
        type: 'text',
        description: 'Dirección completa del sitio',
        example: 'Av. Industrial 123, Buenos Aires',
      },
      {
        key: 'localidad',
        label: 'Localidad',
        required: false,
        type: 'text',
        description: 'Ciudad o localidad',
        example: 'Capital Federal',
      },
      {
        key: 'provincia',
        label: 'Provincia',
        required: false,
        type: 'text',
        description: 'Provincia o estado',
        example: 'Buenos Aires',
      },
      {
        key: 'longitud',
        label: 'Longitud',
        required: false,
        type: 'number',
        description: 'Coordenada GPS (-180 a 180)',
        example: '-58.3816',
      },
      {
        key: 'latitud',
        label: 'Latitud',
        required: false,
        type: 'number',
        description: 'Coordenada GPS (-90 a 90)',
        example: '-34.6037',
      },
    ],
  },
};

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
    config.fields.filter(f => f.required).map(f => f.key)
  );
  const { isGenerating, generateTemplate } = useTemplateGenerator();

  const handleFieldToggle = (fieldKey: string) => {
    const field = config.fields.find(f => f.key === fieldKey);
    if (field?.required) return; // No permitir desmarcar campos requeridos

    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleGenerateTemplate = () => {
    generateTemplate(config, selectedFields, referenceData, onTemplateGenerated);
  };

  };


  const requiredCount = config.fields.filter(f => f.required).length;
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
          
          <Group gap="md">
            <Switch
              label="Incluir ejemplos"
              description="Agregar fila con datos de ejemplo"
              checked={config.includeExamples}
              onChange={(event) => 
                setConfig(prev => ({ 
                  ...prev, 
                  includeExamples: event.currentTarget.checked 
                }))
              }
            />
            
            <Switch
              label="Incluir instrucciones"
              description="Hoja adicional con instrucciones"
              checked={config.includeInstructions}
              onChange={(event) => 
                setConfig(prev => ({ 
                  ...prev, 
                  includeInstructions: event.currentTarget.checked 
                }))
              }
            />
            
            {Object.keys(referenceData).length > 0 && (
              <Switch
                label="Incluir datos de referencia"
                description="Hojas con datos existentes para consulta"
                checked={config.includeReferenceData}
                onChange={(event) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    includeReferenceData: event.currentTarget.checked 
                  }))
                }
              />
            )}
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Text fw={500} size="sm" mb="md">
          Campos a incluir en la plantilla:
        </Text>
        
        <Stack gap="xs">
          {config.fields.map((field) => (
            <Group key={field.key} justify="space-between" align="flex-start">
              <Group gap="sm" style={{ flex: 1 }}>
                <Checkbox
                  checked={selectedFields.includes(field.key)}
                  onChange={() => handleFieldToggle(field.key)}
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
      </Paper>

      {selectedCount === 0 && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="yellow"
          title="Sin campos seleccionados"
        >
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