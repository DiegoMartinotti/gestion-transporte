import React, { useEffect, useRef } from 'react';
import { Box, Paper, Stack, Text, Loader, Alert, Group, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconMap,
  IconCurrentLocation,
  IconRefresh,
  IconMaximize,
  IconMinimize,
} from '@tabler/icons-react';
import { useGoogleMapsLoader, useMapLogic } from './MapViewHelpers';

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  icon?: string;
  content?: string;
  clickable?: boolean;
  onClick?: (marker: MapMarker) => void;
}

interface MapViewProps {
  height?: number;
  width?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  showCurrentLocation?: boolean;
  showControls?: boolean;
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  onMarkerDragEnd?: (markerId: string, position: { lat: number; lng: number }) => void;
}

const LoadingView = ({
  height,
  width,
  className,
  style,
}: {
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Paper h={height} w={width} withBorder className={className} style={style}>
    <Stack align="center" justify="center" h="100%">
      <Loader size="lg" />
      <Text c="dimmed">Cargando mapa...</Text>
    </Stack>
  </Paper>
);

const ErrorView = ({
  height,
  width,
  className,
  style,
  error,
}: {
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
  error: string;
}) => (
  <Paper h={height} w={width} withBorder className={className} style={style}>
    <Stack align="center" justify="center" h="100%" p="md">
      <Alert color="red" title="Error en el mapa">
        {error}
      </Alert>
    </Stack>
  </Paper>
);

const NotLoadedView = ({
  height,
  width,
  className,
  style,
}: {
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Paper h={height} w={width} withBorder className={className} style={style}>
    <Stack align="center" justify="center" h="100%">
      <IconMap size={48} color="gray" />
      <Text c="dimmed">Cargando Google Maps...</Text>
    </Stack>
  </Paper>
);

interface MapViewRenderProps {
  mapRef: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  showControls: boolean;
  showCurrentLocation: boolean;
  markers: MapMarker[];
  getCurrentLocation: () => void;
  fitToMarkers: () => void;
  toggleFullscreen: () => void;
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
}

const renderMapView = ({
  mapRef,
  isFullscreen,
  showControls,
  showCurrentLocation,
  markers,
  getCurrentLocation,
  fitToMarkers,
  toggleFullscreen,
  height,
  width,
  className,
  style,
}: MapViewRenderProps) => {
  const boxStyle = {
    ...style,
    ...(isFullscreen && {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      zIndex: 9999,
    }),
  };

  return (
    <Box
      pos="relative"
      h={isFullscreen ? '100vh' : height}
      w={isFullscreen ? '100vw' : width}
      className={className}
      style={boxStyle}
    >
      {showControls && (
        <Paper pos="absolute" top={10} right={10} p="xs" style={{ zIndex: 1000 }} shadow="sm">
          <Group gap="xs">
            {showCurrentLocation && (
              <Tooltip label="Mi ubicación">
                <ActionIcon variant="light" color="blue" onClick={getCurrentLocation}>
                  <IconCurrentLocation size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {markers.length > 0 && (
              <Tooltip label="Ajustar a marcadores">
                <ActionIcon variant="light" color="green" onClick={fitToMarkers}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
              <ActionIcon variant="light" color="gray" onClick={toggleFullscreen}>
                {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>
      )}

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: isFullscreen ? 0 : 8,
        }}
      />
    </Box>
  );
};

export default function MapView({
  height = 400,
  width = '100%',
  center = { lat: -34.6037, lng: -58.3816 },
  zoom = 10,
  markers = [],
  onMapClick,
  onMarkerClick,
  showCurrentLocation = true,
  showControls = true,
  mapTypeId = 'roadmap',
  disabled = false,
  loading = false,
  error,
  className,
  style,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { mapLoaded, mapError } = useGoogleMapsLoader();
  const { isFullscreen, initializeMap, getCurrentLocation, fitToMarkers, toggleFullscreen } =
    useMapLogic({
      mapLoaded,
      disabled,
      markers,
      center,
      zoom,
      mapTypeId,
      showControls,
      onMapClick,
      onMarkerClick,
    });

  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      initializeMap(mapRef.current);
    }
  }, [mapLoaded, initializeMap]);

  if (loading) {
    return <LoadingView height={height} width={width} className={className} style={style} />;
  }

  if (error || mapError) {
    return (
      <ErrorView
        height={height}
        width={width}
        className={className}
        style={style}
        error={error || mapError}
      />
    );
  }

  if (!mapLoaded) {
    return <NotLoadedView height={height} width={width} className={className} style={style} />;
  }

  return renderMapView({
    mapRef,
    isFullscreen,
    showControls,
    showCurrentLocation,
    markers,
    getCurrentLocation,
    fitToMarkers,
    toggleFullscreen,
    height,
    width,
    className,
    style,
  });
}
