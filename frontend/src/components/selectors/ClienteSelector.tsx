import { Select, SelectProps } from '@mantine/core';
import { useState, useEffect } from 'react';
import { Cliente } from '../../types';
import { clienteService } from '../../services/clienteService';

interface ClienteSelectorProps extends Omit<SelectProps, 'data'> {
  onClienteSelect?: (cliente: Cliente | null) => void;
  includeInactive?: boolean;
  clearable?: boolean;
}

export function ClienteSelector({
  onClienteSelect,
  includeInactive = false,
  clearable = true,
  ...props
}: ClienteSelectorProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClientes();
  }, [includeInactive]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await clienteService.getAll({
        activo: includeInactive ? undefined : true,
        limit: 1000 // Obtener todos los clientes
      });
      
      setClientes(response.data);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectData = clientes.map(cliente => ({
    value: cliente._id,
    label: cliente.activo ? cliente.nombre : `${cliente.nombre} (Inactivo)`
  }));

  const handleChange = (value: string | null) => {
    const selectedCliente = value ? clientes.find(c => c._id === value) || null : null;
    onClienteSelect?.(selectedCliente);
    if (props.onChange) {
      props.onChange(value, null as any);
    }
  };

  return (
    <Select
      {...props}
      data={selectData}
      searchable
      clearable={clearable}
      onChange={handleChange}
      placeholder={props.placeholder || "Seleccionar cliente..."}
      nothingFoundMessage="No se encontraron clientes"
      disabled={loading || props.disabled}
    />
  );
}