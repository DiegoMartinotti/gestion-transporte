import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { TarifaHistorica } from '../../../types';

export const useTarifaModal = (form: {
  values: { tarifasHistoricas: TarifaHistorica[] };
  setFieldValue: (field: string, value: TarifaHistorica[]) => void;
}) => {
  const [selectedTarifa, setSelectedTarifa] = useState<TarifaHistorica | null>(null);
  const [tarifaIndex, setTarifaIndex] = useState<number>(-1);
  const [tarifaModalOpened, { open: openTarifaModal, close: closeTarifaModal }] = useDisclosure();

  const handleAddTarifa = () => {
    setSelectedTarifa(null);
    setTarifaIndex(-1);
    openTarifaModal();
  };

  const handleEditTarifa = (tarifa: TarifaHistorica, index: number) => {
    setSelectedTarifa(tarifa);
    setTarifaIndex(index);
    openTarifaModal();
  };

  const handleDeleteTarifa = (index: number) => {
    const newTarifas = [...form.values.tarifasHistoricas];
    newTarifas.splice(index, 1);
    form.setFieldValue('tarifasHistoricas', newTarifas);
  };

  const handleTarifaSubmit = (tarifaData: Omit<TarifaHistorica, '_id'>) => {
    const newTarifas = [...form.values.tarifasHistoricas];

    if (tarifaIndex >= 0) {
      newTarifas[tarifaIndex] = { ...newTarifas[tarifaIndex], ...tarifaData };
    } else {
      newTarifas.push(tarifaData as TarifaHistorica);
    }

    form.setFieldValue('tarifasHistoricas', newTarifas);
    closeTarifaModal();
  };

  return {
    selectedTarifa,
    tarifaModalOpened,
    closeTarifaModal,
    handleAddTarifa,
    handleEditTarifa,
    handleDeleteTarifa,
    handleTarifaSubmit,
  };
};
