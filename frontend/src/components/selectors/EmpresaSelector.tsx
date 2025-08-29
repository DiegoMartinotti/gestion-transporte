import { Select, SelectProps } from '@mantine/core';
import { useState, useEffect, useCallback } from 'react';
import { Empresa } from '../../types';
import { empresaService } from '../../services/empresaService';

interface EmpresaSelectorProps extends Omit<SelectProps, 'data'> {
  onEmpresaSelect?: (empresa: Empresa | null) => void;
  includeInactive?: boolean;
  filterByTipo?: 'Propia' | 'Subcontratada';
  clearable?: boolean;
}

export function EmpresaSelector({
  onEmpresaSelect,
  includeInactive = false,
  filterByTipo,
  clearable = true,
  ...props
}: EmpresaSelectorProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await empresaService.getAll({
        activa: includeInactive ? undefined : true,
        tipo: filterByTipo,
        limit: 1000, // Obtener todas las empresas
      });

      setEmpresas(response.data);
    } catch (error) {
      console.error('Error loading empresas:', error);
    } finally {
      setLoading(false);
    }
  }, [includeInactive, filterByTipo]);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  const selectData = empresas.map((empresa) => ({
    value: empresa._id,
    label: empresa.activa
      ? `${empresa.nombre} (${empresa.tipo})`
      : `${empresa.nombre} (${empresa.tipo}) - Inactiva`,
  }));

  const handleChange = (value: string | null) => {
    const selectedEmpresa = value ? empresas.find((e) => e._id === value) || null : null;
    onEmpresaSelect?.(selectedEmpresa);
    if (props.onChange) {
      props.onChange(
        value,
        null as Parameters<NonNullable<SelectProps['onChange']>>[1] & { value: string | null }
      );
    }
  };

  return (
    <Select
      {...props}
      data={selectData}
      searchable
      clearable={clearable}
      onChange={handleChange}
      placeholder={props.placeholder || 'Seleccionar empresa...'}
      nothingFoundMessage="No se encontraron empresas"
      disabled={loading || props.disabled}
    />
  );
}
