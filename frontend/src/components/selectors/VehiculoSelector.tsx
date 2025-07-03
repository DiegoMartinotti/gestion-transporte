import { Select, MultiSelect } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';

interface Vehiculo {
  _id: string;
  patente: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidadKg: number;
}

interface VehiculoSelectorProps {
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
  multiple?: boolean;
  disabled?: boolean;
  excludeIds?: string[];
}

export function VehiculoSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona vehículos",
  required = false,
  clearable = false,
  error,
  multiple = false,
  disabled = false,
  excludeIds = []
}: VehiculoSelectorProps) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([
    {
      _id: '1',
      patente: 'ABC123',
      marca: 'Mercedes-Benz',
      modelo: 'Axor',
      tipo: 'Camión',
      capacidadKg: 15000
    },
    {
      _id: '2',
      patente: 'DEF456',
      marca: 'Volvo',
      modelo: 'FH',
      tipo: 'Camión',
      capacidadKg: 18000
    },
    {
      _id: '3',
      patente: 'GHI789',
      marca: 'Scania',
      modelo: 'R450',
      tipo: 'Camión',
      capacidadKg: 20000
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Memoize the data transformation to avoid recreating the array on every render
  const data = useMemo(() => 
    vehiculos
      .filter(vehiculo => !excludeIds.includes(vehiculo._id)) // Filter out excluded vehicles
      .map(vehiculo => ({
        value: vehiculo._id,
        label: `${vehiculo.patente} - ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.capacidadKg}kg)`
      })),
    [vehiculos, excludeIds] // Recalculate when vehiculos or excludeIds change
  );

  // Memoize value normalization for multiple select
  const normalizedValue = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return Array.isArray(value) ? value[0] : value;
  }, [value, multiple]);

  if (multiple) {
    return (
      <MultiSelect
        label={label}
        placeholder={placeholder}
        data={data}
        value={normalizedValue as string[]}
        onChange={onChange}
        required={required}
        clearable={clearable}
        error={error}
        disabled={loading || disabled}
        searchable
      />
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={data}
      value={normalizedValue as string | null}
      onChange={onChange}
      required={required}
      clearable={clearable}
      error={error}
      disabled={loading || disabled}
      searchable
    />
  );
}