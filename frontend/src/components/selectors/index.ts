// Imports
import {
  createSimpleSelector,
  CommonMappers,
  CommonFilters,
  createFilterableSelector,
} from './SelectorFactory';

// Factory Pattern para Selectores
export {
  createEntitySelector,
  createSimpleSelector,
  createFilterableSelector,
  CommonMappers,
  CommonFilters,
  type SelectorConfig,
  type BaseSelectorProps,
  type SelectOption,
  type BaseEntity,
  type SelectorHookResult,
  type FilterConfig,
} from './SelectorFactory';

// Selectores refactorizados usando el factory
export { default as ClienteSelectorNew } from './ClienteSelectorNew';
export { default as PersonalSelectorNew, ChoferSelectorPreset } from './PersonalSelectorNew';

// Selectores originales (mantener compatibilidad durante migración)
export { ClienteSelector } from './ClienteSelector';
export { PersonalSelector, ChoferSelector } from './PersonalSelector';

// Utility para crear selectores rápidamente

export function createQuickSelector<T extends { _id: string; nombre: string }>(
  useHook: () => { data: T[]; loading: boolean; error?: string },
  _placeholder = 'Selecciona una opción'
) {
  return createSimpleSelector(useHook, CommonMappers.nameOnly, {
    searchable: true,
    clearable: true,
  });
}

// Presets comunes para tipos específicos
export const SelectorPresets = {
  // Para entidades simples con nombre
  simple: <T extends { _id: string; nombre: string }>(
    useHook: () => { data: T[]; loading: boolean; error?: string }
  ) => createSimpleSelector(useHook, CommonMappers.nameOnly),

  // Para entidades con estado activo/inactivo
  withStatus: <T extends { _id: string; nombre: string; activo?: boolean }>(
    useHook: () => { data: T[]; loading: boolean; error?: string }
  ) => createFilterableSelector(useHook, CommonMappers.withStatus, CommonFilters.activos<T>()),

  // Para entidades con personas (nombre + apellido)
  person: <T extends { _id: string; nombre: string; apellido?: string }>(
    useHook: () => { data: T[]; loading: boolean; error?: string }
  ) => createSimpleSelector(useHook, CommonMappers.fullName),

  // Para entidades con código y descripción
  codeDescription: <T extends { _id: string; codigo?: string; descripcion: string }>(
    useHook: () => { data: T[]; loading: boolean; error?: string }
  ) => createSimpleSelector(useHook, CommonMappers.codeDescription),
} as const;

// Ejemplos de uso rápido:
/*
// Crear un selector simple:
const MiSelector = SelectorPresets.simple(useMiHook);

// Crear un selector con filtros:
const MiSelectorConFiltros = createFilterableSelector(
  useMiHook,
  CommonMappers.nameOnly,
  {
    ...CommonFilters.activos(),
    ...CommonFilters.tipo()
  }
);

// Usar en componente:
<MiSelector 
  value={valor} 
  onChange={setValor}
  label="Mi Selector"
  soloActivos={true}
/>
*/
