import { createFilterableSelector, CommonFilters, type FilterConfig } from './SelectorFactory';
import React from 'react';

// Interfaz del personal (simplificada para el ejemplo)
interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  tipo: string;
  activo?: boolean;
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
  [key: string]: unknown;
}

// Hook simulado - en la práctica usarías el hook real
function usePersonal() {
  // Este sería reemplazado por el hook real
  return {
    data: [] as Personal[],
    loading: false,
    error: undefined,
  };
}

// Mapper personalizado para personal
const personalMapper = (item: Personal) => ({
  value: item._id,
  label: `${item.nombre} ${item.apellido}`,
  // Propiedades adicionales para uso en componentes personalizados
  tipo: item.tipo,
  licencia: item.documentacion?.licenciaConducir?.numero,
  empresa: item.empresa?.nombre,
});

// Filtros específicos para personal
const personalFilters: FilterConfig<Personal> = {
  // Heredar filtros comunes
  ...CommonFilters.activos<Personal>(),
  ...CommonFilters.tipo<Personal>(),
  ...CommonFilters.empresa<Personal>(),
  ...CommonFilters.exclude<Personal>(),

  // Filtros específicos de personal
  soloChoferes: {
    apply: (items: Personal[], value: unknown) => {
      if (typeof value !== 'boolean' || !value) return items;
      return items.filter(
        (item) => item.tipo === 'chofer' || item.documentacion?.licenciaConducir?.numero
      );
    },
    defaultValue: false,
  },

  requireValidLicense: {
    apply: (items: Personal[], value: unknown) => {
      if (typeof value !== 'boolean' || !value) return items;
      return items.filter((item) => {
        const licencia = item.documentacion?.licenciaConducir;
        if (!licencia?.numero) return false;

        // Verificar que no esté vencida
        if (licencia.vencimiento) {
          const vencimiento = new Date(licencia.vencimiento);
          const hoy = new Date();
          return vencimiento > hoy;
        }

        return true;
      });
    },
    defaultValue: false,
  },

  requireSpecificCategory: {
    apply: (items: Personal[], value: unknown) => {
      if (typeof value !== 'string' || !value) return items;
      return items.filter((item) => item.documentacion?.licenciaConducir?.categoria === value);
    },
  },
};

// Validación personalizada
const validatePersonal = (value: string | string[] | null) => {
  if (!value) return null;

  // Validaciones adicionales pueden ir aquí
  return null;
};

// Crear el selector con filtros
export const PersonalSelector = createFilterableSelector(
  usePersonal,
  personalMapper,
  personalFilters,
  {
    searchable: true,
    clearable: true,
    maxDropdownHeight: 300,
    validate: validatePersonal,
    groupBy: (item: Personal) => item.empresa?.nombre, // Agrupar por empresa
    onItemSelect: (item) => {
      // Callback personalizado si es necesario
      console.log('Personal seleccionado:', item);
    },
  }
);

// Selector preconfigurado para choferes
export const ChoferSelector = createFilterableSelector(
  usePersonal,
  personalMapper,
  personalFilters,
  {
    searchable: true,
    clearable: true,
    maxDropdownHeight: 300,
    // Props por defecto para choferes
  }
);

// HOC para aplicar filtros por defecto a ChoferSelector
interface ChoferSelectorPresetProps {
  placeholder?: string;
  [key: string]: unknown;
}

export const ChoferSelectorPreset: React.FC<ChoferSelectorPresetProps> = (props) => {
  return (
    <ChoferSelector
      {...props}
      soloChoferes={true}
      requireValidLicense={true}
      placeholder={props.placeholder || 'Selecciona un chofer'}
    />
  );
};

export default PersonalSelector;
