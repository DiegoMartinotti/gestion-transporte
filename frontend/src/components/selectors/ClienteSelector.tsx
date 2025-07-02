import { Select } from '@mantine/core';
import { useClientes } from '../../hooks/useClientes';

interface ClienteSelectorProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
}

export function ClienteSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona un cliente",
  required = false,
  clearable = false,
  error
}: ClienteSelectorProps) {
  const { clientes, loading } = useClientes();

  const data = clientes.map(cliente => ({
    value: cliente._id,
    label: cliente.nombre
  }));

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={data}
      value={value}
      onChange={onChange}
      required={required}
      clearable={clearable}
      error={error}
      searchable
      disabled={loading}
    />
  );
}