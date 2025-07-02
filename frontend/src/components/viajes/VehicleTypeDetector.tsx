import React, { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Button,
  Select,
  NumberInput,
  Alert,
  Divider,
  ActionIcon,
  Tooltip,
  Progress,
  Box
} from '@mantine/core';
import {
  IconTruck,
  IconScale,
  IconRuler,
  IconUsers,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconBulb,
  IconCalculator
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export interface VehicleDetectionResult {
  tipoUnidad: string;
  confidence: number;
  reasons: string[];
  recommendations: string[];
  alternativeTypes: Array<{
    tipo: string;
    confidence: number;
    reason: string;
  }>;
}

export interface VehicleSpecs {
  capacidadCarga: number;
  dimensiones?: {
    largo?: number;
    ancho?: number;
    alto?: number;
  };
  tipoCarroceria?: string;
  cantidadEjes?: number;
  pesoVacio?: number;
  combustible?: string;
}

interface VehicleTypeDetectorProps {
  vehicleSpecs: VehicleSpecs;
  onDetectionResult: (result: VehicleDetectionResult) => void;
  cargaEstimada?: number;
  distanciaViaje?: number;
  tipoRuta?: 'urbana' | 'ruta' | 'mixta';
}

const TIPOS_UNIDAD = [
  { value: 'camion_simple', label: 'Camión Simple', capacidadMin: 1000, capacidadMax: 8000 },
  { value: 'camion_con_acoplado', label: 'Camión con Acoplado', capacidadMin: 8000, capacidadMax: 25000 },
  { value: 'tractocamion_semirremolque', label: 'Tractocamión con Semirremolque', capacidadMin: 15000, capacidadMax: 45000 },
  { value: 'bitrren', label: 'Bitrén', capacidadMin: 35000, capacidadMax: 75000 },
  { value: 'portacontenedor', label: 'Portacontenedor', capacidadMin: 10000, capacidadMax: 35000 },
  { value: 'furgon', label: 'Furgón', capacidadMin: 500, capacidadMax: 3500 },
  { value: 'utilitario', label: 'Utilitario', capacidadMin: 100, capacidadMax: 1500 }
];

const CARROCERIA_MAPPING: Record<string, string[]> = {
  'cerrado': ['furgon', 'camion_simple'],
  'abierto': ['camion_simple', 'camion_con_acoplado'],
  'plataforma': ['camion_con_acoplado', 'tractocamion_semirremolque'],
  'contenedor': ['portacontenedor'],
  'tanque': ['camion_simple', 'camion_con_acoplado'],
  'refrigerado': ['camion_simple', 'tractocamion_semirremolque']
};

export function VehicleTypeDetector({
  vehicleSpecs,
  onDetectionResult,
  cargaEstimada,
  distanciaViaje,
  tipoRuta = 'mixta'
}: VehicleTypeDetectorProps) {
  const [detecting, setDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<VehicleDetectionResult | null>(null);
  const [manualOverride, setManualOverride] = useState<string | null>(null);

  useEffect(() => {
    if (vehicleSpecs.capacidadCarga) {
      performDetection();
    }
  }, [vehicleSpecs, cargaEstimada, distanciaViaje, tipoRuta]);

  const performDetection = async () => {
    setDetecting(true);
    
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = detectVehicleType();
      setLastResult(result);
      onDetectionResult(result);
      
    } catch (error) {
      console.error('Error in detection:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al detectar tipo de vehículo',
        color: 'red'
      });
    } finally {
      setDetecting(false);
    }
  };

  const detectVehicleType = (): VehicleDetectionResult => {
    const results: Array<{ tipo: string; score: number; reasons: string[] }> = [];
    
    // Análisis por capacidad de carga
    TIPOS_UNIDAD.forEach(tipo => {
      let score = 0;
      const reasons: string[] = [];
      
      // Puntaje base por capacidad
      if (vehicleSpecs.capacidadCarga >= tipo.capacidadMin && 
          vehicleSpecs.capacidadCarga <= tipo.capacidadMax) {
        score += 40;
        reasons.push(`Capacidad ${vehicleSpecs.capacidadCarga}kg dentro del rango ${tipo.capacidadMin}-${tipo.capacidadMax}kg`);
      } else if (vehicleSpecs.capacidadCarga < tipo.capacidadMin) {
        const diff = (vehicleSpecs.capacidadCarga / tipo.capacidadMin) * 100;
        score += Math.max(0, diff - 50);
        if (diff > 80) {
          reasons.push(`Capacidad ${vehicleSpecs.capacidadCarga}kg cercana al mínimo ${tipo.capacidadMin}kg`);
        }
      }
      
      // Análisis por tipo de carrocería
      if (vehicleSpecs.tipoCarroceria && CARROCERIA_MAPPING[vehicleSpecs.tipoCarroceria]) {
        if (CARROCERIA_MAPPING[vehicleSpecs.tipoCarroceria]?.includes(tipo.value)) {
          score += 20;
          reasons.push(`Carrocería ${vehicleSpecs.tipoCarroceria} compatible`);
        }
      }
      
      // Análisis por cantidad de ejes
      if (vehicleSpecs.cantidadEjes) {
        const expectedAxles = getExpectedAxles(tipo.value);
        if (vehicleSpecs.cantidadEjes === expectedAxles) {
          score += 15;
          reasons.push(`${vehicleSpecs.cantidadEjes} ejes coincide con tipo esperado`);
        } else if (Math.abs(vehicleSpecs.cantidadEjes - expectedAxles) === 1) {
          score += 8;
          reasons.push(`${vehicleSpecs.cantidadEjes} ejes cercano al esperado (${expectedAxles})`);
        }
      }
      
      // Análisis por carga estimada vs capacidad
      if (cargaEstimada) {
        const utilizacion = (cargaEstimada / vehicleSpecs.capacidadCarga) * 100;
        if (utilizacion >= 70 && utilizacion <= 95) {
          score += 15;
          reasons.push(`Utilización óptima: ${utilizacion.toFixed(1)}%`);
        } else if (utilizacion >= 50 && utilizacion < 70) {
          score += 10;
          reasons.push(`Utilización aceptable: ${utilizacion.toFixed(1)}%`);
        }
      }
      
      // Análisis por tipo de ruta
      if (distanciaViaje) {
        const routeScore = getRouteCompatibility(tipo.value, distanciaViaje, tipoRuta);
        score += routeScore.score;
        if (routeScore.reason) {
          reasons.push(routeScore.reason);
        }
      }
      
      results.push({ tipo: tipo.value, score, reasons });
    });
    
    // Ordenar por puntaje
    results.sort((a, b) => b.score - a.score);
    
    const bestMatch = results[0];
    const confidence = Math.min(100, bestMatch.score);
    
    // Generar recomendaciones
    const recommendations = generateRecommendations(results, vehicleSpecs, cargaEstimada);
    
    // Tipos alternativos
    const alternativeTypes = results.slice(1, 4).map(r => ({
      tipo: r.tipo,
      confidence: Math.min(100, r.score),
      reason: r.reasons[0] || 'Alternativa viable'
    }));
    
    return {
      tipoUnidad: bestMatch.tipo,
      confidence,
      reasons: bestMatch.reasons,
      recommendations,
      alternativeTypes
    };
  };

  const getExpectedAxles = (tipoUnidad: string): number => {
    const axlesMap: Record<string, number> = {
      'utilitario': 2,
      'furgon': 2,
      'camion_simple': 2,
      'camion_con_acoplado': 4,
      'tractocamion_semirremolque': 5,
      'portacontenedor': 3,
      'bitrren': 7
    };
    return axlesMap[tipoUnidad] || 2;
  };

  const getRouteCompatibility = (tipoUnidad: string, distancia: number, ruta: string) => {
    let score = 0;
    let reason = '';
    
    if (ruta === 'urbana') {
      if (['utilitario', 'furgon', 'camion_simple'].includes(tipoUnidad)) {
        score = 10;
        reason = 'Apto para circulación urbana';
      } else if (['bitrren', 'tractocamion_semirremolque'].includes(tipoUnidad)) {
        score = -5;
        reason = 'Limitaciones en circulación urbana';
      }
    } else if (ruta === 'ruta' && distancia > 500) {
      if (['tractocamion_semirremolque', 'bitrren', 'camion_con_acoplado'].includes(tipoUnidad)) {
        score = 10;
        reason = 'Eficiente para largas distancias';
      }
    }
    
    return { score, reason };
  };

  const generateRecommendations = (
    results: Array<{ tipo: string; score: number; reasons: string[] }>,
    specs: VehicleSpecs,
    carga?: number
  ): string[] => {
    const recommendations: string[] = [];
    
    if (carga && specs.capacidadCarga) {
      const utilizacion = (carga / specs.capacidadCarga) * 100;
      if (utilizacion > 95) {
        recommendations.push('⚠️ Considere un vehículo de mayor capacidad para mayor seguridad');
      } else if (utilizacion < 50) {
        recommendations.push('💡 Podría optimizar costos con un vehículo de menor capacidad');
      }
    }
    
    if (results[0].score < 60) {
      recommendations.push('🔍 La detección tiene baja confianza, verifique los datos del vehículo');
    }
    
    if (!specs.tipoCarroceria) {
      recommendations.push('📋 Especificar tipo de carrocería mejoraría la precisión');
    }
    
    if (!specs.cantidadEjes) {
      recommendations.push('⚖️ Agregar cantidad de ejes para mejor clasificación');
    }
    
    return recommendations;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'yellow';
    return 'red';
  };

  const getTipoLabel = (tipo: string) => {
    return TIPOS_UNIDAD.find(t => t.value === tipo)?.label || tipo;
  };

  return (
    <Stack gap="md">
      {/* Header con estado */}
      <Card withBorder>
        <Group justify="space-between">
          <Group>
            <IconCalculator size={20} />
            <div>
              <Text fw={500}>Detector de Tipo de Unidad</Text>
              <Text size="sm" c="dimmed">
                Análisis automático basado en especificaciones técnicas
              </Text>
            </div>
          </Group>
          
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={performDetection}
            loading={detecting}
            disabled={!vehicleSpecs.capacidadCarga}
          >
            Detectar
          </Button>
        </Group>
      </Card>

      {/* Parámetros de entrada */}
      <Card withBorder>
        <Text fw={500} mb="md">Parámetros de Análisis</Text>
        <Group grow>
          <div>
            <Text size="sm" fw={500}>Capacidad de Carga</Text>
            <Text size="sm" c="dimmed">{vehicleSpecs.capacidadCarga || 'No especificada'} kg</Text>
          </div>
          {vehicleSpecs.tipoCarroceria && (
            <div>
              <Text size="sm" fw={500}>Tipo de Carrocería</Text>
              <Text size="sm" c="dimmed">{vehicleSpecs.tipoCarroceria}</Text>
            </div>
          )}
          {vehicleSpecs.cantidadEjes && (
            <div>
              <Text size="sm" fw={500}>Cantidad de Ejes</Text>
              <Text size="sm" c="dimmed">{vehicleSpecs.cantidadEjes}</Text>
            </div>
          )}
          {cargaEstimada && (
            <div>
              <Text size="sm" fw={500}>Carga Estimada</Text>
              <Text size="sm" c="dimmed">{cargaEstimada} kg</Text>
            </div>
          )}
        </Group>
      </Card>

      {/* Resultado principal */}
      {lastResult && (
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text fw={600} size="lg">{getTipoLabel(lastResult.tipoUnidad)}</Text>
                <Text size="sm" c="dimmed">Tipo de unidad detectado</Text>
              </div>
              
              <Group>
                <Progress
                  value={lastResult.confidence}
                  color={getConfidenceColor(lastResult.confidence)}
                  size="xl"
                  radius="xl"
                  w={80}
                />
                <div style={{ textAlign: 'center' }}>
                  <Text fw={600} size="sm">{lastResult.confidence.toFixed(0)}%</Text>
                  <Text size="xs" c="dimmed">Confianza</Text>
                </div>
              </Group>
            </Group>

            <Divider />

            {/* Razones de la detección */}
            <div>
              <Text fw={500} mb="xs">Fundamentos del Análisis:</Text>
              <Stack gap="xs">
                {lastResult.reasons.map((reason, index) => (
                  <Group key={index} gap="xs">
                    <IconCheck size={14} color="green" />
                    <Text size="sm">{reason}</Text>
                  </Group>
                ))}
              </Stack>
            </div>

            {/* Recomendaciones */}
            {lastResult.recommendations.length > 0 && (
              <Alert icon={<IconBulb size={16} />} color="blue" variant="light">
                <Text fw={500} mb="xs">Recomendaciones:</Text>
                {lastResult.recommendations.map((rec, index) => (
                  <Text key={index} size="sm">{rec}</Text>
                ))}
              </Alert>
            )}

            {/* Tipos alternativos */}
            {lastResult.alternativeTypes.length > 0 && (
              <div>
                <Text fw={500} mb="xs">Alternativas Consideradas:</Text>
                <Stack gap="xs">
                  {lastResult.alternativeTypes.map((alt, index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm">{getTipoLabel(alt.tipo)}</Text>
                      <Group gap="xs">
                        <Badge color="gray" variant="light" size="sm">
                          {alt.confidence.toFixed(0)}%
                        </Badge>
                        <Text size="xs" c="dimmed">{alt.reason}</Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </div>
            )}
          </Stack>
        </Card>
      )}

      {/* Override manual */}
      <Card withBorder>
        <Text fw={500} mb="md">Override Manual</Text>
        <Group>
          <Select
            placeholder="Seleccionar tipo manualmente"
            data={TIPOS_UNIDAD.map(t => ({ value: t.value, label: t.label }))}
            value={manualOverride}
            onChange={(value) => {
              setManualOverride(value);
              if (value) {
                const manualResult: VehicleDetectionResult = {
                  tipoUnidad: value,
                  confidence: 100,
                  reasons: ['Selección manual del usuario'],
                  recommendations: ['Verificar que la selección manual sea correcta'],
                  alternativeTypes: []
                };
                onDetectionResult(manualResult);
              }
            }}
            flex={1}
          />
          {manualOverride && (
            <Button
              variant="light"
              color="orange"
              onClick={() => {
                setManualOverride(null);
                if (lastResult) {
                  onDetectionResult(lastResult);
                }
              }}
            >
              Volver a Automático
            </Button>
          )}
        </Group>
        {manualOverride && (
          <Alert icon={<IconAlertCircle size={16} />} color="orange" mt="md">
            Usando selección manual. La detección automática está deshabilitada.
          </Alert>
        )}
      </Card>

      {/* Estado sin datos */}
      {!vehicleSpecs.capacidadCarga && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          Especifique la capacidad de carga del vehículo para habilitar la detección automática.
        </Alert>
      )}
    </Stack>
  );
}