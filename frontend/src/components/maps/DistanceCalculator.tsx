import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Select,
  NumberInput,
  Alert,
  Divider,
  ActionIcon,
  Tooltip,
  Card,
  Grid
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconClock,
  IconGasStation,
  IconCalculator,
  IconRefresh,
  IconArrowRight,
  IconNavigation
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Site } from '../../types';

interface DistanceResult {
  distance: {
    text: string;
    value: number; // en metros
  };
  duration: {
    text: string;
    value: number; // en segundos
  };
  status: string;
}

interface DistanceCalculatorProps {
  origin?: { lat: number; lng: number } | Site;
  destination?: { lat: number; lng: number } | Site;
  onOriginChange?: (location: { lat: number; lng: number } | Site | null) => void;
  onDestinationChange?: (location: { lat: number; lng: number } | Site | null) => void;
  sites?: Site[];
  showSiteSelector?: boolean;
  showManualInput?: boolean;
  showCostCalculator?: boolean;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  autoCalculate?: boolean;
}

export default function DistanceCalculator({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  sites = [],
  showSiteSelector = true,
  showManualInput = true,
  showCostCalculator = false,
  travelMode = 'DRIVING',
  avoidHighways = false,
  avoidTolls = false,
  autoCalculate = true
}: DistanceCalculatorProps) {
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedOriginSite, setSelectedOriginSite] = useState<string>('');
  const [selectedDestinationSite, setSelectedDestinationSite] = useState<string>('');
  const [manualOrigin, setManualOrigin] = useState({ lat: 0, lng: 0 });
  const [manualDestination, setManualDestination] = useState({ lat: 0, lng: 0 });
  const [mode, setMode] = useState<'sites' | 'manual'>('sites');
  
  // Para cálculo de costos
  const [fuelPrice, setFuelPrice] = useState(150); // Precio por litro
  const [fuelConsumption, setFuelConsumption] = useState(35); // Litros por 100km
  const [tollCosts, setTollCosts] = useState(0); // Costos de peajes
  const [driverCost, setDriverCost] = useState(2000); // Costo por hora del conductor

  // Obtener coordenadas de origin/destination
  const getCoordinates = useCallback((location: { lat: number; lng: number } | Site | undefined) => {
    if (!location) return null;
    
    if ('coordenadas' in location) {
      return location.coordenadas;
    }
    
    return location;
  }, []);

  // Calcular distancia usando Google Maps API
  const calculateDistance = useCallback(async () => {
    const originCoords = mode === 'sites' 
      ? (selectedOriginSite ? sites.find(s => s._id === selectedOriginSite)?.coordenadas : getCoordinates(origin))
      : manualOrigin;
      
    const destinationCoords = mode === 'sites'
      ? (selectedDestinationSite ? sites.find(s => s._id === selectedDestinationSite)?.coordenadas : getCoordinates(destination))
      : manualDestination;

    if (!originCoords || !destinationCoords) {
      setError('Debe seleccionar origen y destino');
      return;
    }

    if (originCoords.lat === 0 || originCoords.lng === 0 || 
        destinationCoords.lat === 0 || destinationCoords.lng === 0) {
      setError('Coordenadas inválidas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar si Google Maps está disponible
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps no está disponible');
      }

      const service = new window.google.maps.DistanceMatrixService();
      
      const request = {
        origins: [new window.google.maps.LatLng(originCoords.lat, originCoords.lng)],
        destinations: [new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lng)],
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways,
        avoidTolls
      };

      service.getDistanceMatrix(request, (response: any, status: any) => {
        setLoading(false);
        
        if (status === 'OK') {
          const element = response.rows[0].elements[0];
          
          if (element.status === 'OK') {
            setResult({
              distance: element.distance,
              duration: element.duration,
              status: element.status
            });
            setError('');
          } else {
            setError('No se pudo calcular la ruta entre los puntos seleccionados');
          }
        } else {
          setError('Error en el servicio de Google Maps');
        }
      });
    } catch (error) {
      setLoading(false);
      setError('Error al calcular la distancia');
    }
  }, [mode, selectedOriginSite, selectedDestinationSite, manualOrigin, manualDestination, 
      origin, destination, sites, travelMode, avoidHighways, avoidTolls, getCoordinates]);

  // Auto-calcular cuando cambian origen/destino
  useEffect(() => {
    if (autoCalculate && 
        ((mode === 'sites' && selectedOriginSite && selectedDestinationSite) ||
         (mode === 'manual' && manualOrigin.lat !== 0 && manualDestination.lat !== 0))) {
      const timer = setTimeout(calculateDistance, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCalculate, mode, selectedOriginSite, selectedDestinationSite, 
      manualOrigin, manualDestination, calculateDistance]);

  // Calcular costos estimados
  const calculateCosts = useCallback(() => {
    if (!result) return null;

    const distanceKm = result.distance.value / 1000;
    const durationHours = result.duration.value / 3600;
    
    const fuelCost = (distanceKm * fuelConsumption / 100) * fuelPrice;
    const driverTotalCost = durationHours * driverCost;
    const totalCost = fuelCost + tollCosts + driverTotalCost;

    return {
      distance: distanceKm,
      duration: durationHours,
      fuelCost,
      driverCost: driverTotalCost,
      tollCosts,
      totalCost
    };
  }, [result, fuelPrice, fuelConsumption, tollCosts, driverCost]);

  const costs = calculateCosts();

  // Abrir en Google Maps
  const openInGoogleMaps = useCallback(() => {
    const originCoords = mode === 'sites' 
      ? (selectedOriginSite ? sites.find(s => s._id === selectedOriginSite)?.coordenadas : getCoordinates(origin))
      : manualOrigin;
      
    const destinationCoords = mode === 'sites'
      ? (selectedDestinationSite ? sites.find(s => s._id === selectedDestinationSite)?.coordenadas : getCoordinates(destination))
      : manualDestination;

    if (!originCoords || !destinationCoords) return;

    const url = `https://maps.google.com/maps?saddr=${originCoords.lat},${originCoords.lng}&daddr=${destinationCoords.lat},${destinationCoords.lng}&dirflg=d`;
    window.open(url, '_blank');
  }, [mode, selectedOriginSite, selectedDestinationSite, manualOrigin, manualDestination, 
      origin, destination, sites, getCoordinates]);

  return (
    <Stack gap="md">
      {/* Selector de modo */}
      <Group justify="space-between">
        <Text fw={600} size="lg">Calculadora de Distancias</Text>
        {(showSiteSelector && showManualInput) && (
          <Group>
            <Button.Group>
              <Button
                variant={mode === 'sites' ? 'filled' : 'light'}
                onClick={() => setMode('sites')}
                size="sm"
              >
                Sites
              </Button>
              <Button
                variant={mode === 'manual' ? 'filled' : 'light'}
                onClick={() => setMode('manual')}
                size="sm"
              >
                Manual
              </Button>
            </Button.Group>
          </Group>
        )}
      </Group>

      {/* Selección de origen y destino */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          {mode === 'sites' && showSiteSelector ? (
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Origen"
                  placeholder="Seleccionar site de origen"
                  data={sites.map(site => ({
                    value: site._id,
                    label: `${site.nombre} - ${site.localidad || site.ciudad || ''}`
                  }))}
                  value={selectedOriginSite}
                  onChange={(value) => {
                    setSelectedOriginSite(value || '');
                    const site = sites.find(s => s._id === value);
                    if (site && onOriginChange) {
                      onOriginChange(site);
                    }
                  }}
                  leftSection={<IconMapPin size={16} />}
                  searchable
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Destino"
                  placeholder="Seleccionar site de destino"
                  data={sites.map(site => ({
                    value: site._id,
                    label: `${site.nombre} - ${site.localidad || site.ciudad || ''}`
                  }))}
                  value={selectedDestinationSite}
                  onChange={(value) => {
                    setSelectedDestinationSite(value || '');
                    const site = sites.find(s => s._id === value);
                    if (site && onDestinationChange) {
                      onDestinationChange(site);
                    }
                  }}
                  leftSection={<IconMapPin size={16} />}
                  searchable
                />
              </Grid.Col>
            </Grid>
          ) : (
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Origen</Text>
                  <Group>
                    <NumberInput
                      placeholder="Latitud"
                      value={manualOrigin.lat || ''}
                      onChange={(val) => setManualOrigin(prev => ({ 
                        ...prev, 
                        lat: typeof val === 'number' ? val : 0 
                      }))}
                      decimalScale={6}
                      step={0.000001}
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      placeholder="Longitud"
                      value={manualOrigin.lng || ''}
                      onChange={(val) => setManualOrigin(prev => ({ 
                        ...prev, 
                        lng: typeof val === 'number' ? val : 0 
                      }))}
                      decimalScale={6}
                      step={0.000001}
                      style={{ flex: 1 }}
                    />
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Destino</Text>
                  <Group>
                    <NumberInput
                      placeholder="Latitud"
                      value={manualDestination.lat || ''}
                      onChange={(val) => setManualDestination(prev => ({ 
                        ...prev, 
                        lat: typeof val === 'number' ? val : 0 
                      }))}
                      decimalScale={6}
                      step={0.000001}
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      placeholder="Longitud"
                      value={manualDestination.lng || ''}
                      onChange={(val) => setManualDestination(prev => ({ 
                        ...prev, 
                        lng: typeof val === 'number' ? val : 0 
                      }))}
                      decimalScale={6}
                      step={0.000001}
                      style={{ flex: 1 }}
                    />
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          )}

          {/* Controles de cálculo */}
          <Group justify="space-between">
            <Group>
              <Select
                label="Modo de viaje"
                data={[
                  { value: 'DRIVING', label: 'Conduciendo' },
                  { value: 'WALKING', label: 'Caminando' },
                  { value: 'TRANSIT', label: 'Transporte público' },
                  { value: 'BICYCLING', label: 'Bicicleta' }
                ]}
                value={travelMode}
                onChange={(value) => setMode(value as any)}
                size="sm"
                w={150}
              />
            </Group>
            
            <Group>
              <Button
                variant="light"
                leftSection={<IconCalculator size={16} />}
                onClick={calculateDistance}
                loading={loading}
              >
                Calcular
              </Button>
              
              {result && (
                <Tooltip label="Abrir en Google Maps">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={openInGoogleMaps}
                  >
                    <IconNavigation size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
        </Stack>
      </Paper>

      {/* Error */}
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      {/* Resultados */}
      {result && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} size="lg">Resultados</Text>
              <Group>
                <Badge color="green" variant="light">
                  Calculado
                </Badge>
                <ActionIcon
                  variant="subtle"
                  onClick={calculateDistance}
                  loading={loading}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Group>
            </Group>

            <Grid>
              <Grid.Col span={6}>
                <Card withBorder>
                  <Group>
                    <IconRoute size={24} color="blue" />
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">Distancia</Text>
                      <Text fw={600}>{result.distance.text}</Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Card withBorder>
                  <Group>
                    <IconClock size={24} color="orange" />
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">Tiempo estimado</Text>
                      <Text fw={600}>{result.duration.text}</Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Calculadora de costos */}
            {showCostCalculator && costs && (
              <>
                <Divider label="Calculadora de Costos" labelPosition="center" />
                
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="sm">
                      <NumberInput
                        label="Precio combustible ($/litro)"
                        value={fuelPrice}
                        onChange={(val) => setFuelPrice(typeof val === 'number' ? val : 0)}
                        leftSection={<IconGasStation size={16} />}
                      />
                      <NumberInput
                        label="Consumo (L/100km)"
                        value={fuelConsumption}
                        onChange={(val) => setFuelConsumption(typeof val === 'number' ? val : 0)}
                        decimalScale={1}
                      />
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={6}>
                    <Stack gap="sm">
                      <NumberInput
                        label="Costo conductor ($/hora)"
                        value={driverCost}
                        onChange={(val) => setDriverCost(typeof val === 'number' ? val : 0)}
                      />
                      <NumberInput
                        label="Costos de peajes ($)"
                        value={tollCosts}
                        onChange={(val) => setTollCosts(typeof val === 'number' ? val : 0)}
                      />
                    </Stack>
                  </Grid.Col>
                </Grid>

                <Card withBorder bg="blue.0">
                  <Stack gap="sm">
                    <Text fw={600}>Costos Estimados</Text>
                    <Group justify="space-between">
                      <Text size="sm">Combustible:</Text>
                      <Text fw={500}>${costs.fuelCost.toFixed(2)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Conductor:</Text>
                      <Text fw={500}>${costs.driverCost.toFixed(2)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Peajes:</Text>
                      <Text fw={500}>${costs.tollCosts.toFixed(2)}</Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text fw={600}>Total:</Text>
                      <Text fw={600} size="lg" c="blue">${costs.totalCost.toFixed(2)}</Text>
                    </Group>
                  </Stack>
                </Card>
              </>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}