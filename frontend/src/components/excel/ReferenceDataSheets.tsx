import React, { useState, useMemo } from 'react';
import {
  Stack,
  Paper,
  Text,
  Group,
  Button,
  Select,
  Badge,
  Alert,
  Box,
  ThemeIcon,
  Divider,
  ActionIcon,
  Tooltip,
  Switch,
  Collapse,
  List,
  Table,
  ScrollArea,
} from '@mantine/core';
import {
  IconDownload,
  IconDatabase,
  IconCheck,
  IconInfoCircle,
  IconChevronDown,
  IconChevronRight,
  IconFileSpreadsheet,
  IconTable,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';

export interface ReferenceEntity {
  id: string;
  name: string;
  description: string;
  fields: ReferenceField[];
  data: any[];
  requiredFor?: string[]; // Entities that require this reference
  isLoading?: boolean;
  lastUpdated?: Date;
}

export interface ReferenceField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  isPrimary?: boolean; // Primary key field
  isDisplayName?: boolean; // Field to show as display name
  includeInReference?: boolean; // Include in reference sheet
}

export interface ReferenceDataSheetsProps {
  entities: ReferenceEntity[];
  selectedEntities?: string[];
  onEntitiesChange?: (entities: string[]) => void;
  onRefresh?: (entityId: string) => void;
  onDownload?: (config: ReferenceConfig) => void;
  isGenerating?: boolean;
  targetEntity?: string; // The entity that will use these references
}

export interface ReferenceConfig {
  selectedEntities: string[];
  includeInstructions: boolean;
  includeFullData: boolean;
  maxRecordsPerSheet: number;
  onlyActiveRecords: boolean;
}

const DEFAULT_CONFIG: ReferenceConfig = {
  selectedEntities: [],
  includeInstructions: true,
  includeFullData: true,
  maxRecordsPerSheet: 1000,
  onlyActiveRecords: true,
};

