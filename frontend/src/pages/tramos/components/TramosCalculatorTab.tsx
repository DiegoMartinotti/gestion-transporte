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
  tramos: _tramos,
  formModal,
  onCalculationChange,
}) => {
  return (
    <Stack gap="md">
      <TramosSelector
        selectedTramo={formModal.selectedItem}
        onTramoSelect={(tramo) => {
          if (tramo) {
            formModal.openEdit(tramo);
          }
        }}
      />

      {formModal.selectedItem && (
        <>
          <TarifaCalculator
            tramoId={formModal.selectedItem._id}
            tramo={formModal.selectedItem}
            onCalculationChange={(calculation) => {
              // Convertir CalculationResult a TarifaCalculationResult
              const result: TarifaCalculationResult = {
                tarifa: calculation.tarifaBase,
                peaje: 0, // Calcular desde el desglose si existe
                total: calculation.total,
                metodo: calculation.metodCalculo,
                variables: {},
                formula: calculation.desglose.find((d) => d.formula)?.formula,
              };

              // Extraer peaje del desglose si existe
              const peajeItem = calculation.desglose.find((d) =>
                d.concepto.toLowerCase().includes('peaje')
              );
              if (peajeItem) {
                result.peaje = peajeItem.valor;
              }

              onCalculationChange(result);
            }}
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
