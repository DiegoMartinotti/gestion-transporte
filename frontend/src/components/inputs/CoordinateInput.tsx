import React, { useState, useEffect } from 'react';
import {
  Group,
  NumberInput,
  Paper,
  Text,
  ActionIcon,
  Tooltip,
  Button,
  Alert,
  Stack,
  Badge
} from '@mantine/core';
import {
  IconMapPin,
  IconCurrentLocation,
  IconCopy,
  IconClipboard,
  IconInfoCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Coordinates {
  lat: number;
  lng: number;
}

interface CoordinateInputProps {
  value?: Coordinates;
  onChange: (coords: Coordinates) => void;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  showValidation?: boolean;
  showMapLink?: boolean;
  showCopyPaste?: boolean;
  showCurrentLocation?: boolean;
  precision?: number;
  error?: string;
}

export default function CoordinateInput({
  value = { lat: 0, lng: 0 },
  onChange,
  label = "Coordenadas GPS",
  description,
  required = false,
  disabled = false,
  showValidation = true,
  showMapLink = true,
  showCopyPaste = true,
  showCurrentLocation = true,
  precision = 6,
  error
}: CoordinateInputProps) {
  const [internalValue, setInternalValue] = useState<Coordinates>(value);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const isValidCoordinate = (coords: Coordinates): boolean => {
    return coords.lat !== 0 && coords.lng !== 0 &&
           coords.lat >= -90 && coords.lat <= 90 &&
           coords.lng >= -180 && coords.lng <= 180;
  };

  const isValid = isValidCoordinate(internalValue);

  const handleLatChange = (val: number | string) => {
    const lat = typeof val === 'number' ? val : parseFloat(val) || 0;
    const newCoords = { ...internalValue, lat };
    setInternalValue(newCoords);
    onChange(newCoords);
  };

  const handleLngChange = (val: number | string) => {
    const lng = typeof val === 'number' ? val : parseFloat(val) || 0;
    const newCoords = { ...internalValue, lng };
    setInternalValue(newCoords);
    onChange(newCoords);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      notifications.show({
        title: 'Error',
        message: 'La geolocalización no está disponible en este navegador',
        color: 'red'
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: parseFloat(position.coords.latitude.toFixed(precision)),
          lng: parseFloat(position.coords.longitude.toFixed(precision))
        };
        setInternalValue(coords);
        onChange(coords);
        setIsGettingLocation(false);
        
        notifications.show({
          title: 'Éxito',
          message: 'Ubicación actual obtenida correctamente',
          color: 'green'
        });
      },
      (error) => {
        setIsGettingLocation(false);
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
  };

  const handleCopyCoordinates = async () => {
    if (!isValid) {
      notifications.show({
        title: 'Error',
        message: 'No hay coordenadas válidas para copiar',
        color: 'orange'
      });
      return;
    }

    const coordString = `${internalValue.lat.toFixed(precision)},${internalValue.lng.toFixed(precision)}`;
    
    try {
      await navigator.clipboard.writeText(coordString);
      notifications.show({
        title: 'Copiado',
        message: 'Coordenadas copiadas al portapapeles',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron copiar las coordenadas',
        color: 'red'
      });
    }
  };

  const handlePasteCoordinates = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().replace(/[^\d.,-]/g, '');
      
      // Soportar diferentes formatos: "lat,lng", "lat, lng", "lat lng"
      const coords = cleaned.split(/[,\s]+/).map(s => parseFloat(s));
      
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const newCoords = {
          lat: parseFloat(coords[0].toFixed(precision)),
          lng: parseFloat(coords[1].toFixed(precision))
        };
        
        // Validar rangos
        if (newCoords.lat >= -90 && newCoords.lat <= 90 && 
            newCoords.lng >= -180 && newCoords.lng <= 180) {
          setInternalValue(newCoords);
          onChange(newCoords);
          
          notifications.show({
            title: 'Éxito',
            message: 'Coordenadas pegadas correctamente',
            color: 'green'
          });
        } else {
          notifications.show({
            title: 'Error',
            message: 'Las coordenadas están fuera del rango válido',
            color: 'red'
          });
        }
      } else {
        notifications.show({
          title: 'Error',
          message: 'Formato inválido. Use: "latitud,longitud"',
          color: 'red'
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron leer las coordenadas del portapapeles',
        color: 'red'
      });
    }
  };

  const openInGoogleMaps = () => {
    if (!isValid) return;
    
    const url = `https://maps.google.com/?q=${internalValue.lat},${internalValue.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Stack gap="xs">
      {/* Label y descripción */}
      <Group justify="space-between" align="end">
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {label}
            {required && <Text component="span" c="red"> *</Text>}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">{description}</Text>
          )}
        </Stack>
        
        {showValidation && (
          <Badge
            color={isValid ? 'green' : (internalValue.lat === 0 && internalValue.lng === 0 ? 'gray' : 'red')}
            variant="light"
            size="sm"
          >
            {isValid ? 'Válidas' : (internalValue.lat === 0 && internalValue.lng === 0 ? 'Sin coordenadas' : 'Inválidas')}
          </Badge>
        )}
      </Group>

      {/* Inputs de coordenadas */}
      <Paper p="sm" withBorder radius="sm" bg={error ? 'red.0' : isValid ? 'green.0' : 'gray.0'}>
        <Stack gap="sm">
          <Group>
            <NumberInput
              label="Latitud"
              placeholder="-34.6037"
              value={internalValue.lat === 0 ? '' : internalValue.lat}
              onChange={handleLatChange}
              decimalScale={precision}
              step={0.000001}
              min={-90}
              max={90}
              disabled={disabled}
              error={error && internalValue.lat === 0}
              style={{ flex: 1 }}
            />
            
            <NumberInput
              label="Longitud"
              placeholder="-58.3816"
              value={internalValue.lng === 0 ? '' : internalValue.lng}
              onChange={handleLngChange}
              decimalScale={precision}
              step={0.000001}
              min={-180}
              max={180}
              disabled={disabled}
              error={error && internalValue.lng === 0}
              style={{ flex: 1 }}
            />
          </Group>

          {/* Acciones */}
          <Group justify="space-between">
            <Group gap="xs">
              {showCurrentLocation && (
                <Tooltip label="Usar ubicación actual">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={handleGetCurrentLocation}
                    loading={isGettingLocation}
                    disabled={disabled}
                  >
                    <IconCurrentLocation size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              
              {showCopyPaste && (
                <>
                  <Tooltip label="Copiar coordenadas">
                    <ActionIcon
                      variant="light"
                      color="gray"
                      onClick={handleCopyCoordinates}
                      disabled={disabled || !isValid}
                    >
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label="Pegar coordenadas">
                    <ActionIcon
                      variant="light"
                      color="gray"
                      onClick={handlePasteCoordinates}
                      disabled={disabled}
                    >
                      <IconClipboard size={16} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Group>
            
            {showMapLink && isValid && (
              <Tooltip label="Ver en Google Maps">
                <ActionIcon
                  variant="light"
                  color="green"
                  onClick={openInGoogleMaps}
                >
                  <IconMapPin size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Stack>
      </Paper>

      {/* Error message */}
      {error && (
        <Alert color="red" variant="light" icon={<IconX size={16} />}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {/* Info sobre el formato */}
      {!error && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
          <Text size="xs">
            Formato: Latitud (-90 a 90), Longitud (-180 a 180). 
            Para Argentina: Lat negativa, Lng negativa.
            {showCopyPaste && ' Puede pegar coordenadas en formato "lat,lng".'}
          </Text>
        </Alert>
      )}
    </Stack>
  );
}