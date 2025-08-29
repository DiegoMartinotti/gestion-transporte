import React, { forwardRef, useMemo } from 'react';
import { Select, MultiSelect, SelectProps, MultiSelectProps } from '@mantine/core';

// Tipos base para el factory
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: unknown; // Permitir propiedades adicionales para opciones complejas
}

export interface BaseEntity {
  _id: string;
  [key: string]: unknown;
}

export interface SelectorHookResult<T> {
  data: T[];
  loading: boolean;
  error?: string;
  refetch?: () => void;
}

// Configuración para filtros
export interface FilterConfig<T> {
  [key: string]: {
    apply: (items: T[], value: unknown) => T[];
    defaultValue?: unknown;
  };
}

// Configuración principal del selector
export interface SelectorConfig<T extends BaseEntity> {
  // Configuración de datos
  useDataHook: () => SelectorHookResult<T>;
  mapToOption: (item: T) => SelectOption;

  // Filtros opcionales
  filters?: FilterConfig<T>;

  // Configuración del componente
  searchable?: boolean;
  clearable?: boolean;
  groupBy?: (item: T) => string | undefined;

  // Configuración avanzada
  itemComponent?: React.ComponentType<Record<string, unknown>>;
  dropdownComponent?: React.ComponentType<Record<string, unknown>>;
  maxDropdownHeight?: number;

  // Validaciones
  validate?: (value: string | string[] | null) => string | null;

  // Callbacks adicionales
  onItemSelect?: (item: T | T[] | null) => void;
  onSearch?: (query: string) => void;
}

// Props base que extienden las props nativas de Mantine
export interface BaseSelectorProps {
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
  description?: string;
  withAsterisk?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  // Props adicionales para filtros dinámicos
  [key: string]: unknown;
}

// Factory principal
export function createEntitySelector<T extends BaseEntity>(config: SelectorConfig<T>) {
  const EntitySelector = forwardRef<HTMLInputElement, BaseSelectorProps>((props, ref) => {
    const {
      value,
      onChange,
      label,
      placeholder,
      required = false,
      clearable = config.clearable ?? true,
      error,
      disabled = false,
      multiple = false,
      description,
      withAsterisk,
      size = 'sm',
      ...filterProps
    } = props;

    // Cargar datos usando el hook proporcionado
    const { data, loading, error: hookError } = config.useDataHook();

    // Aplicar filtros si están configurados
    const filteredData = useMemo(() => {
      if (!config.filters) return data;

      return Object.entries(config.filters).reduce((filtered, [filterKey, filterConfig]) => {
        const filterValue = filterProps[filterKey];
        if (filterValue !== undefined && filterValue !== filterConfig.defaultValue) {
          return filterConfig.apply(filtered, filterValue);
        }
        return filtered;
      }, data);
    }, [data, filterProps]);

    // Funciones helper para evitar callbacks anidados
    const groupOptionsByCategory = (mapped: SelectOption[], filteredData: T[]) => {
      const grouped = mapped.reduce(
        (groups, option) => {
          const originalItem = filteredData.find((item) => item._id === option.value);
          const group = originalItem && config.groupBy ? config.groupBy(originalItem) : undefined;
          const groupName = group || 'Sin Categoría';

          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(option);

          return groups;
        },
        {} as Record<string, SelectOption[]>
      );

      return Object.entries(grouped).flatMap(([groupName, groupOptions]) =>
        groupOptions.map((option) => ({ ...option, group: groupName }))
      );
    };

    // Mapear datos a opciones
    const options = useMemo(() => {
      const mapped = filteredData.map(config.mapToOption);

      // Agrupar si está configurado
      if (config.groupBy) {
        return groupOptionsByCategory(mapped, filteredData);
      }

      return mapped;
    }, [filteredData]);

    // Manejar cambios
    const handleChange = (newValue: string | string[] | null) => {
      // Validar si está configurado
      if (config.validate) {
        const validationError = config.validate(newValue);
        if (validationError) {
          // El error se manejará a través de la prop error
          return;
        }
      }

      onChange(newValue);

      // Callback adicional si está configurado
      if (config.onItemSelect) {
        if (newValue === null) {
          config.onItemSelect(null);
        } else if (Array.isArray(newValue)) {
          const selectedItems = filteredData.filter((item) => newValue.includes(item._id));
          config.onItemSelect(selectedItems);
        } else {
          const selectedItem = filteredData.find((item) => item._id === newValue);
          config.onItemSelect(selectedItem || null);
        }
      }
    };

    const sharedProps = {
      ref,
      label,
      placeholder,
      data: options,
      value,
      onChange: handleChange,
      required,
      clearable,
      error: error || hookError,
      disabled: disabled || loading,
      description,
      withAsterisk,
      size,
      searchable: config.searchable ?? true,
      maxDropdownHeight: config.maxDropdownHeight ?? 200,
      ...(config.itemComponent && { itemComponent: config.itemComponent }),
      ...(config.dropdownComponent && { dropdownComponent: config.dropdownComponent }),
    };

    // Renderizar componente apropiado
    if (multiple) {
      return <MultiSelect {...(sharedProps as MultiSelectProps)} />;
    } else {
      return <Select {...(sharedProps as SelectProps)} />;
    }
  });

  EntitySelector.displayName = 'EntitySelector';
  return EntitySelector;
}

