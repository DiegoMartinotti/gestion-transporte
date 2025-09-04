import React, { useState, useMemo, useCallback } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Alert,
  Card,
  Tabs,
  Button,
  ActionIcon,
  Table,
  Box,
  Switch,
  NumberInput,
  SimpleGrid,
  ThemeIcon,
  Modal,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconFileText,
  IconTruck,
  IconUser,
  IconRefresh,
  IconSettings,
  IconEye,
  IconEdit,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { BaseValidator, ValidationRule, ValidationResult, useValidation } from './BaseValidator';

// Constantes para evitar duplicación
const CATEGORY_TYPES = {
  VENCIMIENTO: 'vencimiento',
  OBLIGATORIEDAD: 'obligatoriedad',
  CONSISTENCIA: 'consistencia',
} as const;

const ERROR_SEVERITY = 'error' as const;

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

// Interfaces extendidas para validación de documentos
export interface DocumentValidationRule extends ValidationRule<DocumentoValidacion[]> {
  category: 'obligatoriedad' | 'vencimiento' | 'consistencia' | 'integridad';
  enabled: boolean;
  applicableTo: ('vehiculo' | 'personal')[];
  validate: (
    documentos: DocumentoValidacion[],
    config: ValidationConfig
  ) => DocumentValidationResult[];
}

export interface DocumentValidationResult extends ValidationResult {
  ruleId: string;
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
  permitirDocumentosVencidos: false,
};

// Clase validadora que extiende BaseValidator
export class DocumentValidator extends BaseValidator<DocumentoValidacion[]> {
  private config: ValidationConfig;
  private enabledRules: Set<string>;

