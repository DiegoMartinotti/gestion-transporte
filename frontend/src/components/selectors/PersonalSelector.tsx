import { Select } from '@mantine/core';
import { useState } from 'react';

import { PersonalMultiSelect } from './PersonalMultiSelect';
import {
  filterPersonal,
  transformPersonalToSelectData,
  getMockPersonalData,
} from './helpers/personalSelectorHelpers';

interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  tipo: string;
  licenciaNumero?: string;
  dni?: string;
  empresa?: {
    _id: string;
    nombre: string;
  };
  documentacion?: {
    licenciaConducir?: {
      numero?: string;
      categoria?: string;
      vencimiento?: string;
    };
  };
  activo?: boolean;
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
  // Filtros específicos
  tipo?: string | string[]; // Filtrar por tipo específico
  soloChoferes?: boolean; // Filtro específico para choferes (con licencia válida)
  soloActivos?: boolean; // Filtrar solo personal activo
  empresaId?: string; // Filtrar por empresa específica
  excludeIds?: string[];
  // Configuración visual
  disabled?: boolean;
  withAvatar?: boolean;
  showLicencia?: boolean;
  showEmpresa?: boolean;
  showDni?: boolean;
  compact?: boolean;
  // Validaciones adicionales
  requireValidLicense?: boolean; // Requiere licencia válida (no vencida)
  requireSpecificCategory?: string; // Requiere categoría específica de licencia
}

// Los componentes SelectItem y PersonalMultiSelect se han movido a archivos separados

export function PersonalSelector({
  value,
  onChange,
  label,
  placeholder = 'Selecciona personal',
  required = false,
  clearable = false,
  error,
  multiple = false,
  tipo,
  soloChoferes = false,
  soloActivos = true,
  empresaId,
  excludeIds = [],
  disabled = false,
  withAvatar = false,
  showLicencia = false,
  showEmpresa = false,
  showDni = false,
  compact = false,
  requireValidLicense = false,
  requireSpecificCategory,
}: PersonalSelectorProps) {
  const [personal] = useState<Personal[]>(getMockPersonalData());
  const [loading] = useState(false);

  // Aplicar filtros usando helper
  const personalFiltrado = filterPersonal(personal, {
    soloActivos,
    excludeIds,
    empresaId,
    tipo,
    soloChoferes,
    requireValidLicense,
    requireSpecificCategory,
  });

  // Preparar datos para el selector usando helper
  const data = transformPersonalToSelectData(personalFiltrado, {
    showLicencia,
    showEmpresa,
    showDni,
    withAvatar,
    compact,
  });

  if (multiple) {
    return (
      <PersonalMultiSelect
        label={label}
        placeholder={placeholder}
        required={required}
        clearable={clearable}
        error={error}
        disabled={disabled || loading}
        data={data}
        value={Array.isArray(value) ? value : value ? [value] : []}
        onChange={onChange}
      />
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      error={error}
      disabled={disabled || loading}
      searchable={true}
      // itemComponent={PersonalSelectItem} // Comentado temporalmente por compatibilidad
      data={data}
      value={Array.isArray(value) ? value[0] : value}
      onChange={onChange}
    />
  );
}

// Componente específico para choferes (usando PersonalSelector con configuración predefinida)
export function ChoferSelector(
  props: Omit<PersonalSelectorProps, 'soloChoferes' | 'showLicencia' | 'requireValidLicense'> & {
    requireValidLicense?: boolean;
  }
) {
  return (
    <PersonalSelector
      {...props}
      soloChoferes={true}
      showLicencia={true}
      requireValidLicense={props.requireValidLicense}
      label={props.label || 'Seleccionar Chofer'}
      placeholder={props.placeholder || 'Selecciona un chofer'}
    />
  );
}

export default PersonalSelector;
