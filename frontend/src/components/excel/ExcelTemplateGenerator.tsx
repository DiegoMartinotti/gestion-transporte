import React, { useState } from 'react';
import {
  Button,
  Stack,
  Group,
  Text,
  Paper,
  Switch,
  Checkbox,
  Select,
  Alert,
  Divider,
  Badge,
  Box,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconSettings,
  IconInfoCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';

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
  referenceData?: Record<string, any[]>;
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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFieldToggle = (fieldKey: string) => {
    const field = config.fields.find(f => f.key === fieldKey);
    if (field?.required) return; // No permitir desmarcar campos requeridos

    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const generateTemplate = async () => {
    setIsGenerating(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Crear hoja principal con plantilla
      const templateData = createTemplateSheet();
      const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
      
      // Aplicar estilos y validaciones
      applySheetFormatting(templateSheet);
      
      XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla');
      
      // Agregar hoja de instrucciones si está habilitada
      if (config.includeInstructions) {
        const instructionsSheet = createInstructionsSheet();
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
      }
      
      // Agregar hojas de referencia si está habilitada
      if (config.includeReferenceData && Object.keys(referenceData).length > 0) {
        Object.entries(referenceData).forEach(([key, data]) => {
          const refSheet = createReferenceSheet(key, data);
          XLSX.utils.book_append_sheet(workbook, refSheet, `Ref_${key}`);
        });
      }
      
      // Generar archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const filename = `plantilla_${config.entityType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Descargar archivo
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onTemplateGenerated?.(blob, filename);
      
      notifications.show({
        title: 'Plantilla generada',
        message: `La plantilla de ${config.entityName} se descargó correctamente`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
    } catch (error) {
      console.error('Error generating template:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo generar la plantilla',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createTemplateSheet = () => {
    const selectedFieldConfigs = config.fields.filter(f => 
      selectedFields.includes(f.key)
    );
    
    const headers = selectedFieldConfigs.map(f => f.label);
    const examples = config.includeExamples 
      ? selectedFieldConfigs.map(f => f.example || '') 
      : [];
    
    const data = [headers];
    if (examples.length > 0) {
      data.push(examples);
    }
    
    return data;
  };

  const createInstructionsSheet = () => {
    const instructions = [
      ['INSTRUCCIONES PARA IMPORTACIÓN DE ' + config.entityName.toUpperCase()],
      [''],
      ['1. Campos Obligatorios (marcados con *):'],
      ...config.fields
        .filter(f => f.required && selectedFields.includes(f.key))
        .map(f => [`   - ${f.label}: ${f.description || ''}`]),
      [''],
      ['2. Campos Opcionales:'],
      ...config.fields
        .filter(f => !f.required && selectedFields.includes(f.key))
        .map(f => [`   - ${f.label}: ${f.description || ''}`]),
      [''],
      ['3. Validaciones:'],
      ...config.fields
        .filter(f => f.validation && selectedFields.includes(f.key))
        .map(f => [`   - ${f.label}: ${f.validation}`]),
      [''],
      ['4. Formato del archivo:'],
      ['   - Usar solo la hoja "Plantilla"'],
      ['   - No modificar los nombres de las columnas'],
      ['   - Los campos obligatorios no pueden estar vacíos'],
      ['   - Eliminar las filas de ejemplo antes de importar'],
      [''],
      ['5. Proceso de importación:'],
      ['   - Completar todos los datos en la hoja "Plantilla"'],
      ['   - Guardar el archivo en formato Excel (.xlsx)'],
      ['   - Subir el archivo usando el sistema de importación'],
    ];
    
    return XLSX.utils.aoa_to_sheet(instructions);
  };

  const createReferenceSheet = (entityType: string, data: any[]) => {
    if (data.length === 0) return XLSX.utils.aoa_to_sheet([['Sin datos']]);
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header] || ''));
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  };

  const applySheetFormatting = (sheet: XLSX.WorkSheet) => {
    // Aplicar formato básico (esto es limitado en SheetJS sin la versión pro)
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    // Establecer anchos de columna
    const colWidths = [];
    for (let i = 0; i <= range.e.c; i++) {
      colWidths.push({ width: 20 });
    }
    sheet['!cols'] = colWidths;
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
          onClick={generateTemplate}
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