export const ReferenceDataSheets: React.FC<ReferenceDataSheetsProps> = ({
  entities,
  selectedEntities = [],
  onEntitiesChange,
  onRefresh,
  onDownload,
  isGenerating = false,
  targetEntity = 'datos',
}) => {
  const [config, setConfig] = useState<ReferenceConfig>({
    ...DEFAULT_CONFIG,
    selectedEntities,
  });
  const [expandedEntities, setExpandedEntities] = useState<Record<string, boolean>>({});
  const [previewEntity, setPreviewEntity] = useState<string | null>(null);

  const availableEntities = useMemo(() => {
    return entities.filter(entity => entity.data.length > 0);
  }, [entities]);

  const recommendedEntities = useMemo(() => {
    return entities.filter(entity => 
      entity.requiredFor?.includes(targetEntity) || 
      entity.data.length > 0
    );
  }, [entities, targetEntity]);

  const handleEntityToggle = (entityId: string) => {
    const newSelected = config.selectedEntities.includes(entityId)
      ? config.selectedEntities.filter(id => id !== entityId)
      : [...config.selectedEntities, entityId];
    
    const newConfig = { ...config, selectedEntities: newSelected };
    setConfig(newConfig);
    onEntitiesChange?.(newSelected);
  };

  const handleSelectRecommended = () => {
    const recommended = recommendedEntities.map(e => e.id);
    const newConfig = { ...config, selectedEntities: recommended };
    setConfig(newConfig);
    onEntitiesChange?.(recommended);
  };

  const handleSelectAll = () => {
    const all = availableEntities.map(e => e.id);
    const newConfig = { ...config, selectedEntities: all };
    setConfig(newConfig);
    onEntitiesChange?.(all);
  };

  const handleClearAll = () => {
    const newConfig = { ...config, selectedEntities: [] };
    setConfig(newConfig);
    onEntitiesChange?.([]);
  };

  const toggleEntityExpansion = (entityId: string) => {
    setExpandedEntities(prev => ({
      ...prev,
      [entityId]: !prev[entityId],
    }));
  };

  const generateReferenceSheets = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Add instruction sheet if enabled
      if (config.includeInstructions) {
        const instructionsSheet = createInstructionsSheet();
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
      }
      
      // Add reference sheets for selected entities
      for (const entityId of config.selectedEntities) {
        const entity = entities.find(e => e.id === entityId);
        if (!entity) continue;
        
        const referenceSheet = createReferenceSheet(entity);
        const sheetName = `Ref_${entity.name.replace(/\s+/g, '_')}`;
        XLSX.utils.book_append_sheet(workbook, referenceSheet, sheetName);
      }
      
      // Generate and download file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const filename = `referencias_${targetEntity}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onDownload?.(config);
      
      notifications.show({
        title: 'Referencias generadas',
        message: `Se descargaron las hojas de referencia para ${config.selectedEntities.length} entidades`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
    } catch (error) {
      console.error('Error generating reference sheets:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron generar las hojas de referencia',
        color: 'red',
      });
    }
  };

  const createInstructionsSheet = () => {
    const instructions = [
      ['INSTRUCCIONES PARA USO DE HOJAS DE REFERENCIA'],
      [''],
      ['¿Qué son las hojas de referencia?'],
      ['Las hojas de referencia contienen datos existentes en el sistema que puedes'],
      ['usar para completar correctamente tu plantilla de importación.'],
      [''],
      ['¿Cómo usar las referencias?'],
      ['1. Identifica el campo que necesitas completar en tu plantilla principal'],
      ['2. Busca la hoja de referencia correspondiente (Ref_NombreEntidad)'],
      ['3. Copia el ID o valor exacto desde la hoja de referencia'],
      ['4. Pega el valor en tu plantilla principal'],
      [''],
      ['Ejemplo práctico:'],
      ['Si necesitas asignar una empresa a un empleado:'],
      ['- Ve a la hoja "Ref_Empresas"'],
      ['- Busca la empresa deseada'],
      ['- Copia el ID de la primera columna'],
      ['- Pega ese ID en el campo "empresaId" de tu plantilla'],
      [''],
      ['Campos importantes:'],
      ['- ID: Valor único que debes usar para referencias'],
      ['- Nombre/Descripción: Te ayuda a identificar el registro correcto'],
      ['- Estado: Solo usa registros activos para nuevas asignaciones'],
      [''],
      ['Notas:'],
      ['- Los IDs deben copiarse exactamente como aparecen'],
      ['- No modifiques las hojas de referencia'],
      ['- Si no encuentras un dato, créalo primero en el sistema'],
    ];
    
    return XLSX.utils.aoa_to_sheet(instructions);
  };

  const createReferenceSheet = (entity: ReferenceEntity) => {
    const referenceFields = entity.fields.filter(f => f.includeInReference !== false);
    const headers = referenceFields.map(f => f.label);
    
    // Filter data based on config
    let data = entity.data;
    if (config.onlyActiveRecords) {
      data = data.filter(item => item.activo !== false && item.estado !== 'inactivo');
    }
    
    // Limit records if specified
    if (config.maxRecordsPerSheet > 0) {
      data = data.slice(0, config.maxRecordsPerSheet);
    }
    
    const rows = data.map(item => 
      referenceFields.map(field => {
        const value = item[field.key];
        if (field.type === 'date' && value) {
          return new Date(value).toLocaleDateString();
        }
        if (field.type === 'boolean') {
          return value ? 'VERDADERO' : 'FALSO';
        }
        return value || '';
      })
    );
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  };

  const getEntityStatus = (entity: ReferenceEntity) => {
    if (entity.isLoading) return { color: 'blue', text: 'Cargando...' };
    if (entity.data.length === 0) return { color: 'gray', text: 'Sin datos' };
    if (entity.requiredFor?.includes(targetEntity)) return { color: 'orange', text: 'Recomendado' };
    return { color: 'green', text: 'Disponible' };
  };

  const selectedEntitiesData = config.selectedEntities
    .map(id => entities.find(e => e.id === id))
    .filter(Boolean) as ReferenceEntity[];

  const totalRecords = selectedEntitiesData.reduce((sum, entity) => sum + entity.data.length, 0);

  return (
    <Stack gap="md">
      {/* Header */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconDatabase size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={500} size="sm">
                Hojas de Referencia
              </Text>
              <Text size="xs" c="dimmed">
                Datos existentes para completar formularios de {targetEntity}
              </Text>
            </Box>
          </Group>
          
          <Group gap="sm">
            <Badge variant="light" color="blue">
              {config.selectedEntities.length} seleccionadas
            </Badge>
            {totalRecords > 0 && (
              <Badge variant="light" color="green">
                {totalRecords} registros
              </Badge>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Quick Actions */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Button
              variant="light"
              size="sm"
              onClick={handleSelectRecommended}
              disabled={recommendedEntities.length === 0}
            >
              Seleccionar Recomendadas ({recommendedEntities.length})
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={handleSelectAll}
            >
              Seleccionar Todas ({availableEntities.length})
            </Button>
            <Button
              variant="light"
              size="sm"
              color="red"
              onClick={handleClearAll}
              disabled={config.selectedEntities.length === 0}
            >
              Limpiar Selección
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Configuration */}
      <Paper p="md" withBorder>
        <Text fw={500} size="sm" mb="md">
          Configuración de Generación
        </Text>
        
        <Group gap="md">
          <Switch
            label="Incluir instrucciones"
            description="Hoja con guía de uso"
            checked={config.includeInstructions}
            onChange={(event) =>
              setConfig(prev => ({ ...prev, includeInstructions: event.currentTarget.checked }))
            }
          />
          
          <Switch
            label="Solo registros activos"
            description="Excluir registros inactivos"
            checked={config.onlyActiveRecords}
            onChange={(event) =>
              setConfig(prev => ({ ...prev, onlyActiveRecords: event.currentTarget.checked }))
            }
          />
        </Group>
        
        <Group gap="md" mt="md">
          <Select
            label="Máximo por hoja"
            description="Limitar registros por rendimiento"
            value={config.maxRecordsPerSheet.toString()}
            onChange={(value) =>
              setConfig(prev => ({ 
                ...prev, 
                maxRecordsPerSheet: parseInt(value || '1000') 
              }))
            }
            data={[
              { value: '100', label: '100 registros' },
              { value: '500', label: '500 registros' },
              { value: '1000', label: '1000 registros' },
              { value: '0', label: 'Sin límite' },
            ]}
            style={{ minWidth: 150 }}
          />
        </Group>
      </Paper>

      {/* Available Entities */}
      <Paper p="md" withBorder>
        <Text fw={500} size="sm" mb="md">
          Entidades Disponibles
        </Text>
        
        <Stack gap="sm">
          {availableEntities.map(entity => {
            const isSelected = config.selectedEntities.includes(entity.id);
            const status = getEntityStatus(entity);
            
            return (
              <Paper key={entity.id} p="sm" withBorder={isSelected} bg={isSelected ? 'var(--mantine-color-blue-0)' : undefined}>
                <Group justify="space-between" align="flex-start">
                  <Group gap="sm" style={{ flex: 1 }}>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => toggleEntityExpansion(entity.id)}
                    >
                      {expandedEntities[entity.id] ? (
                        <IconChevronDown size={16} />
                      ) : (
                        <IconChevronRight size={16} />
                      )}
                    </ActionIcon>
                    
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" align="center">
                        <Text fw={500} size="sm">
                          {entity.name}
                        </Text>
                        <Badge size="xs" color={status.color} variant="light">
                          {status.text}
                        </Badge>
                        <Badge size="xs" variant="outline">
                          {entity.data.length} registros
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {entity.description}
                      </Text>
                      {entity.lastUpdated && (
                        <Text size="xs" c="dimmed">
                          Actualizado: {entity.lastUpdated.toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  </Group>
                  
                  <Group gap="xs">
                    {onRefresh && (
                      <Tooltip label="Actualizar datos">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => onRefresh(entity.id)}
                          loading={entity.isLoading}
                        >
                          <IconRefresh size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    
                    <Button
                      variant={isSelected ? 'filled' : 'light'}
                      size="sm"
                      onClick={() => handleEntityToggle(entity.id)}
                      disabled={entity.data.length === 0}
                    >
                      {isSelected ? 'Incluida' : 'Incluir'}
                    </Button>
                  </Group>
                </Group>
                
                <Collapse in={expandedEntities[entity.id]}>
                  <Divider my="sm" />
                  <Stack gap="xs">
                    <Text size="xs" fw={500} c="dimmed">
                      Campos disponibles:
                    </Text>
                    <Group gap="xs">
                      {entity.fields
                        .filter(f => f.includeInReference !== false)
                        .map(field => (
                          <Badge
                            key={field.key}
                            size="xs"
                            variant="outline"
                            color={field.isPrimary ? 'blue' : 'gray'}
                          >
                            {field.label}
                            {field.isPrimary && ' (ID)'}
                          </Badge>
                        ))}
                    </Group>
                    
                    {entity.data.length > 0 && (
                      <>
                        <Text size="xs" fw={500} c="dimmed" mt="xs">
                          Vista previa:
                        </Text>
                        <ScrollArea h={100}>
                          <Table>
                            <Table.Thead>
                              <Table.Tr>
                                {entity.fields
                                  .filter(f => f.includeInReference !== false)
                                  .slice(0, 3)
                                  .map(field => (
                                    <Table.Th key={field.key}>{field.label}</Table.Th>
                                  ))}
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {entity.data.slice(0, 3).map((item, index) => (
                                <Table.Tr key={index}>
                                  {entity.fields
                                    .filter(f => f.includeInReference !== false)
                                    .slice(0, 3)
                                    .map(field => (
                                      <Table.Td key={field.key}>
                                        {String(item[field.key] || '').slice(0, 20)}
                                        {String(item[field.key] || '').length > 20 && '...'}
                                      </Table.Td>
                                    ))}
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        </ScrollArea>
                      </>
                    )}
                  </Stack>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      </Paper>

      {/* Generation Section */}
      {config.selectedEntities.length > 0 && (
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <Box>
              <Text fw={500} size="sm">
                Generar Hojas de Referencia
              </Text>
              <Text size="xs" c="dimmed">
                {config.selectedEntities.length} entidades seleccionadas • {totalRecords} registros totales
              </Text>
            </Box>
            
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={generateReferenceSheets}
              loading={isGenerating}
              disabled={config.selectedEntities.length === 0}
            >
              Generar y Descargar
            </Button>
          </Group>
        </Paper>
      )}

      {/* Help Section */}
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        title="¿Cómo usar las hojas de referencia?"
      >
        <List size="sm" spacing="xs">
          <List.Item>
            <strong>Selecciona las entidades</strong> que necesitas como referencia para tu importación
          </List.Item>
          <List.Item>
            <strong>Descarga el archivo Excel</strong> que contendrá hojas separadas con los datos existentes
          </List.Item>
          <List.Item>
            <strong>Usa los IDs</strong> de las hojas de referencia para completar campos de relación en tu plantilla principal
          </List.Item>
          <List.Item>
            <strong>Lee las instrucciones</strong> incluidas en el archivo para ejemplos específicos
          </List.Item>
        </List>
      </Alert>
    </Stack>
  );
};

export default ReferenceDataSheets;