import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  Badge,
  Card,
  Select,
  Switch,
} from '@mantine/core';
import { IconMapPin, IconEye, IconRoute, IconCurrentLocation, IconMap } from '@tabler/icons-react';
import { Site, Cliente } from '../../types';

interface SiteMapProps {
  sites: Site[];
  selectedSite?: Site;
  onSiteSelect?: (site: Site) => void;
  onSiteEdit?: (site: Site) => void;
  height?: number;
  showFilters?: boolean;
  clientes?: Cliente[];
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Constantes para literales duplicados
const CLIENT_NOT_FOUND_TEXT = 'Cliente no encontrado';
const NO_CLIENT_TEXT = 'Sin cliente';

// Función helper para validar coordenadas
const hasValidCoordinates = (site: Site): boolean => {
  return !(!site.coordenadas || site.coordenadas.lat === 0 || site.coordenadas.lng === 0);
};

// Función helper para obtener nombre del cliente
const getClienteName = (site: Site, clientes: Cliente[]): string => {
  if (typeof site.cliente === 'string') {
    return clientes.find((c) => c._id === site.cliente)?.nombre || CLIENT_NOT_FOUND_TEXT;
  }
  return site.cliente?.nombre || NO_CLIENT_TEXT;
};

// Función helper para crear contenido del infoWindow
const createInfoWindowContent = (site: Site, clientes: Cliente[]): string => {
  const clienteNombre = getClienteName(site, clientes);
  const lat = site.coordenadas?.lat?.toFixed(6) || '0';
  const lng = site.coordenadas?.lng?.toFixed(6) || '0';

  return `
    <div style="max-width: 300px; padding: 8px;">
      <h3 style="margin: 0 0 8px 0; color: #228be6;">${site.nombre}</h3>
      <p style="margin: 4px 0; color: #666;"><strong>Cliente:</strong> ${clienteNombre}</p>
      <p style="margin: 4px 0; color: #666;"><strong>Dirección:</strong> ${site.direccion}</p>
      <p style="margin: 4px 0; color: #666;"><strong>Ciudad:</strong> ${site.localidad || site.ciudad || 'N/A'}</p>
      <p style="margin: 4px 0; color: #666;"><strong>Provincia:</strong> ${site.provincia}</p>
      <p style="margin: 4px 0; color: #666;">
        <strong>Estado:</strong> 
        <span style="color: ${site.activo === false ? '#dc3545' : '#28a745'};">
          ${site.activo === false ? 'Inactivo' : 'Activo'}
        </span>
      </p>
      <p style="margin: 8px 0 4px 0; font-size: 12px; color: #999;">
        Lat: ${lat}, Lng: ${lng}
      </p>
    </div>
  `;
};

export default function SiteMap({
  sites,
  selectedSite,
  onSiteSelect,
  onSiteEdit,
  height = 500,
  showFilters = true,
  clientes = [],
}: SiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filteredSites, setFilteredSites] = useState(sites);
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [showInactiveSites, setShowInactiveSites] = useState(true);

  // Filtrar sites
  useEffect(() => {
    let filtered = sites;

    if (selectedCliente) {
      filtered = filtered.filter((site) =>
        typeof site.cliente === 'string'
          ? site.cliente === selectedCliente
          : site.cliente._id === selectedCliente
      );
    }

    if (!showInactiveSites) {
      filtered = filtered.filter((site) => site.activo !== false);
    }

    setFilteredSites(filtered);
  }, [sites, selectedCliente, showInactiveSites]);

