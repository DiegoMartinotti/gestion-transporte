import React from 'react';
import { Group, NumberInput } from '@mantine/core';

interface Coordinates {
  lat: number;
  lng: number;
}

interface CoordinateInputFieldsProps {
  value: Coordinates;
  onLatChange: (val: number | string) => void;
  onLngChange: (val: number | string) => void;
  precision: number;
  disabled: boolean;
  error?: string;
}

export default function CoordinateInputFields({
  value,
  onLatChange,
  onLngChange,
  precision,
  disabled,
  error,
}: CoordinateInputFieldsProps) {
  return (
    <Group>
      <NumberInput
        label="Latitud"
        placeholder="-34.6037"
        value={value.lat === 0 ? '' : value.lat}
        onChange={onLatChange}
        decimalScale={precision}
        step={0.000001}
        min={-90}
        max={90}
        disabled={disabled}
        error={error && value.lat === 0}
        style={{ flex: 1 }}
      />

      <NumberInput
        label="Longitud"
        placeholder="-58.3816"
        value={value.lng === 0 ? '' : value.lng}
        onChange={onLngChange}
        decimalScale={precision}
        step={0.000001}
        min={-180}
        max={180}
        disabled={disabled}
        error={error && value.lng === 0}
        style={{ flex: 1 }}
      />
    </Group>
  );
}
