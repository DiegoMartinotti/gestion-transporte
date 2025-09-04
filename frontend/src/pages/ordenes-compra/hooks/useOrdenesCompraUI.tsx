import type { Cliente } from '../../../types/cliente';
import { useOrdenesCompraActions } from './useOrdenesCompraActions';
import { useOrdenesCompraColumns } from './useOrdenesCompraColumns';

interface UseOrdenesCompraUIProps {
  clientes: Cliente[];
  refreshOrders: () => void;
}

export const useOrdenesCompraUI = ({ clientes, refreshOrders }: UseOrdenesCompraUIProps) => {
  const { handleDelete } = useOrdenesCompraActions(refreshOrders);
  const columns = useOrdenesCompraColumns({ clientes, onDelete: handleDelete });

  return {
    columns,
    handleDelete,
  };
};
