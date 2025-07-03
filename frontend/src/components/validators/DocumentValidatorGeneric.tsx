import React, { useState, useMemo } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Alert,
  Card,
  Progress,
  Tabs,
  Button,
  ActionIcon,
  Table,
  Collapse,
  Box,
  Select,
  Switch,
  NumberInput,
  SimpleGrid,
  ThemeIcon,
  Timeline,
  Modal,
  Textarea
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconFileText,
  IconTruck,
  IconUser,
  IconCalendar,
  IconClock,
  IconRefresh,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEdit,
  IconShieldCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

// Tipos base para validación
export interface DocumentoValidacion {
  _id: string;
  tipo: string;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  archivo?: string;
  activo: boolean;
  entidadTipo: 'vehiculo' | 'personal';
  entidadId: string;
  entidadNombre: string;
  entidadDetalle: string; // Patente, DNI, etc.
  empresa?: string;
  requerido: boolean; // Si es obligatorio para la entidad
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'obligatoriedad' | 'vencimiento' | 'consistencia' | 'integridad';
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  applicableTo: ('vehiculo' | 'personal')[];
  validate: (documentos: DocumentoValidacion[], config: ValidationConfig) => ValidationResult[];
}

export interface ValidationResult {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  documentoId: string;
  entidadId: string;
  entidadNombre: string;
  entidadTipo: 'vehiculo' | 'personal';
  mensaje: string;
  detalles?: string;
  sugerencia?: string;
  autoFix?: boolean;
}

export interface ValidationConfig {
  // Configuración de vencimientos
  diasCritico: number;
  diasProximo: number;
  
  // Reglas específicas
  requiereNumeroDocumento: boolean;
  requiereFechaEmision: boolean;
  validarConsistenciaFechas: boolean;
  validarDocumentosRequeridos: boolean;
  
  // Configuración por tipo de entidad
  reglasVehiculos: string[];
  reglasPersonal: string[];
  
  // Tolerancias
  toleranciaDias: number;
  permitirDocumentosVencidos: boolean;
}

export interface DocumentValidatorProps {
  // Datos
  documentos: DocumentoValidacion[];
  
  // Configuración
  config?: Partial<ValidationConfig>;
  
  // Vista
  variant?: 'complete' | 'summary' | 'by-category';
  showConfig?: boolean;
  showActions?: boolean;
  
  // Callbacks
  onValidationComplete?: (results: ValidationResult[]) => void;
  onAutoFix?: (result: ValidationResult) => void;
  onEditDocument?: (documentoId: string) => void;
  onConfigChange?: (config: ValidationConfig) => void;
  
  // Estados
  loading?: boolean;
}

// Configuración por defecto
const DEFAULT_CONFIG: ValidationConfig = {
  diasCritico: 7,
  diasProximo: 30,
  requiereNumeroDocumento: true,
  requiereFechaEmision: false,
  validarConsistenciaFechas: true,
  validarDocumentosRequeridos: true,
  reglasVehiculos: ['vtv', 'seguro', 'ruta'],
  reglasPersonal: ['licenciaConducir', 'aptitudPsicofisica'],
  toleranciaDias: 0,
  permitirDocumentosVencidos: false
};

