import React, { useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { ITarifaMetodo, IReglaTarifa } from '../components/tarifa';
import { TarifasPageHeader } from '../components/tarifa/TarifasPageHeader';
import { TarifasQuickInfo } from '../components/tarifa/TarifasQuickInfo';
import { TarifasTabPanels } from '../components/tarifa/TarifasTabPanels';

/**
 * Página principal del sistema de tarifas flexibles
 * Integra todos los componentes del sistema de tarifación avanzada
 */
const TarifasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>('metodos');
  const [metodosDisponibles] = useState<ITarifaMetodo[]>([]);
  const [reglasDisponibles, setReglasDisponibles] = useState<IReglaTarifa[]>([]);

  const handleReglasChange = (reglas: IReglaTarifa[]) => {
    setReglasDisponibles(reglas);
  };

  const handleQuickStart = () => {
    setActiveTab('metodos');
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <TarifasPageHeader />
        <TarifasQuickInfo onQuickStart={handleQuickStart} />
        <TarifasTabPanels
          activeTab={activeTab}
          onTabChange={setActiveTab}
          metodosDisponibles={metodosDisponibles}
          reglasDisponibles={reglasDisponibles}
          onReglasChange={handleReglasChange}
        />
      </Stack>
    </Container>
  );
};

export default TarifasPage;
