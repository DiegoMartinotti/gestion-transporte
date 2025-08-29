import { useForm } from '@mantine/form';
import { ReglaTarifaFormData, IReglaTarifa } from '../../../types/tarifa';
import { useReglaTarifaFormHandlers } from './useReglaTarifaFormHandlers';

interface UseReglaTarifaFormProps {
  reglas: IReglaTarifa[];
  onSuccess: () => void;
}

export const useReglaTarifaForm = ({ reglas, onSuccess }: UseReglaTarifaFormProps) => {
  const form = useForm<ReglaTarifaFormData>({
    initialValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      cliente: '',
      metodoCalculo: '',
      condiciones: [],
      operadorLogico: 'AND',
      modificadores: [],
      prioridad: 100,
      activa: true,
      fechaInicioVigencia: '',
      fechaFinVigencia: '',
      aplicarEnCascada: true,
      excluirOtrasReglas: false,
      diasSemana: [],
      horariosAplicacion: {
        horaInicio: '',
        horaFin: '',
      },
    },
    validate: {
      codigo: (value) => (value.trim() === '' ? 'Código es requerido' : null),
      nombre: (value) => (value.trim() === '' ? 'Nombre es requerido' : null),
      metodoCalculo: (value) => (value === '' ? 'Método de cálculo es requerido' : null),
    },
  });

  const { handleSubmit, handleDragEnd, handleDelete } = useReglaTarifaFormHandlers({
    reglas,
    onSuccess,
  });

  return {
    form,
    handleSubmit,
    handleDragEnd,
    handleDelete,
  };
};
