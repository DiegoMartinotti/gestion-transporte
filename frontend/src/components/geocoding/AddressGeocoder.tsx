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
  Badge
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

// Helpers para geocoding
const createAddressResult = (addressToSearch: string, coords: Coordinates, country: string): AddressResult => ({
  address: addressToSearch.toLowerCase().includes(country.toLowerCase()) ? addressToSearch : `${addressToSearch}, ${country}`,
  coordinates: coords,
  components: { street: addressToSearch, country },
  confidence: 0.8
});

const createLocationResult = (coords: Coordinates, country: string): AddressResult => ({
  address: `Ubicación actual (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`,
  coordinates: coords,
  components: { country },
  confidence: 1.0
});

const getGeolocationErrorMessage = (errorCode: number) => {
  const messages = {
    1: 'Permiso de ubicación denegado',
    2: 'Ubicación no disponible', 
    3: 'Tiempo de espera agotado'
  };
  return messages[errorCode] || 'No se pudo obtener la ubicación actual';
};

// Hook para validación de direcciones
const useAddressValidation = (setError: (error: string) => void) => {
  return useCallback((addressToValidate: string) => {
    if (!addressToValidate.trim()) {
      setError('Ingrese una dirección para buscar');
      return false;
    }
    if (addressToValidate.length < 5) {
      setError('La dirección debe tener al menos 5 caracteres');
      return false;
    }
    return true;
  }, [setError]);
};

// Hook personalizado para la lógica de geocoding
const useAddressGeocoding = (props: AddressGeocoderProps) => {
  const { initialAddress = '', autoSearch = true, disabled = false, country = 'Argentina', onAddressSelect, onCoordinatesSelect } = props;
  
  const [address, setAddress] = useState(initialAddress);
  const [debouncedAddress] = useDebouncedValue(address, 500);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AddressResult | null>(null);
  const [error, setError] = useState<string>('');

  const validateAddress = useAddressValidation(setError);

  const handleGeocodeAddress = useCallback(async (searchAddress?: string) => {
    const addressToSearch = searchAddress || address;
    
    if (!validateAddress(addressToSearch)) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const fullAddress = addressToSearch.toLowerCase().includes(country.toLowerCase()) 
        ? addressToSearch 
        : `${addressToSearch}, ${country}`;

      const coords = await siteService.geocodeAddress(fullAddress);
      const result = createAddressResult(addressToSearch, coords, country);
      result.address = fullAddress;

      setResults([result]);
      if (results.length === 1) {
        setSelectedResult(result);
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'No se pudo geocodificar la dirección');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [address, country, results.length, validateAddress]);

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      notifications.show({ title: 'Error', message: 'La geolocalización no está disponible', color: 'red' });
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        const result = createLocationResult(coords, country);

        setResults([result]);
        setSelectedResult(result);
        setAddress(result.address);
        
        if (onCoordinatesSelect) {
          onCoordinatesSelect(coords);
        }

        notifications.show({ title: 'Éxito', message: 'Ubicación actual obtenida', color: 'green' });
        setGettingLocation(false);
      },
      (error) => {
        notifications.show({
          title: 'Error',
          message: getGeolocationErrorMessage(error.code),
          color: 'red'
        });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [country, onCoordinatesSelect]);

  const handleSelectResult = useCallback((result: AddressResult) => {
    setSelectedResult(result);
    setAddress(result.address);
    onAddressSelect(result);
    
    if (onCoordinatesSelect) {
      onCoordinatesSelect(result.coordinates);
    }

    notifications.show({ title: 'Dirección seleccionada', message: result.address, color: 'green' });
  }, [onAddressSelect, onCoordinatesSelect]);

  const handleClearResults = useCallback(() => {
    setResults([]);
    setSelectedResult(null);
    setError('');
    setAddress('');
  }, []);

  const openInGoogleMaps = useCallback((coords: Coordinates) => {
    window.open(`https://maps.google.com/?q=${coords.lat},${coords.lng}`, '_blank');
  }, []);

  // Auto-búsqueda cuando cambia la dirección
  useEffect(() => {
    if (autoSearch && debouncedAddress.length > 5 && !disabled) {
      handleGeocodeAddress(debouncedAddress);
    }
  }, [debouncedAddress, autoSearch, disabled, handleGeocodeAddress]);

  return {
    address, setAddress, results, loading, gettingLocation, selectedResult, error,
    handleGeocodeAddress, handleCurrentLocation, handleSelectResult, handleClearResults, openInGoogleMaps
  };
};

