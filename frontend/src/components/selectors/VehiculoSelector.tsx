import { Select, MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';

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
}

export function VehiculoSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona vehículos",
  required = false,
  clearable = false,
  error,
  multiple = false
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

  const data = vehiculos.map(vehiculo => ({
    value: vehiculo._id,
    label: `${vehiculo.patente} - ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.capacidadKg}kg)`
  }));

  if (multiple) {
    return (
      <MultiSelect
        label={label}
        placeholder={placeholder}
        data={data}
        value={Array.isArray(value) ? value : value ? [value] : []}
        onChange={onChange}
        required={required}
        clearable={clearable}
        error={error}
        disabled={loading}
        searchable
      />
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={data}
      value={Array.isArray(value) ? value[0] : value}
      onChange={onChange}
      required={required}
      clearable={clearable}
      error={error}
      disabled={loading}
      searchable
    />
  );
}