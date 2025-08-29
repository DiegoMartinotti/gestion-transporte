import type { IEscenarioSimulacion, IResultadoSimulacion } from '../../types/tarifa';

// Re-exportar componentes
export { default as EscenarioFormModal } from './components/EscenarioFormModal';
export { default as EscenariosTable } from './components/EscenariosTable';
export { default as ResultadosTable } from './components/ResultadosTable';

// Mantenemos las interfaces para compatibilidad
export interface EscenariosTableProps {
  escenarios: IEscenarioSimulacion[];
  onEdit: (escenario: IEscenarioSimulacion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (escenario: IEscenarioSimulacion) => void;
  onExecute: (escenarios: IEscenarioSimulacion[]) => void;
  simulando: boolean;
}

export interface ResultadosTableProps {
  resultados: IResultadoSimulacion[];
  onViewDetails: (resultado: IResultadoSimulacion) => void;
}