import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Title,
  Grid,
  Button,
  Badge,
  Group,
  Stack,
  Text,
  Alert,
  Card,
  List,
  ThemeIcon,
  Progress,
  Divider,
  ActionIcon,
  Collapse,
  Box
} from '@mantine/core';
import { 
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconExclamationMark,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconTruck,
  IconRoute,
  IconCoin,
  IconCalendar
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface ValidationRule {
  id: string;
  category: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  required: boolean;
  validator: (data: ViajeData) => ValidationResult;
}

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string[];
  suggestion?: string;
}

interface ViajeData {
  cliente?: any;
  tramo?: any;
  vehiculos?: any[];
  personal?: any[];
  fecha?: Date;
  palets?: number;
  extras?: any[];
  observaciones?: string;
  estado?: string;
  ordenCompra?: any;
  tarifaCalculada?: number;
  formulasAplicadas?: any[];
}

interface ViajeValidatorProps {
  data: ViajeData;
  onValidationChange?: (validation: ValidationSummary) => void;
  autoValidate?: boolean;
  showDetails?: boolean;
  readonly?: boolean;
}

interface ValidationSummary {
  isValid: boolean;
  totalRules: number;
  passedRules: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
  score: number;
  canSave: boolean;
  canSubmit: boolean;
}

export const ViajeValidator: React.FC<ViajeValidatorProps> = ({
  data,
  onValidationChange,
  autoValidate = true,
  showDetails = true,
  readonly = false
}) => {
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [detailsOpened, { toggle: toggleDetails }] = useDisclosure(showDetails);

  // Reglas de validación
  const validationRules = useMemo<ValidationRule[]>(() => [
    // Reglas básicas requeridas
    {
      id: 'cliente-required',
      category: 'Datos Básicos',
      name: 'Cliente Requerido',
      description: 'El viaje debe tener un cliente asignado',
      severity: 'error',
      required: true,
      validator: (data) => ({
        passed: !!data.cliente,
        message: data.cliente ? 'Cliente asignado correctamente' : 'Debe seleccionar un cliente',
        suggestion: !data.cliente ? 'Seleccione un cliente de la lista' : undefined
      })
    },
    {
      id: 'tramo-required',
      category: 'Datos Básicos',
      name: 'Tramo Requerido',
      description: 'El viaje debe tener un tramo definido',
      severity: 'error',
      required: true,
      validator: (data) => ({
        passed: !!data.tramo,
        message: data.tramo ? 'Tramo asignado correctamente' : 'Debe seleccionar un tramo',
        suggestion: !data.tramo ? 'Seleccione un tramo de la lista de rutas disponibles' : undefined
      })
    },
    {
      id: 'fecha-required',
      category: 'Datos Básicos',
      name: 'Fecha Requerida',
      description: 'El viaje debe tener una fecha programada',
      severity: 'error',
      required: true,
      validator: (data) => ({
        passed: !!data.fecha,
        message: data.fecha ? 'Fecha asignada correctamente' : 'Debe establecer una fecha para el viaje',
        suggestion: !data.fecha ? 'Seleccione la fecha programada del viaje' : undefined
      })
    },
    {
      id: 'palets-required',
      category: 'Datos Básicos',
      name: 'Cantidad de Palets',
      description: 'Debe especificar la cantidad de palets a transportar',
      severity: 'error',
      required: true,
      validator: (data) => ({
        passed: !!(data.palets && data.palets > 0),
        message: data.palets && data.palets > 0 
          ? `${data.palets} palets especificados` 
          : 'Debe especificar una cantidad válida de palets',
        suggestion: !data.palets || data.palets <= 0 ? 'Ingrese la cantidad de palets a transportar (mayor a 0)' : undefined
      })
    },

    // Reglas de vehículos
    {
      id: 'vehiculos-required',
      category: 'Vehículos',
      name: 'Vehículos Asignados',
      description: 'El viaje debe tener al menos un vehículo asignado',
      severity: 'error',
      required: true,
      validator: (data) => ({
        passed: !!(data.vehiculos && data.vehiculos.length > 0),
        message: data.vehiculos && data.vehiculos.length > 0
          ? `${data.vehiculos.length} vehículo(s) asignado(s)`
          : 'Debe asignar al menos un vehículo',
        suggestion: !data.vehiculos || data.vehiculos.length === 0 ? 'Seleccione los vehículos que realizarán el viaje' : undefined
      })
    },
    {
      id: 'vehiculos-documentacion',
      category: 'Vehículos',
      name: 'Documentación de Vehículos',
      description: 'Los vehículos deben tener documentación vigente',
      severity: 'warning',
      required: false,
      validator: (data) => {
        if (!data.vehiculos || data.vehiculos.length === 0) {
          return { passed: false, message: 'No hay vehículos para validar' };
        }

        const vehiculosConProblemas = data.vehiculos.filter(vehiculo => {
          // Simular verificación de documentación
          const documentos = vehiculo.documentacion || {};
          const vencidos = Object.values(documentos).some((doc: any) => {
            if (doc.fechaVencimiento) {
              return new Date(doc.fechaVencimiento) < new Date();
            }
            return false;
          });
          return vencidos;
        });

        return {
          passed: vehiculosConProblemas.length === 0,
          message: vehiculosConProblemas.length === 0
            ? 'Documentación de vehículos vigente'
            : `${vehiculosConProblemas.length} vehículo(s) con documentación vencida`,
          details: vehiculosConProblemas.map(v => `${v.patente || v.nombre}: Documentación vencida`),
          suggestion: vehiculosConProblemas.length > 0 ? 'Revise y actualice la documentación de los vehículos' : undefined
        };
      }
    },

    // Reglas de personal
    {
      id: 'personal-required',
      category: 'Personal',
      name: 'Personal Asignado',
      description: 'El viaje debe tener personal asignado',
      severity: 'error',
      required: true,
      validator: (data) => ({
        passed: !!(data.personal && data.personal.length > 0),
        message: data.personal && data.personal.length > 0
          ? `${data.personal.length} persona(s) asignada(s)`
          : 'Debe asignar personal al viaje',
        suggestion: !data.personal || data.personal.length === 0 ? 'Asigne al menos un chofer al viaje' : undefined
      })
    },
    {
      id: 'chofer-requerido',
      category: 'Personal',
      name: 'Chofer Principal',
      description: 'Debe haber al menos un chofer asignado',
      severity: 'error',
      required: true,
      validator: (data) => {
        if (!data.personal || data.personal.length === 0) {
          return { passed: false, message: 'No hay personal asignado' };
        }

        const choferes = data.personal.filter(p => p.tipo === 'CHOFER' || p.tipoPersonal === 'CHOFER');
        return {
          passed: choferes.length > 0,
          message: choferes.length > 0
            ? `${choferes.length} chofer(es) asignado(s)`
            : 'Debe asignar al menos un chofer',
          suggestion: choferes.length === 0 ? 'Asigne un chofer principal para el viaje' : undefined
        };
      }
    },

    // Reglas de fecha
    {
      id: 'fecha-futura',
      category: 'Programación',
      name: 'Fecha Válida',
      description: 'La fecha del viaje debe ser válida',
      severity: 'warning',
      required: false,
      validator: (data) => {
        if (!data.fecha) {
          return { passed: false, message: 'No hay fecha asignada' };
        }

        const fechaViaje = new Date(data.fecha);
        const ahora = new Date();
        const diferenciaDias = Math.ceil((fechaViaje.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

        if (diferenciaDias < 0) {
          return {
            passed: false,
            message: 'La fecha del viaje está en el pasado',
            suggestion: 'Verifique si es correcto programar un viaje en fecha pasada'
          };
        }

        if (diferenciaDias > 365) {
          return {
            passed: false,
            message: 'La fecha del viaje está muy lejana',
            suggestion: 'Verifique la fecha del viaje'
          };
        }

        return {
          passed: true,
          message: diferenciaDias === 0 
            ? 'Viaje programado para hoy'
            : `Viaje programado en ${diferenciaDias} día(s)`
        };
      }
    },

    // Reglas de cálculo
    {
      id: 'tarifa-calculada',
      category: 'Cálculos',
      name: 'Tarifa Calculada',
      description: 'El viaje debe tener una tarifa calculada',
      severity: 'warning',
      required: false,
      validator: (data) => ({
        passed: !!(data.tarifaCalculada && data.tarifaCalculada > 0),
        message: data.tarifaCalculada && data.tarifaCalculada > 0
          ? `Tarifa calculada: $${data.tarifaCalculada.toLocaleString()}`
          : 'No hay tarifa calculada',
        suggestion: !data.tarifaCalculada || data.tarifaCalculada <= 0 
          ? 'Calcule la tarifa del viaje' : undefined
      })
    },

    // Reglas de compatibilidad
    {
      id: 'cliente-tramo-compatibilidad',
      category: 'Compatibilidad',
      name: 'Cliente-Tramo Compatible',
      description: 'El tramo debe pertenecer al cliente seleccionado',
      severity: 'error',
      required: true,
      validator: (data) => {
        if (!data.cliente || !data.tramo) {
          return { passed: false, message: 'Faltan datos para validar compatibilidad' };
        }

        const clienteId = typeof data.cliente === 'string' ? data.cliente : data.cliente._id;
        const tramoClienteId = typeof data.tramo.cliente === 'string' ? data.tramo.cliente : data.tramo.cliente?._id;

        return {
          passed: clienteId === tramoClienteId,
          message: clienteId === tramoClienteId
            ? 'Cliente y tramo son compatibles'
            : 'El tramo no pertenece al cliente seleccionado',
          suggestion: clienteId !== tramoClienteId 
            ? 'Seleccione un tramo que pertenezca al cliente elegido' : undefined
        };
      }
    }
  ], []);

  // Ejecutar validación
  const runValidation = () => {
    const results: Record<string, ValidationResult> = {};
    
    validationRules.forEach(rule => {
      try {
        results[rule.id] = rule.validator(data);
      } catch (error) {
        results[rule.id] = {
          passed: false,
          message: `Error al validar: ${rule.name}`,
          details: [error instanceof Error ? error.message : 'Error desconocido']
        };
      }
    });

    setValidationResults(results);
  };

  // Calcular resumen de validación
  const validationSummary = useMemo<ValidationSummary>(() => {
    const rules = validationRules.map(rule => ({
      rule,
      result: validationResults[rule.id]
    })).filter(({ result }) => result);

    const totalRules = rules.length;
    const passedRules = rules.filter(({ result }) => result.passed).length;
    
    const errors = rules
      .filter(({ rule, result }) => rule.severity === 'error' && !result.passed)
      .map(({ result }) => result);
    
    const warnings = rules
      .filter(({ rule, result }) => rule.severity === 'warning' && !result.passed)
      .map(({ result }) => result);
    
    const infos = rules
      .filter(({ rule, result }) => rule.severity === 'info' && !result.passed)
      .map(({ result }) => result);

    const requiredRules = validationRules.filter(rule => rule.required);
    const passedRequiredRules = requiredRules.filter(rule => {
      const result = validationResults[rule.id];
      return result && result.passed;
    });

    const score = totalRules > 0 ? (passedRules / totalRules) * 100 : 0;
    const canSave = errors.length === 0;
    const canSubmit = canSave && passedRequiredRules.length === requiredRules.length;

    return {
      isValid: errors.length === 0 && warnings.length === 0,
      totalRules,
      passedRules,
      errors,
      warnings,
      infos,
      score,
      canSave,
      canSubmit
    };
  }, [validationResults, validationRules]);

  // Auto-validar cuando cambian los datos
  useEffect(() => {
    if (autoValidate) {
      runValidation();
    }
  }, [data, autoValidate]);

  // Notificar cambios
  useEffect(() => {
    onValidationChange?.(validationSummary);
  }, [validationSummary, onValidationChange]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Datos Básicos': return <IconTruck size={16} />;
      case 'Vehículos': return <IconTruck size={16} />;
      case 'Personal': return <IconClock size={16} />;
      case 'Programación': return <IconCalendar size={16} />;
      case 'Cálculos': return <IconCoin size={16} />;
      case 'Compatibilidad': return <IconRoute size={16} />;
      default: return <IconCheck size={16} />;
    }
  };

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconShieldCheck size={20} />
            Validador de Viajes
          </Group>
        </Title>
        <Group gap="sm">
          <Badge 
            size="lg" 
            color={getScoreColor(validationSummary.score)}
            variant="light"
          >
            {validationSummary.score.toFixed(0)}% Válido
          </Badge>
          {showDetails && (
            <ActionIcon
              variant="subtle"
              onClick={toggleDetails}
              aria-label="Toggle details"
            >
              {detailsOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Resumen rápido */}
      <Grid mb="md">
        <Grid.Col span={3}>
          <Card withBorder ta="center">
            <Text size="sm" c="dimmed">Total</Text>
            <Text size="lg" fw={600}>{validationSummary.totalRules}</Text>
            <Text size="xs">Reglas</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card withBorder ta="center">
            <Text size="sm" c="dimmed">Pasadas</Text>
            <Text size="lg" fw={600} c="green">{validationSummary.passedRules}</Text>
            <Text size="xs">Validaciones</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card withBorder ta="center">
            <Text size="sm" c="dimmed">Errores</Text>
            <Text size="lg" fw={600} c="red">{validationSummary.errors.length}</Text>
            <Text size="xs">Críticos</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card withBorder ta="center">
            <Text size="sm" c="dimmed">Advertencias</Text>
            <Text size="lg" fw={600} c="yellow">{validationSummary.warnings.length}</Text>
            <Text size="xs">Menores</Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Barra de progreso */}
      <Box mb="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Progreso de Validación</Text>
          <Text size="sm" c="dimmed">
            {validationSummary.passedRules}/{validationSummary.totalRules}
          </Text>
        </Group>
        <Progress 
          value={validationSummary.score} 
          color={getScoreColor(validationSummary.score)}
          size="lg"
        />
      </Box>

      {/* Estado de guardado */}
      <Group mb="md">
        <Badge 
          color={validationSummary.canSave ? 'green' : 'red'}
          variant="light"
          leftSection={validationSummary.canSave ? <IconCheck size={12} /> : <IconX size={12} />}
        >
          {validationSummary.canSave ? 'Puede guardar' : 'No puede guardar'}
        </Badge>
        
        <Badge 
          color={validationSummary.canSubmit ? 'green' : 'orange'}
          variant="light"
          leftSection={validationSummary.canSubmit ? <IconCheck size={12} /> : <IconExclamationMark size={12} />}
        >
          {validationSummary.canSubmit ? 'Puede enviar' : 'No puede enviar'}
        </Badge>
      </Group>

      {/* Errores críticos */}
      {validationSummary.errors.length > 0 && (
        <Alert color="red" icon={<IconX size={16} />} mb="md">
          <Text fw={500} mb="xs">Errores que deben corregirse:</Text>
          <List size="sm">
            {validationSummary.errors.map((error, index) => (
              <List.Item key={index}>
                {error.message}
                {error.suggestion && (
                  <Text size="xs" c="dimmed" ml="md">
                    💡 {error.suggestion}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        </Alert>
      )}

      {/* Advertencias */}
      {validationSummary.warnings.length > 0 && (
        <Alert color="yellow" icon={<IconAlertTriangle size={16} />} mb="md">
          <Text fw={500} mb="xs">Advertencias:</Text>
          <List size="sm">
            {validationSummary.warnings.map((warning, index) => (
              <List.Item key={index}>
                {warning.message}
                {warning.suggestion && (
                  <Text size="xs" c="dimmed" ml="md">
                    💡 {warning.suggestion}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        </Alert>
      )}

      {/* Detalles completos */}
      <Collapse in={detailsOpened}>
        <Card withBorder>
          <Title order={5} mb="md">Detalles de Validación</Title>
          
          <Stack gap="md">
            {Object.entries(
              validationRules.reduce((acc, rule) => {
                if (!acc[rule.category]) {
                  acc[rule.category] = [];
                }
                acc[rule.category].push(rule);
                return acc;
              }, {} as Record<string, ValidationRule[]>)
            ).map(([category, rules]) => (
              <Box key={category}>
                <Group mb="xs">
                  <ThemeIcon size="sm" variant="light">
                    {getCategoryIcon(category)}
                  </ThemeIcon>
                  <Text fw={500}>{category}</Text>
                </Group>
                
                <Stack gap="xs" pl="md">
                  {rules.map(rule => {
                    const result = validationResults[rule.id];
                    if (!result) return null;
                    
                    return (
                      <Group key={rule.id} justify="space-between">
                        <Group gap="xs">
                          <ThemeIcon 
                            size="xs" 
                            color={result.passed ? 'green' : rule.severity === 'error' ? 'red' : 'yellow'}
                            variant="light"
                          >
                            {result.passed ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                          <Text size="sm">{rule.name}</Text>
                        </Group>
                        <Text size="sm" c={result.passed ? 'green' : 'dimmed'}>
                          {result.message}
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
                
                <Divider mt="sm" />
              </Box>
            ))}
          </Stack>
        </Card>
      </Collapse>

      {/* Botón de re-validación */}
      {!autoValidate && !readonly && (
        <Group justify="center" mt="md">
          <Button
            onClick={runValidation}
            leftSection={<IconShieldCheck size={16} />}
          >
            Validar Datos
          </Button>
        </Group>
      )}
    </Paper>
  );
};