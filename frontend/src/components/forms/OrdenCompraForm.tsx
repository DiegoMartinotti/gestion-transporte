import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { OrdenCompraFormContent } from './components/OrdenCompraFormComponents';
import { useViajesData } from './helpers/ordenCompraHelpers';
import type { OrdenCompraFormData, ViajeItem } from '../../types/ordenCompra';
import type { OrdenCompraFormProps } from './types/ordenCompraTypes';

const useOrdenCompraForm = (initialData?: Partial<OrdenCompraFormData>) => {
  return useForm<OrdenCompraFormData>({
    initialValues: {
      cliente: initialData?.cliente || '',
      viajes: initialData?.viajes || [],
      numero: initialData?.numero || '',
      fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
      estado: initialData?.estado || 'Pendiente',
    },
    validate: {
      cliente: (value) => (!value ? 'Debe seleccionar un cliente' : null),
      numero: (value) => (!value ? 'El número es requerido' : null),
      fecha: (value) => (!value ? 'La fecha es requerida' : null),
      viajes: (value) => (value.length === 0 ? 'Debe agregar al menos un viaje' : null),
    },
  });
};

export function OrdenCompraForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: OrdenCompraFormProps) {
  const [showViajeAssigner, setShowViajeAssigner] = useState(false);
  const form = useOrdenCompraForm(initialData);
  const { viajesDisponibles, viajesData, loadingViajes, loadViajesDisponibles } = useViajesData();

  useEffect(() => {
    if (form.values.cliente) {
      loadViajesDisponibles(form.values.cliente);
    }
  }, [form.values.cliente, loadViajesDisponibles]);

  const handleAddViaje = (viajes: ViajeItem[]) => {
    const currentViajes = form.values.viajes;
    const newViajes = viajes.filter((v) => !currentViajes.some((cv) => cv.viaje === v.viaje));

    form.setFieldValue('viajes', [...currentViajes, ...newViajes]);
    setShowViajeAssigner(false);
  };

  const handleRemoveViaje = (index: number) => {
    const viajes = [...form.values.viajes];
    viajes.splice(index, 1);
    form.setFieldValue('viajes', viajes);
  };

  const handleUpdateImporte = (index: number, importe: number) => {
    const viajes = [...form.values.viajes];
    viajes[index].importe = importe;
    form.setFieldValue('viajes', viajes);
  };

  const calculateTotal = () => {
    return form.values.viajes.reduce((total, item) => total + item.importe, 0);
  };

  const getViajeInfo = (viajeId: string) => {
    return viajesData.get(viajeId);
  };

  const handleSubmit = (values: OrdenCompraFormData) => {
    if (values.viajes.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Debe agregar al menos un viaje',
        color: 'red',
      });
      return;
    }
    onSubmit(values);
  };

  return (
    <OrdenCompraFormContent
      form={form}
      showViajeAssigner={showViajeAssigner}
      setShowViajeAssigner={setShowViajeAssigner}
      viajesDisponibles={viajesDisponibles}
      viajesData={viajesData}
      loadingViajes={loadingViajes}
      loading={loading}
      initialData={initialData}
      onCancel={onCancel}
      handleSubmit={handleSubmit}
      handleAddViaje={handleAddViaje}
      handleRemoveViaje={handleRemoveViaje}
      handleUpdateImporte={handleUpdateImporte}
      calculateTotal={calculateTotal}
      getViajeInfo={getViajeInfo}
    />
  );
}
