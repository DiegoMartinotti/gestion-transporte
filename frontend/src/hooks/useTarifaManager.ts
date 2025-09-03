import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useModal } from './useModal';
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

const mockService = {
  getAll: async () => [] as MetodoTarifa[],
  create: async (data: Partial<MetodoTarifa>) => ({ id: '1', ...data }) as MetodoTarifa,
  update: async (id: string, data: Partial<MetodoTarifa>) => ({ id, ...data }) as MetodoTarifa,
  delete: async (id: string) => {
    console.log('Deleted:', id);
  },
  testFormula: async (formula: string, valores: Record<string, number>) => {
    console.log('Testing formula:', formula, 'with values:', valores);
    return { resultado: 42, errores: [] };
  },
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

  const editModal = useModal();
  const deleteModal = useModal();

  const {
    data: metodos = [],
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: mockService.getAll,
    errorMessage: 'Error al cargar métodos de tarifa',
  });

  const handleCreate = async (data: Partial<MetodoTarifa>) => {
    try {
      await mockService.create(data);
      notifications.show({
        title: 'Éxito',
        message: 'Método de tarifa creado correctamente',
        color: 'green',
      });
      refresh();
      setShowAddForm(false);
    } catch (error) {
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
      notifications.show({
        title: 'Error',
        message: 'Error al probar la fórmula',
        color: 'red',
      });
    }
  };

  const addVariable = () => {
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
      setNewVariable({
        nombre: '',
        descripcion: '',
        tipo: 'number',
        origen: 'input',
        valorDefault: 0,
      });
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
    handleCreate,
    handleUpdate,
    handleDelete,
    handleTestFormula,
    addVariable,
    removeVariable,
    refresh,
  };
};
