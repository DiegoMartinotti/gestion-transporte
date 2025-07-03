import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Alert,
  Stack,
  Badge,
  Group,
  ActionIcon,
  Collapse,
  Progress,
  Card,
  Title,
  Button,
  Switch,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconSettings,
  IconInfoCircle,
} from '@tabler/icons-react';

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'temporal' | 'capacity' | 'documentation';
  entityType: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  validationFn: (record: any, context?: any) => {
    passed: boolean;
    message?: string;
    details?: any;
  };
}

interface ValidationResult {
  ruleId: string;
  passed: boolean;
  message: string;
  affectedRecords: number;
  details?: any[];
  category: string;
}

interface BusinessRuleValidatorProps {
  data: Record<string, any[]>;
  contextData?: any;
  rules?: BusinessRule[];
  onValidationComplete?: (results: ValidationResult[]) => void;
  onRuleToggle?: (ruleId: string, enabled: boolean) => void;
  autoValidate?: boolean;
  entityType?: string;
  enabledByDefault?: boolean;
  showCategoryFilter?: boolean;
  showSeverityFilter?: boolean;
}

const defaultBusinessRules: BusinessRule[] = [
  // Reglas Financieras
  {
    id: 'tarifa-positive-amount',
    name: 'Tarifas con Montos Positivos',
    description: 'Las tarifas deben tener montos mayores a cero',
    category: 'financial',
    entityType: 'tramos',
    severity: 'error',
    enabled: true,
    validationFn: (tramo) => {
      const tarifas = tramo.tarifas || [];
      for (const tarifa of tarifas) {
        if (tarifa.monto <= 0) {
          return {
            passed: false,
            message: `Tarifa con monto inválido: ${tarifa.monto}`,
            details: { tarifa, tramo: tramo.nombre }
          };
        }
      }
      return { passed: true };
    }
  },
  {
    id: 'extra-valid-pricing',
    name: 'Precios de Extras Válidos',
    description: 'Los extras deben tener precios unitarios válidos',
    category: 'financial',
    entityType: 'extras',
    severity: 'error',
    enabled: true,
    validationFn: (extra) => {
      if (!extra.precioUnitario || extra.precioUnitario <= 0) {
        return {
          passed: false,
          message: `Extra con precio inválido: ${extra.precioUnitario}`,
          details: { extra: extra.nombre }
        };
      }
      return { passed: true };
    }
  },

  // Reglas Operacionales
  {
    id: 'vehiculo-capacity-consistency',
    name: 'Consistencia de Capacidad Vehicular',
    description: 'La capacidad del vehículo debe ser coherente con su tipo',
    category: 'operational',
    entityType: 'vehiculos',
    severity: 'warning',
    enabled: true,
    validationFn: (vehiculo) => {
      const { tipoUnidad, capacidadKg, capacidadM3 } = vehiculo;
      
      // Reglas básicas por tipo de unidad
      const capacityRules: Record<string, { minKg: number; maxKg: number; minM3?: number; maxM3?: number }> = {
        'Camión': { minKg: 3000, maxKg: 50000, minM3: 10, maxM3: 100 },
        'Camioneta': { minKg: 500, maxKg: 3000, minM3: 2, maxM3: 15 },
        'Utilitario': { minKg: 200, maxKg: 1500, minM3: 1, maxM3: 8 },
      };

      const rule = capacityRules[tipoUnidad];
      if (rule) {
        if (capacidadKg < rule.minKg || capacidadKg > rule.maxKg) {
          return {
            passed: false,
            message: `Capacidad en kg inconsistente para ${tipoUnidad}: ${capacidadKg}kg`,
            details: { expected: `${rule.minKg}-${rule.maxKg}kg`, actual: `${capacidadKg}kg` }
          };
        }
      }
      
      return { passed: true };
    }
  },
  {
    id: 'personal-driver-license',
    name: 'Licencia de Conducir Válida',
    description: 'Los choferes deben tener licencia de conducir vigente',
    category: 'operational',
    entityType: 'personal',
    severity: 'error',
    enabled: true,
    validationFn: (personal) => {
      if (personal.tipoPersonal === 'Chofer') {
        const documentacion = personal.documentacion || {};
        const licencia = documentacion.licenciaConducir;
        
        if (!licencia || !licencia.numero) {
          return {
            passed: false,
            message: 'Chofer sin licencia de conducir',
            details: { personal: `${personal.nombre} ${personal.apellido}` }
          };
        }

        const vencimiento = new Date(licencia.vencimiento);
        const hoy = new Date();
        
        if (vencimiento < hoy) {
          return {
            passed: false,
            message: 'Licencia de conducir vencida',
            details: { 
              personal: `${personal.nombre} ${personal.apellido}`,
              vencimiento: licencia.vencimiento 
            }
          };
        }
      }
      
      return { passed: true };
    }
  },

  // Reglas Temporales
  {
    id: 'tarifa-date-overlap',
    name: 'Superposición de Fechas en Tarifas',
    description: 'No debe haber superposición de fechas en tarifas del mismo tramo',
    category: 'temporal',
    entityType: 'tramos',
    severity: 'error',
    enabled: true,
    validationFn: (tramo) => {
      const tarifas = (tramo.tarifas || []).filter((t: any) => t.activa);
      
      for (let i = 0; i < tarifas.length; i++) {
        for (let j = i + 1; j < tarifas.length; j++) {
          const tarifa1 = tarifas[i];
          const tarifa2 = tarifas[j];
          
          const inicio1 = new Date(tarifa1.fechaDesde);
          const fin1 = tarifa1.fechaHasta ? new Date(tarifa1.fechaHasta) : new Date('2099-12-31');
          const inicio2 = new Date(tarifa2.fechaDesde);
          const fin2 = tarifa2.fechaHasta ? new Date(tarifa2.fechaHasta) : new Date('2099-12-31');
          
          // Verificar superposición
          if (inicio1 <= fin2 && inicio2 <= fin1) {
            return {
              passed: false,
              message: 'Superposición de fechas en tarifas',
              details: {
                tarifa1: `${tarifa1.fechaDesde} - ${tarifa1.fechaHasta || 'indefinido'}`,
                tarifa2: `${tarifa2.fechaDesde} - ${tarifa2.fechaHasta || 'indefinido'}`
              }
            };
          }
        }
      }
      
      return { passed: true };
    }
  },
  {
    id: 'viaje-future-date',
    name: 'Fechas de Viaje Válidas',
    description: 'Los viajes no pueden tener fechas muy alejadas en el futuro',
    category: 'temporal',
    entityType: 'viajes',
    severity: 'warning',
    enabled: true,
    validationFn: (viaje) => {
      const fechaViaje = new Date(viaje.fecha);
      const hoy = new Date();
      const unAñoEnFuturo = new Date();
      unAñoEnFuturo.setFullYear(hoy.getFullYear() + 1);
      
      if (fechaViaje > unAñoEnFuturo) {
        return {
          passed: false,
          message: 'Fecha de viaje muy alejada en el futuro',
          details: { fecha: viaje.fecha }
        };
      }
      
      return { passed: true };
    }
  },

  // Reglas de Capacidad
  {
    id: 'site-coordinates-valid',
    name: 'Coordenadas de Site Válidas',
    description: 'Los sites deben tener coordenadas dentro de rangos válidos',
    category: 'capacity',
    entityType: 'sites',
    severity: 'error',
    enabled: true,
    validationFn: (site) => {
      const { latitud, longitud } = site.coordenadas || {};
      
      if (!latitud || !longitud) {
        return {
          passed: false,
          message: 'Site sin coordenadas',
          details: { site: site.nombre }
        };
      }
      
      // Validar rangos (Argentina aproximadamente)
      if (latitud < -55 || latitud > -21 || longitud < -73 || longitud > -53) {
        return {
          passed: false,
          message: 'Coordenadas fuera del rango esperado',
          details: { latitud, longitud, site: site.nombre }
        };
      }
      
      return { passed: true };
    }
  },

  // Reglas de Documentación
  {
    id: 'vehiculo-required-docs',
    name: 'Documentación Obligatoria de Vehículos',
    description: 'Los vehículos deben tener documentación obligatoria',
    category: 'documentation',
    entityType: 'vehiculos',
    severity: 'error',
    enabled: true,
    validationFn: (vehiculo) => {
      const documentacion = vehiculo.documentacion || {};
      const requiredDocs = ['tarjetaVerde', 'seguro', 'vtv'];
      
      for (const doc of requiredDocs) {
        if (!documentacion[doc] || !documentacion[doc].numero) {
          return {
            passed: false,
            message: `Falta documentación obligatoria: ${doc}`,
            details: { vehiculo: vehiculo.patente }
          };
        }
      }
      
      return { passed: true };
    }
  }
];

