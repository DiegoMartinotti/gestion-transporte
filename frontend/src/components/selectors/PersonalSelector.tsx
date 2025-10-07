import { Select } from '@mantine/core';
import { useState } from 'react';

import { PersonalMultiSelect } from './PersonalMultiSelect';
import {
  filterPersonal,
  transformPersonalToSelectData,
  getMockPersonalData,
} from './helpers/personalSelectorHelpers';
import { SelectorValue } from './SelectorFactory';

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
  readonly value?: SelectorValue;
  readonly onChange: (value: SelectorValue) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly clearable?: boolean;
  readonly error?: string;
  readonly multiple?: boolean;
  // Filtros específicos
  readonly tipo?: string | string[]; // Filtrar por tipo específico
  readonly soloChoferes?: boolean; // Filtro específico para choferes (con licencia válida)
  readonly soloActivos?: boolean; // Filtrar solo personal activo
  readonly empresaId?: string; // Filtrar por empresa específica
  readonly excludeIds?: string[];
  // Configuración visual
  readonly disabled?: boolean;
  readonly withAvatar?: boolean;
  readonly showLicencia?: boolean;
  readonly showEmpresa?: boolean;
  readonly showDni?: boolean;
  readonly compact?: boolean;
  // Validaciones adicionales
  readonly requireValidLicense?: boolean; // Requiere licencia válida (no vencida)
  readonly requireSpecificCategory?: string; // Requiere categoría específica de licencia
}

const normalizeToArray = (input: SelectorValue): string[] => {
  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === 'string' && input) {
    return [input];
  }

  return [];
};

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
    const normalizedValue = normalizeToArray(value);

    return (
      <PersonalMultiSelect
        label={label}
        placeholder={placeholder}
        required={required}
        clearable={clearable}
        error={error}
        disabled={disabled || loading}
        data={data}
        value={normalizedValue}
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
