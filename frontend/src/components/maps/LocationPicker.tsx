import React, { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Group,
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
  IconSearch,
  IconCurrentLocation,
  IconCheck,
  IconX,
  IconCrosshair
} from '@tabler/icons-react';
import MapView, { type MapMarker } from './MapView';
import {
  searchAddressWithGeocoding,
  getCurrentUserLocation,
  handleMapClick,
  applyManualCoordinates,
  clearLocation,
  DEFAULT_CENTER
} from './LocationPickerHelpers';

// Componente para mostrar la información de ubicación seleccionada
interface LocationBadgeProps {
  selectedLocation: { lat: number; lng: number } | null;
}

const LocationBadge: React.FC<LocationBadgeProps> = ({ selectedLocation }) => {
  if (!selectedLocation) return null;
  
  return (
    <Badge color="green" variant="light" size="sm">
      Ubicación seleccionada
    </Badge>
  );
};

// Componente para los controles de búsqueda
interface SearchControlsProps {
  showSearch: boolean;
  showCurrentLocation: boolean;
  selectedLocation: { lat: number; lng: number } | null;
  searchAddress: string;
  searchLoading: boolean;
  searchPlaceholder: string;
  disabled: boolean;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onCurrentLocation: () => void;
  onClear: () => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  showSearch,
  showCurrentLocation,
  selectedLocation,
  searchAddress,
  searchLoading,
  searchPlaceholder,
  disabled,
  onSearchChange,
  onSearch,
  onCurrentLocation,
  onClear
}) => {
  if (!(showSearch || showCurrentLocation || selectedLocation)) return null;

  return (
    <Group>
      {showSearch && (
        <TextInput
          placeholder={searchPlaceholder}
          value={searchAddress}
          onChange={(e) => onSearchChange(e.target.value)}
          rightSection={
            <ActionIcon
              onClick={onSearch}
              loading={searchLoading}
              disabled={!searchAddress.trim() || disabled}
            >
              <IconSearch size={16} />
            </ActionIcon>
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !searchLoading) {
              onSearch();
            }
          }}
          disabled={disabled}
          style={{ flex: 1 }}
        />
      )}

      {showCurrentLocation && (
        <Tooltip label="Usar mi ubicación">
          <ActionIcon
            onClick={onCurrentLocation}
            disabled={disabled}
            variant="light"
          >
            <IconCurrentLocation size={16} />
          </ActionIcon>
        </Tooltip>
      )}

      {selectedLocation && (
        <Tooltip label="Borrar ubicación">
          <ActionIcon
            onClick={onClear}
            disabled={disabled}
            color="red"
            variant="light"
          >
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};

// Componente para mostrar/editar coordenadas
interface CoordinatesDisplayProps {
  showCoordinates: boolean;
  selectedLocation: { lat: number; lng: number } | null;
  manualMode: boolean;
  manualLat: number;
  manualLng: number;
  disabled: boolean;
  onManualModeToggle: (enabled: boolean) => void;
  onManualLatChange: (value: number) => void;
  onManualLngChange: (value: number) => void;
  onManualApply: () => void;
}

const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({
  showCoordinates,
  selectedLocation,
  manualMode,
  manualLat,
  manualLng,
  disabled,
  onManualModeToggle,
  onManualLatChange,
  onManualLngChange,
  onManualApply
}) => {
  if (!showCoordinates) return null;

  return (
    <Paper p="sm" withBorder bg="gray.0">
      {!manualMode ? (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {selectedLocation
              ? `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`
              : 'Sin ubicación seleccionada'
            }
          </Text>
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => onManualModeToggle(true)}
            disabled={disabled}
          >
            <IconCrosshair size={14} />
          </ActionIcon>
        </Group>
      ) : (
        <Group>
          <NumberInput
            placeholder="Latitud"
            value={manualLat || ''}
            onChange={(val) => onManualLatChange(typeof val === 'number' ? val : 0)}
            decimalScale={6}
            step={0.000001}
            style={{ flex: 1 }}
            size="xs"
            disabled={disabled}
          />
          <NumberInput
            placeholder="Longitud"
            value={manualLng || ''}
            onChange={(val) => onManualLngChange(typeof val === 'number' ? val : 0)}
            decimalScale={6}
            step={0.000001}
            style={{ flex: 1 }}
            size="xs"
            disabled={disabled}
          />
          <ActionIcon
            size="sm"
            color="green"
            onClick={onManualApply}
            disabled={disabled}
          >
            <IconCheck size={14} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            onClick={() => onManualModeToggle(false)}
            disabled={disabled}
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>
      )}
    </Paper>
  );
};

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