const SearchInput = ({ 
  address, 
  setAddress, 
  loading, 
  disabled, 
  placeholder
}: {
  address: string;
  setAddress: (value: string) => void;
  loading: boolean;
  disabled: boolean;
  placeholder: string;
}) => (
  <TextInput
    placeholder={placeholder}
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    disabled={disabled}
    style={{ flex: 1 }}
    rightSection={loading ? <Loader size="sm" /> : (
      address ? (
        <ActionIcon variant="subtle" color="gray" onClick={() => setAddress('')}>
          <IconX size={16} />
        </ActionIcon>
      ) : null
    )}
  />
);

const SelectedResult = ({ result, onOpenInMaps }: {
  result: AddressResult;
  onOpenInMaps: (coords: Coordinates) => void;
}) => (
  <Paper p="md" withBorder bg="green.0">
    <Group justify="space-between" align="start">
      <Stack gap="xs" style={{ flex: 1 }}>
        <Group>
          <IconCheck size={16} color="green" />
          <Text fw={500} size="sm">Dirección seleccionada</Text>
          <Badge color="green" variant="light" size="sm">
            Confianza: {Math.round(result.confidence * 100)}%
          </Badge>
        </Group>
        
        <Text size="sm">{result.address}</Text>
        
        <Text size="xs" c="dimmed">
          Coordenadas: {result.coordinates.lat.toFixed(6)}, {result.coordinates.lng.toFixed(6)}
        </Text>
      </Stack>
      
      <ActionIcon variant="light" color="blue" onClick={() => onOpenInMaps(result.coordinates)}>
        <IconMapPin size={16} />
      </ActionIcon>
    </Group>
  </Paper>
);

const AddressGeocoderControls = ({ 
  address, setAddress, loading, disabled, placeholder, gettingLocation,
  showCurrentLocation, results, handleGeocodeAddress, handleCurrentLocation, handleClearResults 
}: {
  address: string;
  setAddress: (value: string) => void;
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  gettingLocation: boolean;
  showCurrentLocation: boolean;
  results: AddressResult[];
  handleGeocodeAddress: () => void;
  handleCurrentLocation: () => void;
  handleClearResults: () => void;
}) => (
  <Group>
    <SearchInput
      address={address}
      setAddress={setAddress}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
    />
    
    <Button
      variant="light"
      leftSection={<IconSearch size={16} />}
      onClick={handleGeocodeAddress}
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
        <ActionIcon variant="light" color="gray" onClick={handleClearResults}>
          <IconClearAll size={16} />
        </ActionIcon>
      </Tooltip>
    )}
  </Group>
);

export default function AddressGeocoder(props: AddressGeocoderProps) {
  const {
    placeholder = "Ingrese una dirección para geocodificar",
    showCurrentLocation = true,
    disabled = false
  } = props;

  const {
    address, setAddress, results, loading, gettingLocation, selectedResult, error,
    handleGeocodeAddress, handleCurrentLocation, handleClearResults, openInGoogleMaps
  } = useAddressGeocoding(props);

  const showWarning = address.length > 0 && address.length < 5;
  const showHelp = !loading && results.length === 0 && address.length === 0;

  return (
    <Stack gap="md">
      <AddressGeocoderControls
        address={address}
        setAddress={setAddress}
        loading={loading}
        disabled={disabled}
        placeholder={placeholder}
        gettingLocation={gettingLocation}
        showCurrentLocation={showCurrentLocation}
        results={results}
        handleGeocodeAddress={() => handleGeocodeAddress()}
        handleCurrentLocation={handleCurrentLocation}
        handleClearResults={handleClearResults}
      />

      {error && (
        <Alert color="red" variant="light" icon={<IconX size={16} />}>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      {showWarning && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
          <Text size="sm">Ingrese al menos 5 caracteres para buscar direcciones</Text>
        </Alert>
      )}

      {selectedResult && (
        <SelectedResult result={selectedResult} onOpenInMaps={openInGoogleMaps} />
      )}

      {showHelp && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
          <Text size="sm">
            Ingrese una dirección completa para obtener las coordenadas GPS exactas.
          </Text>
        </Alert>
      )}
    </Stack>
  );
}