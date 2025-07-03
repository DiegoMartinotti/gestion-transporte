import { createSimpleSelector, CommonMappers } from './SelectorFactory';
import { useClientes } from '../../hooks/useClientes';

// Interfaz del cliente según el hook existente
interface Cliente {
  _id: string;
  nombre: string;
  activo?: boolean;
}

// Adapter para el hook existente
function useClientesAdapter() {
  const { clientes, loading, error } = useClientes();
  return {
    data: clientes,
    loading,
    error: error || undefined
  };
}

// Crear el selector usando el factory
export const ClienteSelector = createSimpleSelector(
  useClientesAdapter,
  CommonMappers.nameOnly<Cliente>,
  {
    searchable: true,
    clearable: true,
    maxDropdownHeight: 250
  }
);

export default ClienteSelector;