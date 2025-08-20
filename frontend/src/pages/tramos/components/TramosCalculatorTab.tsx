import React from 'react';
import { Stack } from '@mantine/core';
import TarifaCalculator from '../../../components/calculators/TarifaCalculator';
import { TarifaVersioning } from '../../../components/versioning/TarifaVersioning';
import { TramosSelector } from '../../../components/selectors/TramosSelector';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { TarifaCalculationResult } from '../types';

interface TramosCalculatorTabProps {
  tramos: Tramo[];
  formModal: ModalReturn<Tramo>;
  onCalculationChange: (result: TarifaCalculationResult) => void;
}

export const TramosCalculatorTab: React.FC<TramosCalculatorTabProps> = ({
  tramos,
  formModal,
  onCalculationChange,
}) => {
  return (
    <Stack gap="md">
      <TramosSelector
        value={formModal.selectedItem?._id || ''}
        onChange={(tramoId) => {
          const tramo = tramos.find((t) => t._id === tramoId);
          if (tramo) {
            formModal.openEdit(tramo);
          }
        }}
        data={tramos.map((t) => ({
          value: t._id,
          label: `${t.origen.nombre} → ${t.destino.nombre} (${t.cliente.nombre})`,
        }))}
        placeholder="Seleccione un tramo para calcular"
      />

      {formModal.selectedItem && (
        <>
          <TarifaCalculator
            tramoId={formModal.selectedItem._id}
            tramo={formModal.selectedItem}
            onCalculationChange={onCalculationChange}
          />

          <TarifaVersioning
            tramoId={formModal.selectedItem._id}
            onVersionSelect={(version) => {
              console.log('Versión seleccionada:', version);
            }}
          />
        </>
      )}
    </Stack>
  );
};