  constructor(config: ValidationConfig = DEFAULT_CONFIG, enabledRuleIds?: string[]) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enabledRules = new Set(enabledRuleIds || VALIDATION_RULES.map((r) => r.id));
  }

  getValidationRules(): ValidationRule<DocumentoValidacion[]>[] {
    return VALIDATION_RULES.filter((rule) => this.enabledRules.has(rule.id)).map((rule) => ({
      id: rule.id,
      category: rule.category,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      required: rule.severity === 'error',
      validator: (documentos: DocumentoValidacion[]) => this.validateDocumentRule(rule, documentos),
    }));
  }

  private validateDocumentRule(
    rule: DocumentValidationRule,
    documentos: DocumentoValidacion[]
  ): ValidationResult {
    try {
      const results = rule.validate(documentos, this.config);

      if (results.length === 0) {
        return {
          passed: true,
          message: `Validación ${rule.name} pasó correctamente`,
        };
      }

      // Consolidar resultados múltiples en uno solo para BaseValidator
      const errorMessages = results.map((r) => r.mensaje);
      const details = results.map((r) => r.detalles).filter(Boolean) as string[];

      return {
        passed: false,
        message: `${rule.name}: ${errorMessages.join(', ')}`,
        details: details.length > 0 ? details : undefined,
        suggestion: results[0]?.sugerencia,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error en validación ${rule.name}: ${error}`,
        suggestion: 'Verifique los datos e intente nuevamente',
      };
    }
  }

  // Métodos para manejar configuración
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  toggleRule(ruleId: string): void {
    if (this.enabledRules.has(ruleId)) {
      this.enabledRules.delete(ruleId);
    } else {
      this.enabledRules.add(ruleId);
    }
  }

  isRuleEnabled(ruleId: string): boolean {
    return this.enabledRules.has(ruleId);
  }

  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  // Método para obtener resultados detallados para la UI
  getDetailedResults(documentos: DocumentoValidacion[]): DocumentValidationResult[] {
    const results: DocumentValidationResult[] = [];

    VALIDATION_RULES.filter((rule) => this.enabledRules.has(rule.id)).forEach((rule) => {
      const ruleResults = rule.validate(documentos, this.config);
      results.push(...ruleResults);
    });

    return results;
  }
}

// Reglas de validación predefinidas
const VALIDATION_RULES: DocumentValidationRule[] = [
  // Reglas de obligatoriedad
  {
    id: 'documentos-requeridos',
    name: 'Documentos Requeridos',
    description: 'Verifica que todos los documentos obligatorios estén presentes',
    category: CATEGORY_TYPES.OBLIGATORIEDAD,
    enabled: true,
    severity: ERROR_SEVERITY,
    required: true,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];
      const entidades = new Map<string, DocumentoValidacion[]>();

      // Agrupar por entidad
      documentos.forEach((doc) => {
        const key = `${doc.entidadTipo}-${doc.entidadId}`;
        if (!entidades.has(key)) entidades.set(key, []);
        entidades.get(key)!.push(doc);
      });

      // Validar cada entidad
      entidades.forEach((docs, key) => {
        const [tipo, id] = key.split('-');
        const requeridos = tipo === 'vehiculo' ? config.reglasVehiculos : config.reglasPersonal;
        const tiposPresentes = docs.filter((d) => d.activo).map((d) => d.tipo);

        requeridos.forEach((tipoRequerido) => {
          if (!tiposPresentes.includes(tipoRequerido)) {
            results.push({
              ruleId: 'documentos-requeridos',
              passed: false,
              message: `Falta documento requerido: ${tipoRequerido}`,
              documentoId: '',
              entidadId: id,
              entidadNombre: docs[0].entidadNombre,
              entidadTipo: tipo as 'vehiculo' | 'personal',
              mensaje: `Falta documento requerido: ${tipoRequerido}`,
              detalles: `El documento ${tipoRequerido} es obligatorio para ${tipo}s`,
              sugerencia: `Agregue el documento ${tipoRequerido} para esta entidad`,
            });
          }
        });
      });

      return results;
    },
  },

  // Reglas de vencimiento
  {
    id: 'documentos-vencidos',
    name: 'Documentos Vencidos',
    description: 'Identifica documentos vencidos o próximos a vencer',
    category: CATEGORY_TYPES.VENCIMIENTO,
    enabled: true,
    severity: ERROR_SEVERITY,
    required: true,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];
      const hoy = new Date();

      documentos.forEach((doc) => {
        if (!doc.fechaVencimiento || !doc.activo) return;

        const diasRestantes = dayjs(doc.fechaVencimiento).diff(dayjs(hoy), 'day');

        if (diasRestantes < 0 && !config.permitirDocumentosVencidos) {
          results.push({
            ruleId: 'documentos-vencidos',
            passed: false,
            message: `Documento vencido hace ${Math.abs(diasRestantes)} días`,
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: `Documento vencido hace ${Math.abs(diasRestantes)} días`,
            detalles: `${doc.tipo} vencido el ${dayjs(doc.fechaVencimiento).format('DD/MM/YYYY')}`,
            sugerencia: 'Renueve el documento lo antes posible',
          });
        } else if (diasRestantes <= config.diasCritico) {
          results.push({
            ruleId: 'documentos-vencidos',
            passed: false,
            message: `Documento vence en ${diasRestantes} días`,
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: `Documento vence en ${diasRestantes} días`,
            detalles: `${doc.tipo} vence el ${dayjs(doc.fechaVencimiento).format('DD/MM/YYYY')}`,
            sugerencia: 'Planifique la renovación del documento',
          });
        }
      });

      return results;
    },
  },

  // Reglas de consistencia
  {
    id: 'fechas-consistentes',
    name: 'Consistencia de Fechas',
    description: 'Verifica que las fechas de emisión y vencimiento sean lógicas',
    category: CATEGORY_TYPES.CONSISTENCIA,
    enabled: true,
    severity: 'warning',
    required: false,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];

      documentos.forEach((doc) => {
        if (!doc.fechaEmision || !doc.fechaVencimiento || !doc.activo) return;

        const emision = dayjs(doc.fechaEmision);
        const vencimiento = dayjs(doc.fechaVencimiento);

        if (vencimiento.isBefore(emision)) {
          results.push({
            ruleId: 'fechas-consistentes',
            passed: false,
            message: 'Fecha de vencimiento anterior a fecha de emisión',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: 'Fecha de vencimiento anterior a fecha de emisión',
            detalles: `Emisión: ${emision.format('DD/MM/YYYY')}, Vencimiento: ${vencimiento.format('DD/MM/YYYY')}`,
            sugerencia: 'Verifique y corrija las fechas del documento',
          });
        }

        // Verificar si el documento tiene una duración lógica
        const duracionAnios = vencimiento.diff(emision, 'year', true);
        if (duracionAnios > 10) {
          results.push({
            ruleId: 'fechas-consistentes',
            passed: false,
            message: `Duración del documento muy larga: ${duracionAnios.toFixed(1)} años`,
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: `Duración del documento muy larga: ${duracionAnios.toFixed(1)} años`,
            detalles: 'La duración del documento parece inusualmente larga',
            sugerencia: 'Verifique si las fechas son correctas',
          });
        }
      });

      return results;
    },
  },

  // Reglas de integridad
  {
    id: 'numeros-validos',
    name: 'Números de Documento',
    description: 'Verifica que los números de documento tengan formato válido',
    category: 'integridad',
    enabled: true,
    severity: 'warning',
    required: false,
    applicableTo: ['vehiculo', 'personal'],
    validator: () => ({ passed: true, message: '' }), // Se implementa en validateDocumentRule
    validate: (documentos, config) => {
      const results: DocumentValidationResult[] = [];

      documentos.forEach((doc) => {
        if (!config.requiereNumeroDocumento || !doc.activo) return;

        if (!doc.numero || doc.numero.trim() === '') {
          results.push({
            ruleId: 'numeros-validos',
            passed: false,
            message: 'Número de documento faltante',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: 'Número de documento faltante',
            detalles: `El documento ${doc.tipo} no tiene número especificado`,
            sugerencia: 'Agregue el número del documento',
          });
        } else if (doc.numero.length < 3) {
          results.push({
            ruleId: 'numeros-validos',
            passed: false,
            message: 'Número de documento muy corto',
            documentoId: doc._id,
            entidadId: doc.entidadId,
            entidadNombre: doc.entidadNombre,
            entidadTipo: doc.entidadTipo,
            mensaje: 'Número de documento muy corto',
            detalles: `El número "${doc.numero}" parece demasiado corto`,
            sugerencia: 'Verifique que el número esté completo',
          });
        }
      });

      return results;
    },
  },
];

// Componente para mostrar estadísticas de validación
interface ValidationStatsProps {
  stats: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    score: number;
    canSave: boolean;
  };
}

const ValidationStats: React.FC<ValidationStatsProps> = ({ stats }) => (
  <SimpleGrid cols={4} spacing="md" mb="md">
    <Card withBorder p="sm">
      <Text ta="center" fw={700} size="xl">
        {stats.total}
      </Text>
      <Text ta="center" size="sm" c="dimmed">
        Total
      </Text>
    </Card>

    <Card withBorder p="sm" bg="red.0">
      <Text ta="center" fw={700} size="xl" c="red">
        {stats.errors}
      </Text>
      <Text ta="center" size="sm" c="red">
        Errores
      </Text>
    </Card>

    <Card withBorder p="sm" bg="yellow.0">
      <Text ta="center" fw={700} size="xl" c="orange">
        {stats.warnings}
      </Text>
      <Text ta="center" size="sm" c="orange">
        Advertencias
      </Text>
    </Card>

    <Card withBorder p="sm" bg="blue.0">
      <Text ta="center" fw={700} size="xl" c="blue">
        {stats.infos}
      </Text>
      <Text ta="center" size="sm" c="blue">
        Información
      </Text>
    </Card>
  </SimpleGrid>
);

// Componente para mostrar el resumen de validación
interface ValidationSummaryComponentProps {
  stats: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  detailedResults: DocumentValidationResult[];
  onEditDocument?: (document: DocumentoValidacion) => void;
}

const ValidationSummaryComponent: React.FC<ValidationSummaryComponentProps> = ({
  stats,
  detailedResults,
  onEditDocument,
}) => (
  <Stack gap="md">
    {stats.total === 0 ? (
      <Alert icon={<IconCheck />} color="green">
        <Text fw={500}>✅ Validación Exitosa</Text>
        <Text size="sm">Todos los documentos cumplen con las reglas de validación</Text>
      </Alert>
    ) : (
      <Alert icon={<IconAlertTriangle />} color={stats.errors > 0 ? 'red' : 'yellow'}>
        <Text fw={500}>
          Se encontraron {stats.total} problema{stats.total > 1 ? 's' : ''}
        </Text>
        <Text size="sm">
          {stats.errors > 0 && `${stats.errors} error${stats.errors > 1 ? 'es' : ''}`}
          {stats.warnings > 0 && ` ${stats.warnings} advertencia${stats.warnings > 1 ? 's' : ''}`}
          {stats.infos > 0 && ` ${stats.infos} información`}
        </Text>
      </Alert>
    )}

    {/* Lista de problemas principales */}
    {detailedResults.slice(0, 5).map((result, index) => (
      <Card key={index} withBorder p="sm">
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="sm" color="red">
              <IconX size={14} />
            </ThemeIcon>

            <Box>
              <Text size="sm" fw={500}>
                {result.entidadNombre}
              </Text>
              <Text size="xs" c="dimmed">
                {result.message}
              </Text>
            </Box>
          </Group>

          {onEditDocument && (
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => onEditDocument({ _id: result.documentoId } as DocumentoValidacion)}
            >
              <IconEdit size={14} />
            </ActionIcon>
          )}
        </Group>
      </Card>
    ))}

    {detailedResults.length > 5 && (
      <Text size="sm" c="dimmed" ta="center">
        ... y {detailedResults.length - 5} problema{detailedResults.length - 5 > 1 ? 's' : ''} más
      </Text>
    )}
  </Stack>
);

export const DocumentValidatorGeneric: React.FC<DocumentValidatorProps> = ({
  documentos,
  config: _config = {},
  variant = 'complete',
  showConfig = true,
  showActions = true, // eslint-disable-line @typescript-eslint/no-unused-vars
  onValidationComplete,
  onAutoFix,
  onEditDocument,
  onConfigChange,
  loading = false,
}) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('summary');
  const [validationConfig, setValidationConfig] = useState<ValidationConfig>({
    ...DEFAULT_CONFIG,
    ..._config,
  });
  const [enabledRules, setEnabledRules] = useState<string[]>(
    VALIDATION_RULES.filter((r) => r.enabled).map((r) => r.id)
  );
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] =
    useDisclosure(false);
  const [_detailsOpened, { toggle: _toggleDetails }] = useDisclosure(false);

  // Crear instancia del validador
  const validator = useMemo(() => {
    return new DocumentValidator(validationConfig, enabledRules);
  }, [validationConfig, enabledRules]);

  // Obtener resultados detallados para la UI
  const detailedResults = useMemo(() => {
    return validator.getDetailedResults(documentos);
  }, [validator, documentos]);

  // Usar el hook de validación de BaseValidator
  const {
    validationResults: _validationResults,
    validationSummary,
    runValidation: _runValidation,
  } = useValidation(
    validator,
    documentos,
    true,
    useCallback(
      (_summary: unknown) => {
        if (onValidationComplete) {
          onValidationComplete(detailedResults);
        }
      },
      [onValidationComplete, detailedResults]
    )
  );

  // Agrupar resultados detallados por categoría
  const resultsByCategory = useMemo(() => {
    const groups: Record<string, DocumentValidationResult[]> = {};

    detailedResults.forEach((result) => {
      const rule = VALIDATION_RULES.find((r) => r.id === result.ruleId);
      const category = rule?.category || 'otros';

      if (!groups[category]) groups[category] = [];
      groups[category].push(result);
    });

    return groups;
  }, [detailedResults]);

  // Estadísticas basadas en BaseValidator
  const stats = useMemo(() => {
    const total = detailedResults.length;
    const errors = validationSummary.errors.length;
    const warnings = validationSummary.warnings.length;
    const infos = validationSummary.infos.length;

    return {
      total,
      errors,
      warnings,
      infos,
      score: validationSummary.score,
      canSave: validationSummary.canSave,
    };
  }, [detailedResults, validationSummary]);

  // Manejo de configuración
  const handleConfigSave = useCallback(() => {
    // Actualizar el validador con la nueva configuración
    validator.updateConfig(validationConfig);
    onConfigChange?.(validationConfig);
    closeConfigModal();

    notifications.show({
      title: 'Configuración Guardada',
      message: 'Las reglas de validación han sido actualizadas',
      color: 'green',
    });
  }, [validator, validationConfig, onConfigChange, closeConfigModal]);

  const handleToggleRule = useCallback(
    (ruleId: string) => {
      setEnabledRules((prev) => {
        const newRules = prev.includes(ruleId)
          ? prev.filter((id) => id !== ruleId)
          : [...prev, ruleId];

        // También actualizar el validador
        validator.toggleRule(ruleId);
        return newRules;
      });
    },
    [validator]
  );

  // Actualizar configuración cuando cambia
  React.useEffect(() => {
    validator.updateConfig(validationConfig);
  }, [validator, validationConfig]);

  // Render por categorías
  const renderByCategory = () => (
    <Stack gap="md">
      {Object.entries(resultsByCategory).map(([category, results]) => (
        <Card key={category} withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500} tt="capitalize">
              {category}
            </Text>
            <Badge>{results.length}</Badge>
          </Group>

          <Stack gap="xs">
            {results.map((result, index) => (
              <Group key={index} justify="space-between">
                <Group>
                  <ThemeIcon size="xs" color="red" variant="light">
                    <IconX size={12} />
                  </ThemeIcon>

                  <Text size="sm">
                    {result.entidadNombre}: {result.mensaje}
                  </Text>
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
        <ValidationStats stats={stats} />
        <ValidationSummaryComponent
          stats={stats}
          detailedResults={detailedResults}
          onEditDocument={onEditDocument}
        />
      </Stack>
    );
  }

  if (variant === 'by-category') {
    return (
      <Stack gap="md">
        <ValidationStats stats={stats} />
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

            <Button variant="light" leftSection={<IconRefresh size={16} />} loading={loading}>
              Validar
            </Button>
          </Group>
        </Group>

        <Text size="sm" c="dimmed">
          Validando {documentos.length} documentos con {enabledRules.length} reglas activas
          {stats.score && <> • Puntuación: {stats.score.toFixed(0)}%</>}
        </Text>
      </Paper>

      {/* Estadísticas */}
      <ValidationStats stats={stats} />

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
          <ValidationSummaryComponent
            stats={stats}
            detailedResults={detailedResults}
            onEditDocument={onEditDocument}
          />
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
              {detailedResults.map((result, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Group gap="xs">
                      {result.entidadTipo === 'vehiculo' ? (
                        <IconTruck size={14} />
                      ) : (
                        <IconUser size={14} />
                      )}
                      <Text size="sm">{result.entidadNombre}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{result.mensaje}</Text>
                    {result.detalles && (
                      <Text size="xs" c="dimmed">
                        {result.detalles}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge color="red" size="sm">
                      error
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
                onChange={(value) =>
                  setValidationConfig((prev) => ({
                    ...prev,
                    diasCritico: Number(value) || 7,
                  }))
                }
                min={1}
                max={30}
              />

              <NumberInput
                label="Días próximos"
                value={validationConfig.diasProximo}
                onChange={(value) =>
                  setValidationConfig((prev) => ({
                    ...prev,
                    diasProximo: Number(value) || 30,
                  }))
                }
                min={1}
                max={90}
              />
            </Group>

            <Switch
              label="Requiere número de documento"
              checked={validationConfig.requiereNumeroDocumento}
              onChange={(event) =>
                setValidationConfig((prev) => ({
                  ...prev,
                  requiereNumeroDocumento: event.currentTarget.checked,
                }))
              }
            />

            <Switch
              label="Validar consistencia de fechas"
              checked={validationConfig.validarConsistenciaFechas}
              onChange={(event) =>
                setValidationConfig((prev) => ({
                  ...prev,
                  validarConsistenciaFechas: event.currentTarget.checked,
                }))
              }
            />

            <Title order={5} mt="md">
              Reglas Activas
            </Title>

            <Stack gap="xs">
              {VALIDATION_RULES.map((rule) => (
                <Group key={rule.id} justify="space-between">
                  <Box>
                    <Text fw={500} size="sm">
                      {rule.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {rule.description}
                    </Text>
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
              <Button onClick={handleConfigSave}>Guardar Configuración</Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Stack>
  );
};

export default DocumentValidatorGeneric;