// Reglas de validación predefinidas
const VALIDATION_RULES: ValidationRule[] = [
  // Reglas de obligatoriedad
  {
    id: 'documentos-requeridos',
    name: 'Documentos Requeridos',
    description: 'Verifica que todos los documentos obligatorios estén presentes',
    category: 'obligatoriedad',
    enabled: true,
    severity: 'error',
    applicableTo: ['vehiculo', 'personal'],
    validate: (documentos, config) => {
      const results: ValidationResult[] = [];
      const entidades = new Map<string, DocumentoValidacion[]>();
      
      // Agrupar por entidad
      documentos.forEach(doc => {
        const key = `${doc.entidadTipo}-${doc.entidadId}`;
        if (!entidades.has(key)) entidades.set(key, []);
        entidades.get(key)!.push(doc);
      });
      
      // Validar cada entidad
      entidades.forEach((docs, key) => {
        const [tipo, id] = key.split('-');
        const requeridos = tipo === 'vehiculo' ? config.reglasVehiculos : config.reglasPersonal;
        const tiposPresentes = docs.filter(d => d.activo).map(d => d.tipo);
        
        requeridos.forEach(tipoRequerido => {
          if (!tiposPresentes.includes(tipoRequerido)) {
            results.push({
              ruleId: 'documentos-requeridos',
              severity: 'error',
              documentoId: '',
              entidadId: id,
              entidadNombre: docs[0].entidadNombre,
              entidadTipo: tipo as 'vehiculo' | 'personal',
              mensaje: `Falta documento requerido: ${tipoRequerido}`,
              detalles: `El documento ${tipoRequerido} es obligatorio para ${tipo}s`,
              sugerencia: `Agregue el documento ${tipoRequerido} para esta entidad`
            });
          }
        });
      });
      
      return results;
    }
  },
  
  // Reglas de vencimiento
  {
    id: 'documentos-vencidos',
    name: 'Documentos Vencidos',
    description: 'Identifica documentos vencidos o próximos a vencer',
    category: 'vencimiento',
    enabled: true,
    severity: 'error',
    applicableTo: ['vehiculo', 'personal'],
    validate: (documentos, config) => {
      const results: ValidationResult[] = [];
      const hoy = new Date();
      
      documentos.forEach(doc => {
        if (!doc.fechaVencimiento || !doc.activo) return;
        
        const diasRestantes = dayjs(doc.fechaVencimiento).diff(dayjs(hoy), 'day');
        
        if (diasRestantes < 0 && !config.permitirDocumentosVencidos) {
          results.push({
            ruleId: 'documentos-vencidos',
            severity: 'error',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: `Documento vencido hace ${Math.abs(diasRestantes)} días`,
            detalles: `${doc.tipo} vencido el ${dayjs(doc.fechaVencimiento).format('DD/MM/YYYY')}`,
            sugerencia: 'Renueve el documento lo antes posible'
          });
        } else if (diasRestantes <= config.diasCritico) {
          results.push({
            ruleId: 'documentos-vencidos',
            severity: 'warning',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: `Documento vence en ${diasRestantes} días`,
            detalles: `${doc.tipo} vence el ${dayjs(doc.fechaVencimiento).format('DD/MM/YYYY')}`,
            sugerencia: 'Planifique la renovación del documento'
          });
        }
      });
      
      return results;
    }
  },
  
  // Reglas de consistencia
  {
    id: 'fechas-consistentes',
    name: 'Consistencia de Fechas',
    description: 'Verifica que las fechas de emisión y vencimiento sean lógicas',
    category: 'consistencia',
    enabled: true,
    severity: 'warning',
    applicableTo: ['vehiculo', 'personal'],
    validate: (documentos, config) => {
      const results: ValidationResult[] = [];
      
      documentos.forEach(doc => {
        if (!doc.fechaEmision || !doc.fechaVencimiento || !doc.activo) return;
        
        const emision = dayjs(doc.fechaEmision);
        const vencimiento = dayjs(doc.fechaVencimiento);
        
        if (vencimiento.isBefore(emision)) {
          results.push({
            ruleId: 'fechas-consistentes',
            severity: 'error',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: 'Fecha de vencimiento anterior a fecha de emisión',
            detalles: `Emisión: ${emision.format('DD/MM/YYYY')}, Vencimiento: ${vencimiento.format('DD/MM/YYYY')}`,
            sugerencia: 'Verifique y corrija las fechas del documento'
          });
        }
        
        // Verificar si el documento tiene una duración lógica
        const duracionAnios = vencimiento.diff(emision, 'year', true);
        if (duracionAnios > 10) {
          results.push({
            ruleId: 'fechas-consistentes',
            severity: 'warning',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: `Duración del documento muy larga: ${duracionAnios.toFixed(1)} años`,
            detalles: 'La duración del documento parece inusualmente larga',
            sugerencia: 'Verifique si las fechas son correctas'
          });
        }
      });
      
      return results;
    }
  },
  
  // Reglas de integridad
  {
    id: 'numeros-validos',
    name: 'Números de Documento',
    description: 'Verifica que los números de documento tengan formato válido',
    category: 'integridad',
    enabled: true,
    severity: 'warning',
    applicableTo: ['vehiculo', 'personal'],
    validate: (documentos, config) => {
      const results: ValidationResult[] = [];
      
      documentos.forEach(doc => {
        if (!config.requiereNumeroDocumento || !doc.activo) return;
        
        if (!doc.numero || doc.numero.trim() === '') {
          results.push({
            ruleId: 'numeros-validos',
            severity: 'warning',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: 'Número de documento faltante',
            detalles: `El documento ${doc.tipo} no tiene número especificado`,
            sugerencia: 'Agregue el número del documento'
          });
        } else if (doc.numero.length < 3) {
          results.push({
            ruleId: 'numeros-validos',
            severity: 'info',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: 'Número de documento muy corto',
            detalles: `El número "${doc.numero}" parece demasiado corto`,
            sugerencia: 'Verifique que el número esté completo'
          });
        }
      });
      
      return results;
    }
  }
];

