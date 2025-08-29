import React from 'react';
import { Group, Button } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconHistory, IconRefresh } from '@tabler/icons-react';
import { ImportState } from '../types';

interface WizardNavigationProps {
  active: number;
  entityType: string;
  importState: ImportState;
  onPrevStep: () => void;
  onNextStep: () => void;
  onNewImport: () => void;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  active,
  entityType,
  importState,
  onPrevStep,
  onNextStep,
  onNewImport,
}) => (
  <Group justify="space-between">
    <Button
      variant="default"
      onClick={onPrevStep}
      disabled={active === 0}
      leftSection={<IconChevronLeft size={16} />}
    >
      Anterior
    </Button>

    {active < 5 && active !== 2 && active !== 4 && (
      <Button
        onClick={onNextStep}
        disabled={(active === 0 && !entityType) || (active === 1 && !importState.file)}
        rightSection={<IconChevronRight size={16} />}
      >
        Siguiente
      </Button>
    )}

    {active === 5 && (
      <Group>
        <Button
          variant="light"
          leftSection={<IconHistory size={16} />}
          onClick={() => {
            // Ir al historial de importaciones
          }}
        >
          Ver historial
        </Button>
        <Button
          variant="filled"
          leftSection={<IconRefresh size={16} />}
          onClick={onNewImport}
        >
          Nueva importación
        </Button>
      </Group>
    )}
  </Group>
);