const BusinessRuleValidator: React.FC<BusinessRuleValidatorProps> = ({
  data,
  contextData,
  rules = defaultBusinessRules,
  onValidationComplete,
  onRuleToggle,
  autoValidate = true,
}) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [enabledRules, setEnabledRules] = useState<Set<string>>(
    new Set(rules.filter(r => r.enabled).map(r => r.id))
  );

  const validateRule = (rule: BusinessRule): ValidationResult => {
    const entityData = data[rule.entityType] || [];
    let passedCount = 0;
    const details: any[] = [];

    entityData.forEach(record => {
      try {
        const result = rule.validationFn(record, contextData);
        if (result.passed) {
          passedCount++;
        } else {
          details.push({
            record,
            message: result.message,
            details: result.details,
          });
        }
      } catch (error) {
        details.push({
          record,
          message: `Error en validación: ${error}`,
          details: { error: String(error) },
        });
      }
    });

    const totalRecords = entityData.length;
    const passed = details.length === 0;

    return {
      ruleId: rule.id,
      passed,
      message: passed
        ? `Todos los registros pasaron la validación (${totalRecords})`
        : `${details.length} de ${totalRecords} registros fallaron la validación`,
      affectedRecords: details.length,
      details: details.length > 0 ? details : undefined,
      category: rule.category,
    };
  };

  const runValidation = async () => {
    setIsValidating(true);

    try {
      const results: ValidationResult[] = [];

      for (const rule of rules) {
        if (enabledRules.has(rule.id) && data[rule.entityType]) {
          const result = validateRule(rule);
          results.push(result);
        }
      }

      setValidationResults(results);
      onValidationComplete?.(results);
    } catch (error) {
      console.error('Error en validación de reglas de negocio:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (autoValidate && Object.keys(data).length > 0) {
      runValidation();
    }
  }, [data, enabledRules, autoValidate]);

  const toggleRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const toggleRule = (ruleId: string) => {
    const newEnabled = new Set(enabledRules);
    if (newEnabled.has(ruleId)) {
      newEnabled.delete(ruleId);
    } else {
      newEnabled.add(ruleId);
    }
    setEnabledRules(newEnabled);
    onRuleToggle?.(ruleId, newEnabled.has(ruleId));
  };

  const getValidationSummary = () => {
    const byCategory = validationResults.reduce((acc, result) => {
      const category = result.category;
      if (!acc[category]) {
        acc[category] = { total: 0, passed: 0, failed: 0 };
      }
      acc[category].total++;
      if (result.passed) {
        acc[category].passed++;
      } else {
        acc[category].failed++;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number; failed: number }>);

    const total = validationResults.length;
    const passed = validationResults.filter(r => r.passed).length;
    const failed = total - passed;

    return { total, passed, failed, byCategory };
  };

  const summary = getValidationSummary();

  const categoryColors: Record<string, string> = {
    financial: 'green',
    operational: 'blue',
    temporal: 'orange',
    capacity: 'purple',
    documentation: 'red',
  };

  const categoryNames: Record<string, string> = {
    financial: 'Financieras',
    operational: 'Operacionales',
    temporal: 'Temporales',
    capacity: 'Capacidad',
    documentation: 'Documentación',
  };

  return (
    <Box>
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Validación de Reglas de Negocio</Title>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              loading={isValidating}
              onClick={runValidation}
              variant="light"
            >
              Revalidar
            </Button>
          </Group>
        </Group>

        <Stack gap="sm" mb="lg">
          <Group>
            <Text size="sm" c="dimmed">Progreso general:</Text>
            <Badge color={summary.failed > 0 ? 'red' : 'green'}>
              {summary.passed}/{summary.total} reglas pasadas
            </Badge>
          </Group>

          <Progress
            value={summary.total > 0 ? (summary.passed / summary.total) * 100 : 0}
            color={summary.failed > 0 ? 'red' : 'green'}
            size="sm"
          />

          <Group gap="xs">
            {Object.entries(summary.byCategory).map(([category, stats]) => (
              <Badge
                key={category}
                color={categoryColors[category]}
                variant={stats.failed > 0 ? 'filled' : 'light'}
                size="sm"
              >
                {categoryNames[category]}: {stats.passed}/{stats.total}
              </Badge>
            ))}
          </Group>

          {summary.failed > 0 && (
            <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
              {summary.failed} regla(s) de negocio no se cumplen
            </Alert>
          )}
        </Stack>

        <Stack gap="xs">
          {rules.map((rule) => {
            const result = validationResults.find(r => r.ruleId === rule.id);
            const isExpanded = expandedRules.has(rule.id);
            const isEnabled = enabledRules.has(rule.id);

            return (
              <Card key={rule.id} withBorder opacity={isEnabled ? 1 : 0.6}>
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start">
                    <Switch
                      checked={isEnabled}
                      onChange={() => toggleRule(rule.id)}
                      size="sm"
                    />
                    
                    {result && isEnabled ? (
                      result.passed ? (
                        <IconCheck size={16} color="green" />
                      ) : (
                        <IconX size={16} color={rule.severity === 'error' ? 'red' : 'orange'} />
                      )
                    ) : (
                      <IconSettings size={16} color="gray" />
                    )}

                    <Box>
                      <Group gap="xs">
                        <Text fw={500}>{rule.name}</Text>
                        <Badge size="xs" color={categoryColors[rule.category]}>
                          {categoryNames[rule.category]}
                        </Badge>
                        <Badge 
                          size="xs" 
                          color={rule.severity === 'error' ? 'red' : rule.severity === 'warning' ? 'yellow' : 'blue'}
                        >
                          {rule.severity}
                        </Badge>
                      </Group>
                      
                      <Group gap="xs" mt="xs">
                        <Text size="sm" c="dimmed">{rule.description}</Text>
                        <Tooltip label="Información sobre la regla">
                          <ActionIcon variant="subtle" size="xs">
                            <IconInfoCircle size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                      
                      {result && isEnabled && (
                        <Text size="sm" mt="xs" c={result.passed ? 'green' : 'red'}>
                          {result.message}
                        </Text>
                      )}
                    </Box>
                  </Group>

                  {result && result.details && result.details.length > 0 && (
                    <ActionIcon
                      variant="subtle"
                      onClick={() => toggleRuleExpansion(rule.id)}
                    >
                      {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                  )}
                </Group>

                <Collapse in={isExpanded && !!(result && result.details && result.details.length > 0)}>
                  <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="sm" fw={500} mb="xs">
                      Registros que fallan ({result?.details?.length}):
                    </Text>
                    <Stack gap="xs">
                      {result?.details?.slice(0, 5).map((detail, idx) => (
                        <Box key={idx} p="xs" style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
                          <Text size="xs" c="red" fw={500}>
                            {detail.message}
                          </Text>
                          {detail.details && (
                            <Text size="xs" c="dimmed" mt="2">
                              {JSON.stringify(detail.details, null, 2)}
                            </Text>
                          )}
                        </Box>
                      ))}
                      {result && result.details && result.details.length > 5 && (
                        <Text size="xs" c="dimmed">
                          ... y {result.details.length - 5} registros más
                        </Text>
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      </Card>
    </Box>
  );
};

// Comparador para React.memo
const arePropsEqual = (prevProps: BusinessRuleValidatorProps, nextProps: BusinessRuleValidatorProps): boolean => {
  return (
    prevProps.data?.length === nextProps.data?.length &&
    prevProps.entityType === nextProps.entityType &&
    prevProps.enabledByDefault === nextProps.enabledByDefault &&
    prevProps.showCategoryFilter === nextProps.showCategoryFilter &&
    prevProps.showSeverityFilter === nextProps.showSeverityFilter &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.contextData) === JSON.stringify(nextProps.contextData) &&
    JSON.stringify(prevProps.rules) === JSON.stringify(nextProps.rules)
  );
};

export default React.memo(BusinessRuleValidator, arePropsEqual);