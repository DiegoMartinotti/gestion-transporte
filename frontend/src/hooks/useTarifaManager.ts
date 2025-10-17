import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useModal, type ModalReturn } from './useModal';
import { useDataLoader } from './useDataLoader';

interface MetodoTarifa {
  id: string;
  nombre: string;
  descripcion: string;
  formula: string;
  variables: Variable[];
  activo: boolean;
}

interface Variable {
  nombre: string;
  descripcion: string;
  tipo: string;
  origen: string;
  valorDefault: number;
}

interface VariableFormData {
  nombre: string;
  descripcion: string;
  tipo: string;
  origen: string;
  valorDefault: number;
}

const buildPagination = (totalItems: number) => ({
  currentPage: 1,
  totalPages: 1,
  totalItems,
  itemsPerPage: Math.max(totalItems, 1),
});

let mockData: MetodoTarifa[] = [];
let idCounter = 0;

const generateId = () => `metodo-${Date.now()}-${idCounter++}`;

const mockService = {
  getAll: async () => ({
    data: [...mockData],
    pagination: buildPagination(mockData.length),
  }),
  create: async (data: Partial<MetodoTarifa>) => {
    const newMetodo: MetodoTarifa = {
      id: generateId(),
      nombre: data.nombre ?? 'Método sin nombre',
      descripcion: data.descripcion ?? '',
      formula: data.formula ?? '',
      variables: data.variables ?? [],
      activo: data.activo ?? true,
    };
    mockData = [...mockData, newMetodo];
    return newMetodo;
  },
  update: async (id: string, data: Partial<MetodoTarifa>) => {
    const index = mockData.findIndex((metodo) => metodo.id === id);
    if (index === -1) {
      throw new Error('Método de tarifa no encontrado');
    }
    const updated = { ...mockData[index], ...data };
    mockData = [...mockData.slice(0, index), updated, ...mockData.slice(index + 1)];
    return updated;
  },
  delete: async (id: string) => {
    mockData = mockData.filter((metodo) => metodo.id !== id);
  },
  testFormula: async (formula: string, valores: Record<string, number>) => {
    console.log('Testing formula:', formula, 'with values:', valores);
    return { resultado: 42, errores: [] };
  },
};

const useTarifaOperations = (
  refresh: () => void,
  editModal: ModalReturn<MetodoTarifa>,
  deleteModal: ModalReturn<MetodoTarifa>
) => {
  const handleCreate = async (data: Partial<MetodoTarifa>) => {
    try {
      await mockService.create(data);
      notifications.show({
        title: 'Éxito',
        message: 'Método de tarifa creado correctamente',
        color: 'green',
      });
      refresh();
    } catch (error) {
      console.error('Error al crear el método de tarifa', error);
      notifications.show({
        title: 'Error',
        message: 'Error al crear el método de tarifa',
        color: 'red',
      });
    }
  };

  const handleUpdate = async (id: string, data: Partial<MetodoTarifa>) => {
    try {
      await mockService.update(id, data);
      notifications.show({
        title: 'Éxito',
        message: 'Método de tarifa actualizado correctamente',
        color: 'green',
      });
      refresh();
      editModal.close();
    } catch (error) {
      console.error('Error al actualizar el método de tarifa', error);
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar el método de tarifa',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mockService.delete(id);
      notifications.show({
        title: 'Éxito',
        message: 'Método de tarifa eliminado correctamente',
        color: 'green',
      });
      refresh();
      deleteModal.close();
    } catch (error) {
      console.error('Error al eliminar el método de tarifa', error);
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar el método de tarifa',
        color: 'red',
      });
    }
  };

  const handleTestFormula = async (formula: string, valores: Record<string, number>) => {
    try {
      const resultado = await mockService.testFormula(formula, valores);
      notifications.show({
        title: 'Resultado de la prueba',
        message: `Resultado: ${resultado.resultado}`,
        color: resultado.errores.length > 0 ? 'orange' : 'green',
      });
      return resultado;
    } catch (error) {
      console.error('Error al probar la fórmula de tarifa', error);
      notifications.show({
        title: 'Error',
        message: 'Error al probar la fórmula',
        color: 'red',
      });
    }
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleTestFormula,
  };
};
const useVariableOperations = (
  selectedMetodo: MetodoTarifa | null,
  setSelectedMetodo: (metodo: MetodoTarifa | null) => void
) => {
  const addVariable = (newVariable: VariableFormData) => {
    if (!newVariable.nombre || !newVariable.descripcion) {
      notifications.show({
        title: 'Error',
        message: 'Nombre y descripción son requeridos',
        color: 'red',
      });
      return;
    }

    if (selectedMetodo) {
      const updatedMetodo = {
        ...selectedMetodo,
        variables: [...(selectedMetodo.variables || []), { ...newVariable }],
      };
      setSelectedMetodo(updatedMetodo);
    }
  };

  const removeVariable = (index: number) => {
    if (selectedMetodo) {
      const updatedMetodo = {
        ...selectedMetodo,
        variables: selectedMetodo.variables.filter((_, i) => i !== index),
      };
      setSelectedMetodo(updatedMetodo);
    }
  };

  return {
    addVariable,
    removeVariable,
  };
};
export const useTarifaManager = () => {
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoTarifa | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariable, setNewVariable] = useState<VariableFormData>({
    nombre: '',
    descripcion: '',
    tipo: 'number',
    origen: 'input',
    valorDefault: 0,
  });

  const editModal = useModal<MetodoTarifa>();
  const deleteModal = useModal<MetodoTarifa>();

  const {
    data: metodos = [],
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: mockService.getAll,
    errorMessage: 'Error al cargar métodos de tarifa',
  });

  const { handleCreate, handleUpdate, handleDelete, handleTestFormula } = useTarifaOperations(
    refresh,
    editModal,
    deleteModal
  );

  const { addVariable, removeVariable } = useVariableOperations(selectedMetodo, setSelectedMetodo);

  const handleAddVariable = () => {
    addVariable(newVariable);
    setNewVariable({
      nombre: '',
      descripcion: '',
      tipo: 'number',
      origen: 'input',
      valorDefault: 0,
    });
  };

  const handleCreateWithCallback = async (data: Partial<MetodoTarifa>) => {
    await handleCreate(data);
    setShowAddForm(false);
  };

  return {
    // State
    metodos,
    loading,
    selectedMetodo,
    showAddForm,
    newVariable,

    // Modals
    editModal,
    deleteModal,

    // Setters
    setSelectedMetodo,
    setShowAddForm,
    setNewVariable,

    // Handlers
    handleCreate: handleCreateWithCallback,
    handleUpdate,
    handleDelete,
    handleTestFormula,
    addVariable: handleAddVariable,
    removeVariable,
    refresh,
  };
};
