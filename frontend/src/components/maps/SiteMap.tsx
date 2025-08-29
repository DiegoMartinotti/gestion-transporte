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
import { 
  getMarkerIcon, 
  createInfoWindowContent, 
  getClienteName, 
  filterSites, 
  isValidCoordinates, 
  adjustMapBounds 
} from './SiteMapHelpers';

interface SiteMapProps {
  sites: Site[];
  selectedSite?: Site;
  onSiteSelect?: (site: Site) => void;
  onSiteEdit?: (site: Site) => void;
  height?: number;
  showFilters?: boolean;
  clientes?: Cliente[];
}

interface GoogleMap {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: GoogleLatLngBounds, padding?: { top: number; right: number; bottom: number; left: number }) => void;
}

interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  getPosition: () => { lat: () => number; lng: () => number };
  addListener: (event: string, callback: () => void) => void;
}

interface GoogleInfoWindow {
  setContent: (content: string) => void;
  open: (map: GoogleMap, marker: GoogleMarker) => void;
}

interface GoogleLatLngBounds {
  extend: (position: { lat: number; lng: number }) => void;
}

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => GoogleMap;
        Marker: new (options: unknown) => GoogleMarker;
        InfoWindow: new () => GoogleInfoWindow;
        LatLngBounds: new () => GoogleLatLngBounds;
        Size: new (width: number, height: number) => { width: number; height: number };
        MapTypeId: { ROADMAP: string };
      };
    };
    initMap: () => void;
  }
}


// Componente para los filtros del mapa
const SiteMapFilters = ({ 
  showFilters, clientes, selectedCliente, setSelectedCliente, 
  showInactiveSites, setShowInactiveSites, filteredSites, handleCenterMap 
}: {
  showFilters: boolean;
  clientes: Cliente[];
  selectedCliente: string;
  setSelectedCliente: (value: string) => void;
  showInactiveSites: boolean;
  setShowInactiveSites: (value: boolean) => void;
  filteredSites: Site[];
  handleCenterMap: () => void;
}) => {
  if (!showFilters) return null;

  return (
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
  );
};

// Componente para la información del site seleccionado
const SelectedSiteCard = ({ 
  selectedSite, clientes, onSiteEdit 
}: {
  selectedSite: Site | undefined;
  clientes: Cliente[];
  onSiteEdit?: (site: Site) => void;
}) => {
  if (!selectedSite) return null;

  const handleOpenInMaps = () => {
    if (selectedSite.coordenadas) {
      const url = `https://maps.google.com/?q=${selectedSite.coordenadas.lat},${selectedSite.coordenadas.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
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
              onClick={handleOpenInMaps}
            >
              <IconRoute size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
};

// Hook personalizado para el manejo del mapa de sites
const useSiteMapLogic = (props: SiteMapProps) => {
  const { sites } = props;
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [markers, setMarkers] = useState<GoogleMarker[]>([]);
  const [infoWindow, setInfoWindow] = useState<GoogleInfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filteredSites, setFilteredSites] = useState(sites);
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [showInactiveSites, setShowInactiveSites] = useState(true);

  // Filtrar sites
  useEffect(() => {
    const filtered = filterSites(sites, selectedCliente, showInactiveSites);
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

  const handleCenterMap = () => {
    if (!map || filteredSites.length === 0) return;
    adjustMapBounds(map, filteredSites, window);
  };

  return {
    mapRef, map, setMap, markers, setMarkers, infoWindow, setInfoWindow,
    mapLoaded, filteredSites, selectedCliente, setSelectedCliente,
    showInactiveSites, setShowInactiveSites, handleCenterMap
  };
};

// Hook para manejo de efectos del mapa
const useSiteMapEffects = (props: {
  mapLoaded: boolean; mapRef: React.RefObject<HTMLDivElement>; map: GoogleMap | null;
  setMap: (map: GoogleMap) => void; setInfoWindow: (infoWindow: GoogleInfoWindow) => void;
  filteredSites: Site[]; markers: GoogleMarker[]; infoWindow: GoogleInfoWindow | null;
  onSiteSelect: ((site: Site) => void) | undefined; clientes: Cliente[];
  setMarkers: (markers: GoogleMarker[]) => void; selectedSite: Site | undefined;
}) => {
  const { 
    mapLoaded, mapRef, map, setMap, setInfoWindow, filteredSites, markers,
    infoWindow, onSiteSelect, clientes, setMarkers, selectedSite
  } = props;

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const mapOptions = {
      zoom: 6,
      center: { lat: -34.6037, lng: -58.3816 },
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
  }, [mapLoaded, map, mapRef, setMap, setInfoWindow]);

  // Actualizar marcadores
  useEffect(() => {
    if (!map || !window.google) return;

    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: GoogleMarker[] = [];
    const bounds = new window.google.maps.LatLngBounds();

    filteredSites.forEach((site) => {
      if (!isValidCoordinates(site) || !site.coordenadas) return;
      
      const position = { lat: site.coordenadas.lat, lng: site.coordenadas.lng };
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: site.nombre,
        icon: {
          url: getMarkerIcon(site.activo !== false),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      const infoContent = createInfoWindowContent(site, clientes);
      marker.addListener('click', () => {
        if (infoWindow) {
          infoWindow.setContent(infoContent);
          infoWindow.open(map, marker);
        }
        if (onSiteSelect) {
          onSiteSelect(site);
        }
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);
    adjustMapBounds(map, filteredSites, window);
  }, [map, filteredSites, infoWindow, onSiteSelect, clientes, markers, setMarkers]);

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

    if (selectedMarker && infoWindow) {
      map.setCenter(selectedMarker.getPosition());
      map.setZoom(15);

      const infoContent = createInfoWindowContent(selectedSite, clientes);
      infoWindow.setContent(infoContent);
      infoWindow.open(map, selectedMarker);
    }
  }, [selectedSite, map, markers, infoWindow, clientes]);
};

export default function SiteMap(props: SiteMapProps) {
  const { selectedSite, onSiteSelect, onSiteEdit, height = 500, showFilters = true, clientes = [] } = props;
  const {
    mapRef, map, setMap, markers, setMarkers, infoWindow, setInfoWindow,
    mapLoaded, filteredSites, selectedCliente, setSelectedCliente,
    showInactiveSites, setShowInactiveSites, handleCenterMap
  } = useSiteMapLogic(props);

  useSiteMapEffects({
    mapLoaded, mapRef, map, setMap, setInfoWindow, filteredSites, markers,
    infoWindow, onSiteSelect, clientes, setMarkers, selectedSite
  });

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
      <SiteMapFilters
        showFilters={showFilters}
        clientes={clientes}
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        showInactiveSites={showInactiveSites}
        setShowInactiveSites={setShowInactiveSites}
        filteredSites={filteredSites}
        handleCenterMap={handleCenterMap}
      />

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

      <SelectedSiteCard
        selectedSite={selectedSite}
        clientes={clientes}
        onSiteEdit={onSiteEdit}
      />
    </Stack>
  );
}
