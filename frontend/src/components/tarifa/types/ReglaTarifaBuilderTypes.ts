import { DropResult } from 'react-beautiful-dnd';
import { ICondicion, IModificador } from '../../../types/tarifa';

// Tipos específicos para reemplazar any types
export interface DragEndResult extends DropResult {
  destination: {
    index: number;
    droppableId: string;
  } | null;
  source: {
    index: number;
    droppableId: string;
  };
}

export interface FiltersChangeEvent {
  [key: string]: string | number | boolean | undefined;
}

// Estados de componentes internos
export interface CondicionFormState {
  campo: string;
  operador: string;
  valor: string | number;
  valorHasta?: string | number;
}

export interface ModificadorFormState {
  tipo: string;
  valor: number;
  aplicarA: string;
  descripcion: string;
  formulaPersonalizada?: string;
}

// Props para sub-componentes
export interface CondicionesFormProps {
  condiciones: ICondicion[];
  onCondicionesChange: (condiciones: ICondicion[]) => void;
}

export interface ModificadoresFormProps {
  modificadores: IModificador[];
  onModificadoresChange: (modificadores: IModificador[]) => void;
}
