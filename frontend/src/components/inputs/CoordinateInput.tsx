import React from 'react';
import { Paper, Stack } from '@mantine/core';
import CoordinateHeader from './CoordinateInput/CoordinateHeader';
import CoordinateInputFields from './CoordinateInput/CoordinateInputFields';
import CoordinateActions from './CoordinateInput/CoordinateActions';
import CoordinateAlerts from './CoordinateInput/CoordinateAlerts';
import { useCoordinateInput } from './CoordinateInput/hooks/useCoordinateInput';

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

// Helper functions moved to custom hook

export default function CoordinateInput({
  value = { lat: 0, lng: 0 },
  onChange,
  label = 'Coordenadas GPS',
  description,
  required = false,
  disabled = false,
  showValidation = true,
  showMapLink = true,
  showCopyPaste = true,
  showCurrentLocation = true,
  precision = 6,
  error,
}: CoordinateInputProps) {
  const {
    internalValue,
    isValid,
    isGettingLocation,
    handleLatChange,
    handleLngChange,
    handleGetCurrentLocation,
    handleCopyCoordinates,
    handlePasteCoordinates,
    openInGoogleMaps,
  } = useCoordinateInput({ value, onChange, precision });

  return (
    <Stack gap="xs">
      <CoordinateHeader
        label={label}
        description={description}
        required={required}
        showValidation={showValidation}
        isValid={isValid}
        value={internalValue}
      />

      <Paper p="sm" withBorder radius="sm" bg={error ? 'red.0' : isValid ? 'green.0' : 'gray.0'}>
        <Stack gap="sm">
          <CoordinateInputFields
            value={internalValue}
            onLatChange={handleLatChange}
            onLngChange={handleLngChange}
            precision={precision}
            disabled={disabled}
            error={error}
          />

          <CoordinateActions
            showCurrentLocation={showCurrentLocation}
            showCopyPaste={showCopyPaste}
            showMapLink={showMapLink}
            disabled={disabled}
            isValid={isValid}
            isGettingLocation={isGettingLocation}
            onGetCurrentLocation={handleGetCurrentLocation}
            onCopyCoordinates={handleCopyCoordinates}
            onPasteCoordinates={handlePasteCoordinates}
            onOpenInGoogleMaps={openInGoogleMaps}
          />
        </Stack>
      </Paper>

      <CoordinateAlerts error={error} showCopyPaste={showCopyPaste} />
    </Stack>
  );
}
