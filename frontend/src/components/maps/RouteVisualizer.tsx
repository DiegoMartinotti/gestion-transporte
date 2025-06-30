import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Select,
  Paper,
  Badge,
  Card,
  ActionIcon,
  Tooltip,
  Alert,
  Switch,
  Divider,
  Grid,
  ScrollArea
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconNavigation,
  IconRefresh,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconClock,
  IconRoad,
  IconGasStation,
  IconCoin
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Site } from '../../types';

interface RouteWaypoint {
  location: { lat: number; lng: number };
  stopover?: boolean;
  site?: Site;
}

interface RouteStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  instructions: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  travel_mode: string;
}

interface RouteResult {
  overview_path: { lat: number; lng: number }[];
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_address: string;
    end_address: string;
    steps: RouteStep[];
  }>;
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

interface RouteVisualizerProps {
  origin?: { lat: number; lng: number } | Site;
  destination?: { lat: number; lng: number } | Site;
  waypoints?: RouteWaypoint[];
  onWaypointsChange?: (waypoints: RouteWaypoint[]) => void;
  sites?: Site[];
  height?: number;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  optimizeWaypoints?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  showSteps?: boolean;
  showAlternatives?: boolean;
  autoCalculate?: boolean;
}

export default function RouteVisualizer({
  origin,
  destination,
  waypoints = [],
  onWaypointsChange,
  sites = [],
  height = 500,
  travelMode = 'DRIVING',
  optimizeWaypoints = false,
  avoidHighways = false,
  avoidTolls = false,
  showSteps = true,
  showAlternatives = false,
  autoCalculate = true
}: RouteVisualizerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [alternativeRenderers, setAlternativeRenderers] = useState<any[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);

  // Cargar Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            setMapLoaded(true);
            clearInterval(checkGoogle);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa y servicios
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: -34.6037, lng: -58.3816 },
      mapTypeId: window.google.maps.MapTypeId.ROADMAP
    });

    const newDirectionsService = new window.google.maps.DirectionsService();
    const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
      draggable: true,
      map: newMap,
      panel: null
    });

    // Listener para cambios en la ruta arrastrable
    newDirectionsRenderer.addListener('directions_changed', () => {
      const result = newDirectionsRenderer.getDirections();
      setRoute(result);
    });

    setMap(newMap);
    setDirectionsService(newDirectionsService);
    setDirectionsRenderer(newDirectionsRenderer);
  }, [mapLoaded, map]);

  // Obtener coordenadas
  const getCoordinates = useCallback((location: { lat: number; lng: number } | Site | undefined) => {
    if (!location) return null;
    
    if ('coordenadas' in location) {
      return location.coordenadas;
    }
    
    return location;
  }, []);

  // Calcular ruta
  const calculateRoute = useCallback(async () => {
    const originCoords = getCoordinates(origin);
    const destinationCoords = getCoordinates(destination);

    if (!originCoords || !destinationCoords || !directionsService) {
      setError('Debe seleccionar origen y destino');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request = {
        origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        destination: new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lng),
        waypoints: waypoints.map(wp => ({
          location: new window.google.maps.LatLng(wp.location.lat, wp.location.lng),
          stopover: wp.stopover !== false
        })),
        optimizeWaypoints,
        travelMode: window.google.maps.TravelMode[travelMode],
        avoidHighways,
        avoidTolls,
        provideRouteAlternatives: showAlternatives
      };

      directionsService.route(request, (result: any, status: any) => {
        setLoading(false);
        
        if (status === 'OK') {
          // Ruta principal
          setRoute(result.routes[0]);
          directionsRenderer.setDirections(result);
          
          // Rutas alternativas
          if (showAlternatives && result.routes.length > 1) {
            const alternatives = result.routes.slice(1);
            setAlternativeRoutes(alternatives);
            
            // Limpiar renderers anteriores
            alternativeRenderers.forEach(renderer => renderer.setMap(null));
            
            // Crear nuevos renderers para alternativas
            const newRenderers = alternatives.map((route: any, index: number) => {
              const renderer = new window.google.maps.DirectionsRenderer({
                map,
                directions: { ...result, routes: [route] },
                routeIndex: 0,
                polylineOptions: {
                  strokeColor: index === 0 ? '#666666' : '#999999',
                  strokeOpacity: 0.6,
                  strokeWeight: 4
                }
              });
              return renderer;
            });
            
            setAlternativeRenderers(newRenderers);
          }
          
          setError('');
          
          notifications.show({
            title: 'Ruta calculada',
            message: `Distancia: ${result.routes[0].legs[0].distance.text}, Tiempo: ${result.routes[0].legs[0].duration.text}`,
            color: 'green'
          });
        } else {
          setError('No se pudo calcular la ruta');
        }
      });
    } catch (error) {
      setLoading(false);
      setError('Error al calcular la ruta');
    }
  }, [origin, destination, waypoints, directionsService, directionsRenderer, map,
      travelMode, optimizeWaypoints, avoidHighways, avoidTolls, showAlternatives,
      alternativeRenderers, getCoordinates]);

  // Auto-calcular cuando cambian parámetros
  useEffect(() => {
    if (autoCalculate && origin && destination && directionsService) {
      const timer = setTimeout(calculateRoute, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCalculate, origin, destination, calculateRoute, directionsService]);

  // Toggle capa de tráfico
  const toggleTrafficLayer = useCallback(() => {
    if (!map) return;
    
    if (showTraffic) {
      // Ocultar tráfico
      setShowTraffic(false);
    } else {
      // Mostrar tráfico
      const trafficLayer = new window.google.maps.TrafficLayer();
      trafficLayer.setMap(map);
      setShowTraffic(true);
    }
  }, [map, showTraffic]);

  // Exportar ruta
  const exportRoute = useCallback(() => {
    if (!route) return;
    
    const routeData = {
      origin: getCoordinates(origin),
      destination: getCoordinates(destination),
      waypoints: waypoints,
      route: {
        summary: route.summary,
        distance: route.legs.reduce((acc, leg) => acc + leg.distance.value, 0),
        duration: route.legs.reduce((acc, leg) => acc + leg.duration.value, 0),
        legs: route.legs
      },
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(routeData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ruta-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [route, origin, destination, waypoints, getCoordinates]);

  // Abrir en Google Maps
  const openInGoogleMaps = useCallback(() => {
    const originCoords = getCoordinates(origin);
    const destinationCoords = getCoordinates(destination);
    
    if (!originCoords || !destinationCoords) return;
    
    let url = `https://maps.google.com/maps?saddr=${originCoords.lat},${originCoords.lng}&daddr=${destinationCoords.lat},${destinationCoords.lng}`;
    
    if (waypoints.length > 0) {
      const waypointStr = waypoints.map(wp => `${wp.location.lat},${wp.location.lng}`).join('|');
      url += `&waypoints=${waypointStr}`;
    }
    
    url += '&dirflg=d';
    window.open(url, '_blank');
  }, [origin, destination, waypoints, getCoordinates]);

  const totalDistance = route?.legs.reduce((acc, leg) => acc + leg.distance.value, 0) || 0;
  const totalDuration = route?.legs.reduce((acc, leg) => acc + leg.duration.value, 0) || 0;

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Text fw={600} size="lg">Visualizador de Rutas</Text>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRoute size={16} />}
            onClick={calculateRoute}
            loading={loading}
          >
            Calcular Ruta
          </Button>
          {route && (
            <>
              <Tooltip label="Exportar ruta">
                <ActionIcon variant="light" onClick={exportRoute}>
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Abrir en Google Maps">
                <ActionIcon variant="light" color="blue" onClick={openInGoogleMaps}>
                  <IconNavigation size={16} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Group>

      {/* Controles */}
      <Paper p="md" withBorder>
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="sm">
              <Select
                label="Modo de viaje"
                data={[
                  { value: 'DRIVING', label: 'Conduciendo' },
                  { value: 'WALKING', label: 'Caminando' },
                  { value: 'TRANSIT', label: 'Transporte público' },
                  { value: 'BICYCLING', label: 'Bicicleta' }
                ]}
                value={travelMode}
                onChange={(value) => {}} // TODO: Implement travel mode change
              />
              
              <Group>
                <Switch
                  label="Evitar autopistas"
                  checked={avoidHighways}
                  onChange={(e) => {}} // TODO: Implement avoid highways toggle
                />
                <Switch
                  label="Evitar peajes"
                  checked={avoidTolls}
                  onChange={(e) => {}} // TODO: Implement avoid tolls toggle
                />
              </Group>
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Stack gap="sm">
              <Group>
                <Switch
                  label="Optimizar waypoints"
                  checked={optimizeWaypoints}
                  onChange={(e) => {}} // TODO: Implement optimize waypoints toggle
                />
                <Switch
                  label="Rutas alternativas"
                  checked={showAlternatives}
                  onChange={(e) => {}} // TODO: Implement show alternatives toggle
                />
              </Group>
              
              <Group>
                <Switch
                  label="Mostrar tráfico"
                  checked={showTraffic}
                  onChange={toggleTrafficLayer}
                />
                <Switch
                  label="Mostrar instrucciones"
                  checked={showInstructions}
                  onChange={(e) => setShowInstructions(e.currentTarget.checked)}
                />
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Error */}
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      <Grid>
        {/* Mapa */}
        <Grid.Col span={showInstructions ? 8 : 12}>
          <Paper withBorder>
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: height,
                borderRadius: 8
              }}
            />
          </Paper>
        </Grid.Col>

        {/* Panel de instrucciones */}
        {showInstructions && route && (
          <Grid.Col span={4}>
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600}>Instrucciones</Text>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => setShowInstructions(false)}
                  >
                    <IconEyeOff size={16} />
                  </ActionIcon>
                </Group>
                
                {/* Resumen de la ruta */}
                <Card withBorder bg="blue.0">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group>
                        <IconRoad size={16} />
                        <Text size="sm" fw={500}>Distancia total</Text>
                      </Group>
                      <Text fw={600}>{(totalDistance / 1000).toFixed(1)} km</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Group>
                        <IconClock size={16} />
                        <Text size="sm" fw={500}>Tiempo estimado</Text>
                      </Group>
                      <Text fw={600}>{Math.round(totalDuration / 60)} min</Text>
                    </Group>
                  </Stack>
                </Card>

                {/* Pasos de la ruta */}
                <ScrollArea h={height - 200}>
                  <Stack gap="sm">
                    {route.legs.map((leg, legIndex) => (
                      <div key={legIndex}>
                        {legIndex > 0 && <Divider />}
                        {leg.steps.map((step, stepIndex) => (
                          <Card key={stepIndex} p="sm" withBorder>
                            <Stack gap="xs">
                              <Text
                                size="sm"
                                dangerouslySetInnerHTML={{
                                  __html: step.instructions.replace(/<[^>]*>/g, '')
                                }}
                              />
                              <Group justify="space-between">
                                <Badge variant="light" size="sm">
                                  {step.distance.text}
                                </Badge>
                                <Badge variant="light" size="sm" color="orange">
                                  {step.duration.text}
                                </Badge>
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                      </div>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Paper>
          </Grid.Col>
        )}
      </Grid>

      {/* Información de rutas alternativas */}
      {showAlternatives && alternativeRoutes.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text fw={600}>Rutas Alternativas</Text>
            <Grid>
              {alternativeRoutes.map((altRoute, index) => (
                <Grid.Col key={index} span={4}>
                  <Card withBorder>
                    <Stack gap="xs">
                      <Text fw={500} size="sm">Ruta {index + 2}</Text>
                      <Group justify="space-between">
                        <Text size="xs">
                          {(altRoute.legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1000).toFixed(1)} km
                        </Text>
                        <Text size="xs">
                          {Math.round(altRoute.legs.reduce((acc, leg) => acc + leg.duration.value, 0) / 60)} min
                        </Text>
                      </Group>
                      {altRoute.summary && (
                        <Text size="xs" c="dimmed">{altRoute.summary}</Text>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}