export const DocumentValidatorGeneric: React.FC<DocumentValidatorProps> = ({
  documentos,
  config = {},
  variant = 'complete',
  showConfig = true,
  showActions = true,
  onValidationComplete,
  onAutoFix,
  onEditDocument,
  onConfigChange,
  loading = false
}) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('summary');
  const [enabledRules, setEnabledRules] = useState<string[]>(
    VALIDATION_RULES.filter(r => r.enabled).map(r => r.id)
  );
  const [validationConfig, setValidationConfig] = useState<ValidationConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] = useDisclosure(false);
  const [detailsOpened, { toggle: toggleDetails }] = useDisclosure(false);

  // Ejecutar validaciones
  const validationResults = useMemo(() => {
    const results: ValidationResult[] = [];
    
    VALIDATION_RULES
      .filter(rule => enabledRules.includes(rule.id))
      .forEach(rule => {
        const ruleResults = rule.validate(documentos, validationConfig);
        results.push(...ruleResults);
      });
    
    return results;
  }, [documentos, enabledRules, validationConfig]);

  // Agrupar resultados
  const resultsByCategory = useMemo(() => {
    const groups: Record<string, ValidationResult[]> = {};
    
    validationResults.forEach(result => {
      const rule = VALIDATION_RULES.find(r => r.id === result.ruleId);
      const category = rule?.category || 'otros';
      
      if (!groups[category]) groups[category] = [];
      groups[category].push(result);
    });
    
    return groups;
  }, [validationResults]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = validationResults.length;
    const errors = validationResults.filter(r => r.severity === 'error').length;
    const warnings = validationResults.filter(r => r.severity === 'warning').length;
    const infos = validationResults.filter(r => r.severity === 'info').length;
    
    return { total, errors, warnings, infos };
  }, [validationResults]);

  // Callbacks
  React.useEffect(() => {
    if (onValidationComplete) {
      onValidationComplete(validationResults);
    }
  }, [validationResults, onValidationComplete]);

  const handleConfigSave = () => {
    onConfigChange?.(validationConfig);
    closeConfigModal();
    
    notifications.show({
      title: 'Configuración Guardada',
      message: 'Las reglas de validación han sido actualizadas',
      color: 'green'
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setEnabledRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  // Render de estadísticas
  const renderStats = () => (
    <SimpleGrid cols={4} spacing="md" mb="md">
      <Card withBorder p="sm">
        <Text ta="center" fw={700} size="xl">{stats.total}</Text>
        <Text ta="center" size="sm" c="dimmed">Total</Text>
      </Card>
      
      <Card withBorder p="sm" bg="red.0">
        <Text ta="center" fw={700} size="xl" c="red">{stats.errors}</Text>
        <Text ta="center" size="sm" c="red">Errores</Text>
      </Card>
      
      <Card withBorder p="sm" bg="yellow.0">
        <Text ta="center" fw={700} size="xl" c="orange">{stats.warnings}</Text>
        <Text ta="center" size="sm" c="orange">Advertencias</Text>
      </Card>
      
      <Card withBorder p="sm" bg="blue.0">
        <Text ta="center" fw={700} size="xl" c="blue">{stats.infos}</Text>
        <Text ta="center" size="sm" c="blue">Información</Text>
      </Card>
    </SimpleGrid>
  );

  // Render de resumen
  const renderSummary = () => (
    <Stack gap="md">
      {stats.total === 0 ? (
        <Alert icon={<IconCheck />} color="green">
          <Text fw={500}>✅ Validación Exitosa</Text>
          <Text size="sm">Todos los documentos cumplen con las reglas de validación</Text>
        </Alert>
      ) : (
        <Alert icon={<IconAlertTriangle />} color={stats.errors > 0 ? 'red' : 'yellow'}>
          <Text fw={500}>Se encontraron {stats.total} problema{stats.total > 1 ? 's' : ''}</Text>
          <Text size="sm">
            {stats.errors > 0 && `${stats.errors} error${stats.errors > 1 ? 'es' : ''}`}
            {stats.warnings > 0 && ` ${stats.warnings} advertencia${stats.warnings > 1 ? 's' : ''}`}
            {stats.infos > 0 && ` ${stats.infos} información`}
          </Text>
        </Alert>
      )}
      
      {/* Lista de problemas principales */}
      {validationResults.slice(0, 5).map((result, index) => (
        <Card key={index} withBorder p="sm">
          <Group justify="space-between">
            <Group>
              <ThemeIcon
                size="sm"
                color={result.severity === 'error' ? 'red' : result.severity === 'warning' ? 'orange' : 'blue'}
                variant="light"
              >
                {result.severity === 'error' ? <IconX size={14} /> : 
                 result.severity === 'warning' ? <IconAlertTriangle size={14} /> : 
                 <IconInfoCircle size={14} />}
              </ThemeIcon>
              
              <Box>
                <Text fw={500} size="sm">{result.entidadNombre}</Text>
                <Text size="xs" c="dimmed">{result.mensaje}</Text>
              </Box>
            </Group>
            
            <Group gap="xs">
              <Badge color={result.entidadTipo === 'vehiculo' ? 'blue' : 'green'} size="xs">
                {result.entidadTipo === 'vehiculo' ? 'Vehículo' : 'Personal'}
              </Badge>
              
              {onEditDocument && (
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => onEditDocument(result.documentoId)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              )}
            </Group>
          </Group>
        </Card>
      ))}
      
      {validationResults.length > 5 && (
        <Text size="sm" c="dimmed" ta="center">
          Y {validationResults.length - 5} problema{validationResults.length - 5 > 1 ? 's' : ''} más...
        </Text>
      )}
    </Stack>
  );

  // Render por categorías
  const renderByCategory = () => (
    <Stack gap="md">
      {Object.entries(resultsByCategory).map(([category, results]) => (
        <Card key={category} withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500} tt="capitalize">{category}</Text>
            <Badge>{results.length}</Badge>
          </Group>
          
          <Stack gap="xs">
            {results.map((result, index) => (
              <Group key={index} justify="space-between">
                <Group>
                  <ThemeIcon
                    size="xs"
                    color={result.severity === 'error' ? 'red' : result.severity === 'warning' ? 'orange' : 'blue'}
                    variant="light"
                  >
                    {result.severity === 'error' ? <IconX size={12} /> : 
                     result.severity === 'warning' ? <IconAlertTriangle size={12} /> : 
                     <IconInfoCircle size={12} />}
                  </ThemeIcon>
                  
                  <Text size="sm">{result.entidadNombre}: {result.mensaje}</Text>
                </Group>
                
                {onEditDocument && (
                  <ActionIcon
                    size="xs"
                    variant="light"
                    onClick={() => onEditDocument(result.documentoId)}
                  >
                    <IconEye size={12} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Stack>
        </Card>
      ))}
    </Stack>
  );

  // Render principal según variante
  if (variant === 'summary') {
    return (
      <Stack gap="md">
        {renderStats()}
        {renderSummary()}
      </Stack>
    );
  }

  if (variant === 'by-category') {
    return (
      <Stack gap="md">
        {renderStats()}
        {renderByCategory()}
      </Stack>
    );
  }

  // Vista completa
  return (
    <Stack gap="md">
      {/* Header */}
      <Paper withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconShieldCheck size={24} />
            <Title order={3}>Validador de Documentos</Title>
          </Group>
          
          <Group gap="xs">
            {showConfig && (
              <ActionIcon variant="light" onClick={openConfigModal}>
                <IconSettings size={16} />
              </ActionIcon>
            )}
            
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              loading={loading}
            >
              Validar
            </Button>
          </Group>
        </Group>
        
        <Text size="sm" c="dimmed">
          Validando {documentos.length} documentos con {enabledRules.length} reglas activas
        </Text>
      </Paper>

      {/* Estadísticas */}
      {renderStats()}

      {/* Tabs */}
      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'summary')}>
        <Tabs.List>
          <Tabs.Tab value="summary" leftSection={<IconFileText size={16} />}>
            Resumen
          </Tabs.Tab>
          <Tabs.Tab value="category" leftSection={<IconShieldCheck size={16} />}>
            Por Categoría
          </Tabs.Tab>
          <Tabs.Tab value="details" leftSection={<IconEye size={16} />}>
            Detalles
          </Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="summary" pt="md">
          {renderSummary()}
        </Tabs.Panel>
        
        <Tabs.Panel value="category" pt="md">
          {renderByCategory()}
        </Tabs.Panel>
        
        <Tabs.Panel value="details" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Entidad</Table.Th>
                <Table.Th>Problema</Table.Th>
                <Table.Th>Severidad</Table.Th>
                <Table.Th>Sugerencia</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {validationResults.map((result, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Group gap="xs">
                      {result.entidadTipo === 'vehiculo' ? <IconTruck size={14} /> : <IconUser size={14} />}
                      <Text size="sm">{result.entidadNombre}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{result.mensaje}</Text>
                    {result.detalles && (
                      <Text size="xs" c="dimmed">{result.detalles}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={result.severity === 'error' ? 'red' : result.severity === 'warning' ? 'orange' : 'blue'}
                      size="sm"
                    >
                      {result.severity}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{result.sugerencia}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {onEditDocument && (
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => onEditDocument(result.documentoId)}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                      )}
                      
                      {result.autoFix && onAutoFix && (
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="green"
                          onClick={() => onAutoFix(result)}
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      {/* Modal de configuración */}
      {showConfig && (
        <Modal
          opened={configModalOpened}
          onClose={closeConfigModal}
          title="Configuración de Validación"
          size="lg"
        >
          <Stack>
            <Title order={5}>Parámetros Generales</Title>
            
            <Group grow>
              <NumberInput
                label="Días críticos"
                value={validationConfig.diasCritico}
                onChange={(value) => setValidationConfig(prev => ({ 
                  ...prev, 
                  diasCritico: Number(value) || 7 
                }))}
                min={1}
                max={30}
              />
              
              <NumberInput
                label="Días próximos"
                value={validationConfig.diasProximo}
                onChange={(value) => setValidationConfig(prev => ({ 
                  ...prev, 
                  diasProximo: Number(value) || 30 
                }))}
                min={1}
                max={90}
              />
            </Group>
            
            <Switch
              label="Requiere número de documento"
              checked={validationConfig.requiereNumeroDocumento}
              onChange={(event) => setValidationConfig(prev => ({ 
                ...prev, 
                requiereNumeroDocumento: event.currentTarget.checked 
              }))}
            />
            
            <Switch
              label="Validar consistencia de fechas"
              checked={validationConfig.validarConsistenciaFechas}
              onChange={(event) => setValidationConfig(prev => ({ 
                ...prev, 
                validarConsistenciaFechas: event.currentTarget.checked 
              }))}
            />
            
            <Title order={5} mt="md">Reglas Activas</Title>
            
            <Stack gap="xs">
              {VALIDATION_RULES.map(rule => (
                <Group key={rule.id} justify="space-between">
                  <Box>
                    <Text fw={500} size="sm">{rule.name}</Text>
                    <Text size="xs" c="dimmed">{rule.description}</Text>
                  </Box>
                  
                  <Switch
                    checked={enabledRules.includes(rule.id)}
                    onChange={() => handleToggleRule(rule.id)}
                  />
                </Group>
              ))}
            </Stack>
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeConfigModal}>
                Cancelar
              </Button>
              <Button onClick={handleConfigSave}>
                Guardar Configuración
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Stack>
  );
};

export default DocumentValidatorGeneric;