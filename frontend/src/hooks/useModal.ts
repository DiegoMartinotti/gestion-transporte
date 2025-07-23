import { useState, useCallback } from 'react';

export interface ModalConfig<T = any> {
  onOpen?: (item?: T) => void;
  onClose?: () => void;
  onSuccess?: () => void;
  resetOnClose?: boolean;
}

export interface ModalState<T = any> {
  isOpen: boolean;
  selectedItem: T | null;
  loading?: boolean;
}

export interface ModalActions<T = any> {
  openCreate: () => void;
  openEdit: (item: T) => void;
  openView: (item: T) => void;
  openDelete: (item: T) => void;
  open: (item?: T) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
}

export type ModalReturn<T = any> = ModalState<T> & ModalActions<T> & {
  onSuccess: () => void;
};

/**
 * Hook reutilizable para manejar el estado de modales
 * Centraliza la lógica común de apertura/cierre y gestión de elementos seleccionados
 * 
 * @template T - Tipo del elemento que maneja el modal
 * @param config - Configuración opcional del modal
 * @param config.onOpen - Callback ejecutado al abrir el modal
 * @param config.onClose - Callback ejecutado al cerrar el modal  
 * @param config.onSuccess - Callback ejecutado al confirmar éxito (típicamente en formularios)
 * @param config.resetOnClose - Si resetear selectedItem al cerrar (default: true)
 * @returns Estado y acciones del modal
 * 
 * @example
 * ```typescript
 * // Modal básico para crear/editar
 * const formModal = useModal<User>({
 *   onSuccess: () => loadUsers()
 * });
 * 
 * // Múltiples modales especializados
 * const detailModal = useModal<User>();
 * const deleteModal = useModal<User>();
 * 
 * // Uso en JSX
 * <Modal opened={formModal.isOpen} onClose={formModal.close}>
 *   <UserForm 
 *     user={formModal.selectedItem} 
 *     onSubmit={formModal.onSuccess}
 *   />
 * </Modal>
 * 
 * // Acciones
 * <Button onClick={formModal.openCreate}>Nuevo</Button>
 * <Button onClick={() => formModal.openEdit(user)}>Editar</Button>
 * <Button onClick={() => deleteModal.openDelete(user)}>Eliminar</Button>
 * ```
 * 
 * @see {@link useModal.md} Para documentación completa y más ejemplos
 */
export function useModal<T = any>(config?: ModalConfig<T>): ModalReturn<T> {
  const {
    onOpen,
    onClose,
    onSuccess,
    resetOnClose = true
  } = config || {};

  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback((item?: T) => {
    setSelectedItem(item || null);
    setIsOpen(true);
    onOpen?.(item);
  }, [onOpen]);

  const openCreate = useCallback(() => {
    open();
  }, [open]);

  const openEdit = useCallback((item: T) => {
    open(item);
  }, [open]);

  const openView = useCallback((item: T) => {
    open(item);
  }, [open]);

  const openDelete = useCallback((item: T) => {
    open(item);
  }, [open]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (resetOnClose) {
      setSelectedItem(null);
    }
    setLoading(false);
    onClose?.();
  }, [onClose, resetOnClose]);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
    close();
  }, [onSuccess, close]);

  return {
    // Estado
    isOpen,
    selectedItem,
    loading,
    
    // Acciones específicas
    openCreate,
    openEdit,
    openView,
    openDelete,
    
    // Acciones genéricas
    open,
    close,
    setLoading,
    
    // Acción de éxito (para formularios)
    onSuccess: handleSuccess
  };
}

export default useModal;