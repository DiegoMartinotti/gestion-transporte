import React, { useState, useCallback, useEffect } from 'react';
import {
  Group,
  TextInput,
  Button,
  Stack,
  Text,
  Paper,
  Alert,
  Loader,
  ActionIcon,
  Tooltip,
  Badge,
  Card,
  ScrollArea
} from '@mantine/core';
import {
  IconSearch,
  IconMapPin,
  IconCurrentLocation,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconClearAll
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDebouncedValue } from '@mantine/hooks';
import { siteService } from '../../services/siteService';

interface Coordinates {
  lat: number;
  lng: number;
}

interface AddressResult {
  address: string;
  coordinates: Coordinates;
  components: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  confidence: number;
}

interface AddressGeocoderProps {
  onAddressSelect: (result: AddressResult) => void;
  onCoordinatesSelect?: (coords: Coordinates) => void;
  placeholder?: string;
  initialAddress?: string;
  showCurrentLocation?: boolean;
  showResultsLimit?: number;
  autoSearch?: boolean;
  disabled?: boolean;
  country?: string;
}

export default function AddressGeocoder({
  onAddressSelect,
  onCoordinatesSelect,
  placeholder = "Ingrese una dirección para geocodificar",
  initialAddress = '',
  showCurrentLocation = true,
  showResultsLimit = 5,
  autoSearch = true,
  disabled = false,
  country = 'Argentina'
}: AddressGeocoderProps) {
  const [address, setAddress] = useState(initialAddress);
  const [debouncedAddress] = useDebouncedValue(address, 500);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AddressResult | null>(null);
  const [error, setError] = useState<string>('');

  // Auto-búsqueda cuando cambia la dirección
  useEffect(() => {
    if (autoSearch && debouncedAddress.length > 5 && !disabled) {
      handleGeocodeAddress(debouncedAddress);
    }
  }, [debouncedAddress, autoSearch, disabled]);

  const handleGeocodeAddress = useCallback(async (searchAddress?: string) => {
    const addressToSearch = searchAddress || address;
    
    if (!addressToSearch.trim()) {
      setError('Ingrese una dirección para buscar');
      return;
    }

    if (addressToSearch.length < 5) {
      setError('La dirección debe tener al menos 5 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Agregar país si no está incluido
      const fullAddress = addressToSearch.toLowerCase().includes(country.toLowerCase()) 
        ? addressToSearch 
        : `${addressToSearch}, ${country}`;

      const coords = await siteService.geocodeAddress(fullAddress);
      
      // Para este ejemplo, creamos un resultado basado en las coordenadas obtenidas
      // En una implementación real, el servicio podría devolver múltiples resultados
      const result: AddressResult = {
        address: fullAddress,
        coordinates: coords,
        components: {
          street: addressToSearch,
          country: country
        },
        confidence: 0.8
      };

      setResults([result]);
      
      if (results.length === 1) {
        setSelectedResult(result);
      }

    } catch (error: any) {
      setError(error.message || 'No se pudo geocodificar la dirección');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [address, country]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      notifications.show({
        title: 'Error',
        message: 'La geolocalización no está disponible',
        color: 'red'
      });
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // Reverse geocoding - convertir coordenadas a dirección
          // En una implementación real, usarías un servicio de reverse geocoding
          const result: AddressResult = {
            address: `Ubicación actual (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`,
            coordinates: coords,
            components: {
              country: country
            },
            confidence: 1.0
          };

          setResults([result]);
          setSelectedResult(result);
          setAddress(result.address);
          
          if (onCoordinatesSelect) {
            onCoordinatesSelect(coords);
          }

          notifications.show({
            title: 'Éxito',
            message: 'Ubicación actual obtenida',
            color: 'green'
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'No se pudo obtener la dirección de la ubicación actual',
            color: 'red'
          });
        } finally {
          setGettingLocation(false);
        }
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
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSelectResult = (result: AddressResult) => {
    setSelectedResult(result);
    setAddress(result.address);
    onAddressSelect(result);
    
    if (onCoordinatesSelect) {
      onCoordinatesSelect(result.coordinates);
    }

    notifications.show({
      title: 'Dirección seleccionada',
      message: `${result.address}`,
      color: 'green'
    });
  };

  const handleClearResults = () => {
    setResults([]);
    setSelectedResult(null);
    setError('');
    setAddress('');
  };

  const openInGoogleMaps = (coords: Coordinates) => {
    const url = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Stack gap="md">
      {/* Buscador */}
      <Group>
        <TextInput
          placeholder={placeholder}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={disabled}
          style={{ flex: 1 }}
          rightSection={
            loading ? (
              <Loader size="sm" />
            ) : (
              address && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setAddress('')}
                >
                  <IconX size={16} />
                </ActionIcon>
              )
            )
          }
        />
        
        <Button
          variant="light"
          leftSection={<IconSearch size={16} />}
          onClick={() => handleGeocodeAddress()}
          loading={loading}
          disabled={disabled || !address.trim()}
        >
          Buscar
        </Button>
        
        {showCurrentLocation && (
          <Tooltip label="Usar ubicación actual">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={handleCurrentLocation}
              loading={gettingLocation}
              disabled={disabled}
            >
              <IconCurrentLocation size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        
        {results.length > 0 && (
          <Tooltip label="Limpiar resultados">
            <ActionIcon
              variant="light"
              color="gray"
              onClick={handleClearResults}
            >
              <IconClearAll size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Error */}
      {error && (
        <Alert color="red" variant="light" icon={<IconX size={16} />}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {/* Información */}
      {!error && address.length > 0 && address.length < 5 && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
          <Text size="sm">Ingrese al menos 5 caracteres para buscar direcciones</Text>
        </Alert>
      )}

      {/* Resultado seleccionado */}
      {selectedResult && (
        <Paper p="md" withBorder bg="green.0">
          <Group justify="space-between" align="start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group>
                <IconCheck size={16} color="green" />
                <Text fw={500} size="sm">Dirección seleccionada</Text>
                <Badge color="green" variant="light" size="sm">
                  Confianza: {Math.round(selectedResult.confidence * 100)}%
                </Badge>
              </Group>
              
              <Text size="sm">{selectedResult.address}</Text>
              
              <Text size="xs" c="dimmed">
                Coordenadas: {selectedResult.coordinates.lat.toFixed(6)}, {selectedResult.coordinates.lng.toFixed(6)}
              </Text>
            </Stack>
            
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => openInGoogleMaps(selectedResult.coordinates)}
            >
              <IconMapPin size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      )}

      {/* Resultados de búsqueda */}
      {results.length > 0 && !selectedResult && (
        <Paper withBorder>
          <Stack gap={0}>
            <Group p="md" pb="xs" justify="space-between">
              <Text fw={500} size="sm">Resultados encontrados</Text>
              <Badge variant="light">{results.length} resultado{results.length !== 1 ? 's' : ''}</Badge>
            </Group>
            
            <ScrollArea.Autosize mah={300}>
              <Stack gap={0}>
                {results.slice(0, showResultsLimit).map((result, index) => (
                  <Card
                    key={index}
                    p="md"
                    radius={0}
                    withBorder={false}
                    style={{
                      cursor: 'pointer',
                      borderBottom: index < results.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none'
                    }}
                    onClick={() => handleSelectResult(result)}
                  >
                    <Group justify="space-between" align="start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>{result.address}</Text>
                        
                        {result.components.city && (
                          <Text size="xs" c="dimmed">
                            {[
                              result.components.street,
                              result.components.city,
                              result.components.state,
                              result.components.country
                            ].filter(Boolean).join(', ')}
                          </Text>
                        )}
                        
                        <Text size="xs" c="dimmed">
                          {result.coordinates.lat.toFixed(6)}, {result.coordinates.lng.toFixed(6)}
                        </Text>
                      </Stack>
                      
                      <Group gap="xs">
                        <Badge 
                          color={result.confidence > 0.8 ? 'green' : result.confidence > 0.6 ? 'yellow' : 'orange'}
                          variant="light" 
                          size="sm"
                        >
                          {Math.round(result.confidence * 100)}%
                        </Badge>
                        
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGoogleMaps(result.coordinates);
                          }}
                        >
                          <IconMapPin size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Stack>
        </Paper>
      )}

      {/* Información de uso */}
      {!loading && !error && results.length === 0 && address.length === 0 && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
          <Text size="sm">
            Ingrese una dirección completa para obtener las coordenadas GPS exactas. 
            Incluya calle, número, ciudad y opcionalmente provincia para mejores resultados.
          </Text>
        </Alert>
      )}
    </Stack>
  );
}