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

// Helper functions
function getDefaultProps(props: Partial<CoordinateInputProps>) {
  return {
    value: props.value || { lat: 0, lng: 0 },
    label: props.label || 'Coordenadas GPS',
    required: props.required || false,
    disabled: props.disabled || false,
    showValidation: props.showValidation !== undefined ? props.showValidation : true,
    showMapLink: props.showMapLink !== undefined ? props.showMapLink : true,
    showCopyPaste: props.showCopyPaste !== undefined ? props.showCopyPaste : true,
    showCurrentLocation: props.showCurrentLocation !== undefined ? props.showCurrentLocation : true,
    precision: props.precision || 6,
  };
}

function getPaperBackgroundColor(error: string | undefined, isValid: boolean) {
  if (error) return 'red.0';
  if (isValid) return 'green.0';
  return 'gray.0';
}

export default function CoordinateInput(props: CoordinateInputProps) {
  const { onChange, description, error } = props;

  const {
    value,
    label,
    required,
    disabled,
    showValidation,
    showMapLink,
    showCopyPaste,
    showCurrentLocation,
    precision,
  } = getDefaultProps(props);
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

      <Paper p="sm" withBorder radius="sm" bg={getPaperBackgroundColor(error, isValid)}>
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
