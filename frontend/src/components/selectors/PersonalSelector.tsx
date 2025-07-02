import { Select, MultiSelect } from '@mantine/core';
import { useState, useEffect } from 'react';

interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  tipo: string;
  licenciaNumero?: string;
}

interface PersonalSelectorProps {
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
  multiple?: boolean;
  tipo?: string;
}

export function PersonalSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona personal",
  required = false,
  clearable = false,
  error,
  multiple = false,
  tipo
}: PersonalSelectorProps) {
  const [personal, setPersonal] = useState<Personal[]>([
    {
      _id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      tipo: 'Conductor',
      licenciaNumero: 'B123456789'
    },
    {
      _id: '2',
      nombre: 'Carlos',
      apellido: 'González',
      tipo: 'Conductor',
      licenciaNumero: 'B987654321'
    },
    {
      _id: '3',
      nombre: 'Roberto',
      apellido: 'Martínez',
      tipo: 'Conductor',
      licenciaNumero: 'B456789123'
    },
    {
      _id: '4',
      nombre: 'Miguel',
      apellido: 'López',
      tipo: 'Ayudante'
    },
    {
      _id: '5',
      nombre: 'Luis',
      apellido: 'Fernández',
      tipo: 'Ayudante'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const personalFiltrado = tipo ? personal.filter(p => p.tipo === tipo) : personal;

  const data = personalFiltrado.map(persona => ({
    value: persona._id,
    label: `${persona.nombre} ${persona.apellido}${persona.licenciaNumero ? ` (Lic: ${persona.licenciaNumero})` : ''}`
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