// Hook personalizado para manejar la lógica del LocationPicker
const useLocationPicker = (props: LocationPickerProps) => {
  const { value, onChange, onAddressChange } = props;
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(value || null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(() => value || DEFAULT_CENTER);
  const [manualLat, setManualLat] = useState<number>(value?.lat || 0);
  const [manualLng, setManualLng] = useState<number>(value?.lng || 0);
  const [manualMode, setManualMode] = useState(false);

  const updateLocation = useCallback((position: { lat: number; lng: number } | null) => {
    setSelectedLocation(position);
    if (position) {
      setMapCenter(position);
      setManualLat(position.lat);
      setManualLng(position.lng);
    }
    onChange(position);
  }, [onChange]);

  const handleSearch = useCallback(async () => {
    if (!searchAddress.trim() || searchLoading) return;
    setSearchLoading(true);
    const result = await searchAddressWithGeocoding(searchAddress, updateLocation, onAddressChange);
    setSearchLoading(false);
    if (result) setMapCenter(result);
  }, [searchAddress, searchLoading, updateLocation, onAddressChange]);

  const handleCurrentLocation = useCallback(() => {
    getCurrentUserLocation(updateLocation);
  }, [updateLocation]);

  const handleMapClickAction = useCallback((position: { lat: number; lng: number }) => {
    const result = handleMapClick(position, props.disabled, onChange);
    if (result) updateLocation(result);
  }, [props.disabled, onChange, updateLocation]);

  const handleManualApply = useCallback(() => {
    const result = applyManualCoordinates(manualLat, manualLng, onChange);
    if (result) {
      updateLocation(result);
      setManualMode(false);
    }
  }, [manualLat, manualLng, onChange, updateLocation]);

  const handleClear = useCallback(() => {
    clearLocation(onChange);
    setSelectedLocation(null);
    setManualMode(false);
    setManualLat(0);
    setManualLng(0);
  }, [onChange]);

  // Sincronizar con valor externo
  useEffect(() => {
    if (value && (value.lat !== selectedLocation?.lat || value.lng !== selectedLocation?.lng)) {
      updateLocation(value);
    }
  }, [value, selectedLocation, updateLocation]);

  return {
    selectedLocation,
    searchAddress,
    setSearchAddress,
    searchLoading,
    mapCenter,
    manualLat,
    setManualLat,
    manualLng,
    setManualLng,
    manualMode,
    setManualMode,
    handleSearch,
    handleCurrentLocation,
    handleMapClickAction,
    handleManualApply,
    handleClear
  };
};

export default function LocationPicker(props: LocationPickerProps) {
  const {
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
  } = props;

  const {
    selectedLocation,
    searchAddress,
    setSearchAddress,
    searchLoading,
    mapCenter,
    manualLat,
    setManualLat,
    manualLng,
    setManualLng,
    manualMode,
    setManualMode,
    handleSearch,
    handleCurrentLocation,
    handleMapClickAction,
    handleManualApply,
    handleClear
  } = useLocationPicker(props);

  const markers: MapMarker[] = selectedLocation 
    ? [{ id: 'selected', position: selectedLocation, title: 'Ubicación seleccionada', draggable: !disabled }] 
    : [];

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <Text size="sm" fw={500}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Text>
        <LocationBadge selectedLocation={selectedLocation} />
      </Group>

      <SearchControls
        showSearch={showSearch}
        showCurrentLocation={showCurrentLocation}
        selectedLocation={selectedLocation}
        searchAddress={searchAddress}
        searchLoading={searchLoading}
        searchPlaceholder={searchPlaceholder}
        disabled={disabled}
        onSearchChange={setSearchAddress}
        onSearch={handleSearch}
        onCurrentLocation={handleCurrentLocation}
        onClear={handleClear}
      />

      <CoordinatesDisplay
        showCoordinates={showCoordinates}
        selectedLocation={selectedLocation}
        manualMode={manualMode}
        manualLat={manualLat}
        manualLng={manualLng}
        disabled={disabled}
        onManualModeToggle={setManualMode}
        onManualLatChange={setManualLat}
        onManualLngChange={setManualLng}
        onManualApply={handleManualApply}
      />

      {error && <Alert color="red" size="sm">{error}</Alert>}

      <Paper withBorder>
        <MapView
          height={height}
          center={mapCenter}
          zoom={initialZoom}
          markers={markers}
          onMapClick={handleMapClickAction}
          onMarkerDragEnd={(markerId, position) => {
            if (markerId === 'selected') {
              props.onChange(position);
            }
          }}
          disabled={disabled}
        />
      </Paper>

      {!selectedLocation && !disabled && (
        <Text size="xs" c="dimmed" ta="center">{placeholder}</Text>
      )}
    </Stack>
  );
}