// Factory para selectores simples (más común)
export function createSimpleSelector<T extends BaseEntity>(
  useDataHook: () => SelectorHookResult<T>,
  mapToOption: (item: T) => SelectOption,
  options: Partial<SelectorConfig<T>> = {}
) {
  return createEntitySelector({
    useDataHook,
    mapToOption,
    searchable: true,
    clearable: true,
    ...options,
  });
}

// Factory para selectores con filtros
export function createFilterableSelector<T extends BaseEntity>(
  useDataHook: () => SelectorHookResult<T>,
  mapToOption: (item: T) => SelectOption,
  filters: FilterConfig<T>,
  options: Partial<SelectorConfig<T>> = {}
) {
  return createEntitySelector({
    useDataHook,
    mapToOption,
    filters,
    searchable: true,
    clearable: true,
    ...options,
  });
}

// Utilidades comunes para mapeo
export const CommonMappers = {
  // Mapeo básico con id y nombre
  nameOnly: <T extends BaseEntity & { nombre: string }>(item: T): SelectOption => ({
    value: item._id,
    label: item.nombre,
  }),

  // Mapeo con nombre y apellido
  fullName: <T extends BaseEntity & { nombre: string; apellido?: string }>(
    item: T
  ): SelectOption => ({
    value: item._id,
    label: item.apellido ? `${item.nombre} ${item.apellido}` : item.nombre,
  }),

  // Mapeo con código y descripción
  codeDescription: <T extends BaseEntity & { codigo?: string; descripcion: string }>(
    item: T
  ): SelectOption => ({
    value: item._id,
    label: item.codigo ? `${item.codigo} - ${item.descripcion}` : item.descripcion,
  }),

  // Mapeo con estado activo/inactivo
  withStatus: <T extends BaseEntity & { nombre: string; activo?: boolean }>(
    item: T
  ): SelectOption => ({
    value: item._id,
    label: item.nombre,
    disabled: item.activo === false,
  }),
};

// Filtros comunes reutilizables
export const CommonFilters = {
  // Filtro por estado activo
  activos: <T extends BaseEntity & { activo?: boolean }>() => ({
    soloActivos: {
      apply: (items: T[], value: boolean) =>
        value ? items.filter((item) => item.activo !== false) : items,
      defaultValue: false,
    },
  }),

  // Filtro por tipo
  tipo: <T extends BaseEntity & { tipo?: string }>() => ({
    tipo: {
      apply: (items: T[], value: string | string[]) => {
        if (!value) return items;
        const tipos = Array.isArray(value) ? value : [value];
        return items.filter((item) => item.tipo && tipos.includes(item.tipo));
      },
    },
  }),

  // Filtro por empresa
  empresa: <T extends BaseEntity & { empresa?: { _id: string } }>() => ({
    empresaId: {
      apply: (items: T[], value: string) =>
        value ? items.filter((item) => item.empresa?._id === value) : items,
    },
  }),

  // Filtro de exclusión por IDs
  exclude: <T extends BaseEntity>() => ({
    excludeIds: {
      apply: (items: T[], value: string[]) =>
        value ? items.filter((item) => !value.includes(item._id)) : items,
      defaultValue: [],
    },
  }),
};

export default createEntitySelector;