  // Cargar Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
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

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const mapOptions = {
      zoom: 6,
      center: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    const newInfoWindow = new window.google.maps.InfoWindow();

    setMap(newMap);
    setInfoWindow(newInfoWindow);
  }, [mapLoaded, map]);

  // Actualizar marcadores cuando cambian los sites
  useEffect(() => {
    if (!map || !window.google) return;

    // Limpiar marcadores existentes
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers: any[] = [];
    const bounds = new window.google.maps.LatLngBounds();

    filteredSites.forEach((site) => {
      if (!hasValidCoordinates(site)) {
        return;
      }

      const position = {
        lat: site.coordenadas!.lat,
        lng: site.coordenadas!.lng,
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: site.nombre,
        icon: {
          url:
            site.activo === false
              ? 'data:image/svg+xml;charset=UTF-8,' +
                encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc3545"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `)
              : 'data:image/svg+xml;charset=UTF-8,' +
                encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#228be6"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      const infoContent = createInfoWindowContent(site, clientes);

      marker.addListener('click', () => {
        infoWindow.setContent(infoContent);
        infoWindow.open(map, marker);

        if (onSiteSelect) {
          onSiteSelect(site);
        }
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Ajustar vista para mostrar todos los marcadores
    if (newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        map.fitBounds(bounds, padding);
      }
    }
  }, [map, filteredSites, infoWindow, onSiteSelect, clientes, markers]);

  // Destacar site seleccionado
  useEffect(() => {
    if (!selectedSite || !map) return;

    const selectedMarker = markers.find((marker) => {
      const position = marker.getPosition();
      return (
        position.lat() === selectedSite.coordenadas?.lat &&
        position.lng() === selectedSite.coordenadas?.lng
      );
    });

    if (selectedMarker) {
      map.setCenter(selectedMarker.getPosition());
      map.setZoom(15);

      const infoContent = createInfoWindowContent(selectedSite, clientes);
      infoWindow.setContent(infoContent);
      infoWindow.open(map, selectedMarker);
    }
  }, [selectedSite, map, markers, infoWindow, clientes]);

  const handleCenterMap = () => {
    if (!map || filteredSites.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    filteredSites.forEach((site) => {
      if (site.coordenadas && site.coordenadas.lat !== 0 && site.coordenadas.lng !== 0) {
        bounds.extend({ lat: site.coordenadas.lat, lng: site.coordenadas.lng });
      }
    });

    if (filteredSites.length === 1) {
      const site = filteredSites[0];
      if (site.coordenadas) {
        map.setCenter({ lat: site.coordenadas.lat, lng: site.coordenadas.lng });
        map.setZoom(15);
      }
    } else {
      map.fitBounds(bounds);
    }
  };

  if (!mapLoaded) {
    return (
      <Paper h={height} withBorder>
        <Stack align="center" justify="center" h="100%">
          <IconMap size={48} color="gray" />
          <Text c="dimmed">Cargando mapa...</Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Filtros */}
      {showFilters && (
        <Paper p="md" withBorder>
          <Group justify="space-between" align="end">
            <Group>
              <Select
                label="Cliente"
                placeholder="Todos los clientes"
                value={selectedCliente}
                onChange={(value) => setSelectedCliente(value || '')}
                data={[
                  { value: '', label: 'Todos los clientes' },
                  ...clientes.map((cliente) => ({
                    value: cliente._id,
                    label: cliente.nombre,
                  })),
                ]}
                clearable
                style={{ minWidth: 200 }}
              />
              <Box>
                <Switch
                  label="Mostrar sites inactivos"
                  checked={showInactiveSites}
                  onChange={(event) => setShowInactiveSites(event.currentTarget.checked)}
                />
              </Box>
            </Group>

            <Group>
              <Badge variant="light" color="blue">
                {filteredSites.length} sites
              </Badge>
              <Tooltip label="Centrar mapa">
                <ActionIcon
                  variant="light"
                  onClick={handleCenterMap}
                  disabled={filteredSites.length === 0}
                >
                  <IconCurrentLocation size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Mapa */}
      <Paper withBorder>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: height,
            borderRadius: 8,
          }}
        />
      </Paper>

      {/* Información del site seleccionado */}
      {selectedSite && (
        <Card withBorder>
          <Group justify="space-between" align="start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group>
                <Text fw={600} size="lg">
                  {selectedSite.nombre}
                </Text>
                <Badge color={selectedSite.activo === false ? 'red' : 'green'} variant="light">
                  {selectedSite.activo === false ? 'Inactivo' : 'Activo'}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed">
                <strong>Cliente:</strong> {getClienteName(selectedSite, clientes)}
              </Text>

              <Text size="sm">
                {selectedSite.direccion}, {selectedSite.localidad || selectedSite.ciudad},{' '}
                {selectedSite.provincia}
              </Text>

              <Text size="xs" c="dimmed">
                Coordenadas: {selectedSite.coordenadas?.lat?.toFixed(6) || '0'},{' '}
                {selectedSite.coordenadas?.lng?.toFixed(6) || '0'}
              </Text>
            </Stack>

            <Group>
              <Tooltip label="Ver detalles">
                <ActionIcon variant="light" color="blue">
                  <IconEye size={16} />
                </ActionIcon>
              </Tooltip>
              {onSiteEdit && (
                <Tooltip label="Editar site">
                  <ActionIcon
                    variant="light"
                    color="orange"
                    onClick={() => onSiteEdit(selectedSite)}
                  >
                    <IconMapPin size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="Ver en Google Maps">
                <ActionIcon
                  variant="light"
                  color="green"
                  onClick={() => {
                    if (selectedSite.coordenadas) {
                      const url = `https://maps.google.com/?q=${selectedSite.coordenadas.lat},${selectedSite.coordenadas.lng}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  <IconRoute size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Card>
      )}
    </Stack>
  );
}
