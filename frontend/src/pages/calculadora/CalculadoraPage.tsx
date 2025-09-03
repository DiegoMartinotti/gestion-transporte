import React, { useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { CalculadoraHeader } from '../../components/calculators/CalculadoraHeader';
import { CalculadoraContent } from '../../components/calculators/CalculadoraContent';
import { TramosSelector } from '../../components/selectors/TramosSelector';
import { Tramo } from '../../types';

const CalculadoraPage: React.FC = () => {
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);
  const [activeView, setActiveView] = useState<'calculadora' | 'versiones' | 'configuracion'>(
    'calculadora'
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <CalculadoraHeader activeView={activeView} onViewChange={setActiveView} />

        <TramosSelector
          onTramoSelect={(tramo) => setSelectedTramo(tramo)}
          selectedTramo={selectedTramo}
        />

        <CalculadoraContent activeView={activeView} selectedTramo={selectedTramo} />
      </Stack>
    </Container>
  );
};

export default CalculadoraPage;
