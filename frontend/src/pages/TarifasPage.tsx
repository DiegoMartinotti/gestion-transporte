import React from 'react';
import { Container, Stack } from '@mantine/core';
import { TarifasPageHeader } from '../components/tarifa/TarifasPageHeader';
import { TarifasQuickInfo } from '../components/tarifa/TarifasQuickInfo';
import { TarifasTabPanels } from '../components/tarifa/TarifasTabPanels';
import { useTarifasPage } from './hooks/useTarifasPage';

/**
 * Página principal del sistema de tarifas flexibles
 * Integra todos los componentes del sistema de tarifación avanzada
 */
const TarifasPage: React.FC = () => {
  const { activeTab, setActiveTab, reglasDisponibles, handleReglasChange, handleQuickStart } =
    useTarifasPage();

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <TarifasPageHeader />
        <TarifasQuickInfo onQuickStart={handleQuickStart} />
        <TarifasTabPanels
          activeTab={activeTab}
          onTabChange={setActiveTab}
          metodosDisponibles={[]}
          reglasDisponibles={reglasDisponibles}
          onReglasChange={handleReglasChange}
        />
      </Stack>
    </Container>
  );
};

export default TarifasPage;
