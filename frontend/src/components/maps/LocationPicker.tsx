import React, { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Group,
  Button,
  TextInput,
  Text,
  Paper,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  NumberInput
} from '@mantine/core';
import {
  IconMapPin,
  IconSearch,
  IconCurrentLocation,
  IconCheck,
  IconX,
  IconCrosshair
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import MapView from './MapView';
import type { MapMarker } from './MapView';

interface LocationPickerProps {
  value?: { lat: number; lng: number };
  onChange: (location: { lat: number; lng: number } | null) => void;
  onAddressChange?: (address: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  height?: number;
  showSearch?: boolean;
  showCoordinates?: boolean;
  showCurrentLocation?: boolean;
  initialZoom?: number;
  searchPlaceholder?: string;
  error?: string;
}

export default function LocationPicker({
  value,
  onChange,
  onAddressChange,
  label = "Seleccionar ubicación",
  placeholder = "Haga clic en el mapa para seleccionar ubicación",
  required = false,
  disabled = false,
  height = 300,
  showSearch = true,
  showCoordinates = true,
  showCurrentLocation = true,
  initialZoom = 10,
  searchPlaceholder = "Buscar dirección...",
  error
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(value || null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(() => {
    return value || { lat: -34.6037, lng: -58.3816 }; // Buenos Aires por defecto
  });
  const [manualLat, setManualLat] = useState<number>(value?.lat || 0);
  const [manualLng, setManualLng] = useState<number>(value?.lng || 0);
  const [manualMode, setManualMode] = useState(false);

  // Sincronizar con valor externo
  useEffect(() => {
    if (value && (value.lat !== selectedLocation?.lat || value.lng !== selectedLocation?.lng)) {
      setSelectedLocation(value);
      setMapCenter(value);
      setManualLat(value.lat);
      setManualLng(value.lng);
    }
  }, [value, selectedLocation]);

  // Manejar click en el mapa
  const handleMapClick = useCallback((position: { lat: number; lng: number }) => {
    if (disabled) return;
    
    setSelectedLocation(position);
    setManualLat(position.lat);
    setManualLng(position.lng);
    onChange(position);
    
    notifications.show({
      title: 'Ubicación seleccionada',
      message: `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`,
      color: 'green',
      autoClose: 2000
    });
  }, [disabled, onChange]);

  // Buscar dirección
  const handleSearchAddress = useCallback(async () => {
    if (!searchAddress.trim() || searchLoading) return;

    setSearchLoading(true);
    try {
      // Simulación de geocoding - en producción usar service real
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          const newPosition = { lat: location.lat, lng: location.lng };
          
          setSelectedLocation(newPosition);
          setMapCenter(newPosition);
          setManualLat(newPosition.lat);
          setManualLng(newPosition.lng);
          onChange(newPosition);
          
          if (onAddressChange) {
            onAddressChange(data.results[0].formatted_address);
          }
          
          notifications.show({
            title: 'Dirección encontrada',
            message: data.results[0].formatted_address,
            color: 'green'
          });
        } else {
          notifications.show({
            title: 'No encontrado',
            message: 'No se pudo encontrar la dirección especificada',
            color: 'orange'
          });
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al buscar la dirección',
        color: 'red'
      });
    } finally {
      setSearchLoading(false);
    }
  }, [searchAddress, searchLoading, onChange, onAddressChange]);

  // Obtener ubicación actual
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      notifications.show({
        title: 'Error',
        message: 'Geolocalización no disponible en este navegador',
        color: 'red'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setSelectedLocation(newPosition);
        setMapCenter(newPosition);
        setManualLat(newPosition.lat);
        setManualLng(newPosition.lng);
        onChange(newPosition);
        
        notifications.show({
          title: 'Ubicación actual',
          message: 'Se obtuvo tu ubicación actual',
          color: 'green'
        });
      },
      (error) => {
        let message = 'No se pudo obtener la ubicación actual';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado';
            break;
        }
        
        notifications.show({
          title: 'Error',
          message,
          color: 'red'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [onChange]);

  // Limpiar selección
  const handleClearSelection = useCallback(() => {
    setSelectedLocation(null);
    setManualLat(0);
    setManualLng(0);
    onChange(null);
    
    notifications.show({
      title: 'Ubicación eliminada',
      message: 'Se eliminó la ubicación seleccionada',
      color: 'blue'
    });
  }, [onChange]);

  // Aplicar coordenadas manuales
  const handleApplyManualCoordinates = useCallback(() => {
    if (manualLat === 0 && manualLng === 0) {
      notifications.show({
        title: 'Error',
        message: 'Ingrese coordenadas válidas',
        color: 'red'
      });
      return;
    }

    if (manualLat < -90 || manualLat > 90 || manualLng < -180 || manualLng > 180) {
      notifications.show({
        title: 'Error',
        message: 'Coordenadas fuera del rango válido',
        color: 'red'
      });
      return;
    }

    const newPosition = { lat: manualLat, lng: manualLng };
    setSelectedLocation(newPosition);
    setMapCenter(newPosition);
    onChange(newPosition);
    setManualMode(false);
    
    notifications.show({
      title: 'Coordenadas aplicadas',
      message: `Lat: ${manualLat.toFixed(6)}, Lng: ${manualLng.toFixed(6)}`,
      color: 'green'
    });
  }, [manualLat, manualLng, onChange]);

  // Crear marcador para la ubicación seleccionada
  const markers: MapMarker[] = selectedLocation ? [
    {
      id: 'selected-location',
      position: selectedLocation,
      title: 'Ubicación seleccionada',
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#e03131"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `),
      content: `
        <div style="padding: 8px;">
          <h4 style="margin: 0 0 4px 0;">Ubicación seleccionada</h4>
          <p style="margin: 0; font-size: 12px;">
            Lat: ${selectedLocation.lat.toFixed(6)}<br/>
            Lng: ${selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      `
    }
  ] : [];

  return (
    <Stack gap="md">
      {/* Label */}
      <Text size="sm" fw={500}>
        {label}
        {required && <Text component="span" c="red"> *</Text>}
      </Text>

      {/* Buscador de direcciones */}
      {showSearch && (
        <Group>
          <TextInput
            placeholder={searchPlaceholder}
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            disabled={disabled}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchAddress();
              }
            }}
          />
          <Button
            variant="light"
            leftSection={<IconSearch size={16} />}
            onClick={handleSearchAddress}
            loading={searchLoading}
            disabled={disabled || !searchAddress.trim()}
          >
            Buscar
          </Button>
          {showCurrentLocation && (
            <Tooltip label="Usar ubicación actual">
              <ActionIcon
                variant="light"
                color="blue"
                onClick={handleCurrentLocation}
                disabled={disabled}
              >
                <IconCurrentLocation size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      )}

      {/* Estado de la selección */}
      <Group justify="space-between">
        <Group>
          {selectedLocation ? (
            <Badge color="green" variant="light" leftSection={<IconCheck size={14} />}>
              Ubicación seleccionada
            </Badge>
          ) : (
            <Badge color="gray" variant="light" leftSection={<IconCrosshair size={14} />}>
              Sin ubicación
            </Badge>
          )}
        </Group>
        
        {selectedLocation && (
          <Group gap="xs">
            <Tooltip label="Eliminar ubicación">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={handleClearSelection}
                disabled={disabled}
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      {/* Mapa */}
      <Paper withBorder>
        <MapView
          height={height}
          center={mapCenter}
          zoom={selectedLocation ? 15 : initialZoom}
          markers={markers}
          onMapClick={handleMapClick}
          showCurrentLocation={false}
          disabled={disabled}
        />
      </Paper>

      {/* Coordenadas manuales */}
      {showCoordinates && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500} size="sm">Coordenadas manuales</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setManualMode(!manualMode)}
              >
                {manualMode ? 'Cancelar' : 'Editar'}
              </Button>
            </Group>
            
            {manualMode ? (
              <Stack gap="sm">
                <Group>
                  <NumberInput
                    label="Latitud"
                    placeholder="-34.6037"
                    value={manualLat}
                    onChange={(val) => setManualLat(typeof val === 'number' ? val : 0)}
                    decimalScale={6}
                    step={0.000001}
                    min={-90}
                    max={90}
                    disabled={disabled}
                    style={{ flex: 1 }}
                  />
                  <NumberInput
                    label="Longitud"
                    placeholder="-58.3816"
                    value={manualLng}
                    onChange={(val) => setManualLng(typeof val === 'number' ? val : 0)}
                    decimalScale={6}
                    step={0.000001}
                    min={-180}
                    max={180}
                    disabled={disabled}
                    style={{ flex: 1 }}
                  />
                </Group>
                <Group justify="flex-end">
                  <Button
                    variant="light"
                    leftSection={<IconMapPin size={16} />}
                    onClick={handleApplyManualCoordinates}
                    disabled={disabled}
                  >
                    Aplicar coordenadas
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {selectedLocation 
                    ? `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`
                    : 'Sin coordenadas seleccionadas'
                  }
                </Text>
              </Group>
            )}
          </Stack>
        </Paper>
      )}

      {/* Placeholder text */}
      {!selectedLocation && (
        <Text size="sm" c="dimmed" ta="center">
          {placeholder}
        </Text>
      )}

      {/* Error */}
      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}
    </Stack>
  );
}