import { useState } from 'react';
import { IReglaTarifa } from '../../components/tarifa';

/**
 * Hook personalizado para la página de tarifas
 * Encapsula la lógica de estado y handlers del componente TarifasPage
 */
export const useTarifasPage = () => {
  const [activeTab, setActiveTab] = useState<string | null>('metodos');
  const [reglasDisponibles, setReglasDisponibles] = useState<IReglaTarifa[]>([]);

  const handleReglasChange = (reglas: IReglaTarifa[]) => {
    setReglasDisponibles(reglas);
  };

  const handleQuickStart = () => {
    setActiveTab('metodos');
  };

  return {
    activeTab,
    setActiveTab,
    reglasDisponibles,
    handleReglasChange,
    handleQuickStart,
  };
};
