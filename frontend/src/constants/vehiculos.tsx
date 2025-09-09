import React from 'react';
import { Badge, Text, Group, ActionIcon } from '@mantine/core';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { Vehiculo, VehiculoTipo } from '../types/vehiculo';
import { Empresa } from '../types';
import { VencimientoInfo, VehiculoFormModal, VehiculoDetailModal } from '../types/excel';

export const VEHICULOS_CONSTANTS = {
  TIPOS: [
    'Camión',
    'Acoplado',
    'Semirremolque',
    'Bitren',
    'Furgón',
    'Utilitario',
  ] as VehiculoTipo[],
  ESTADO_OPTIONS: [
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' },
  ],
  MESSAGES: {
    SUCCESS_DELETE: 'Vehículo eliminado correctamente',
    ERROR_DELETE: 'Error al eliminar el vehículo',
    EMPTY_VEHICULOS: 'No se encontraron vehículos',
    EMPTY_VENCIMIENTOS: 'No hay vehículos con vencimientos próximos',
    SEARCH_PLACEHOLDER: 'Buscar por dominio, marca o modelo...',
    CONFIRM_DELETE: '¿Está seguro que desea eliminar el vehículo',
    LOADING_FORM: 'Cargando formulario...',
  },
  COLORS: {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    EXPIRED: 'red',
    NEAR_EXPIRY: 'orange',
    UP_TO_DATE: 'green',
  },
};

export const getEmpresaNombre = (empresas: Empresa[], empresaId: string): string => {
  if (!empresas || !Array.isArray(empresas)) return 'N/A';
  const empresa = empresas.find((e) => e._id === empresaId);
  return empresa ? empresa.nombre : 'N/A';
};

export const getStatusBadge = (vehiculo: Vehiculo): React.ReactNode => {
  return (
    <Badge
      color={
        vehiculo.activo ? VEHICULOS_CONSTANTS.COLORS.ACTIVE : VEHICULOS_CONSTANTS.COLORS.INACTIVE
      }
    >
      {vehiculo.activo ? 'Activo' : 'Inactivo'}
    </Badge>
  );
};

export const getVencimientosBadge = (vencimientos: VencimientoInfo[]): React.ReactNode => {
  if (!vencimientos || vencimientos.length === 0) {
    return <Badge color={VEHICULOS_CONSTANTS.COLORS.UP_TO_DATE}>Al día</Badge>;
  }

  const vencidos = vencimientos.filter((v) => v.diasRestantes !== undefined && v.diasRestantes < 0);
  const proximos = vencimientos.filter(
    (v) => v.diasRestantes !== undefined && v.diasRestantes >= 0 && v.diasRestantes <= 30
  );

  if (vencidos.length > 0) {
    return <Badge color={VEHICULOS_CONSTANTS.COLORS.EXPIRED}>Vencido ({vencidos.length})</Badge>;
  }
  if (proximos.length > 0) {
    return (
      <Badge color={VEHICULOS_CONSTANTS.COLORS.NEAR_EXPIRY}>Próx. venc. ({proximos.length})</Badge>
    );
  }
  return <Badge color={VEHICULOS_CONSTANTS.COLORS.UP_TO_DATE}>Al día</Badge>;
};

export const createVehiculosColumns = (
  empresas: Empresa[],
  openDeleteModal: (id: string, dominio?: string) => void,
  formModal: VehiculoFormModal,
  detailModal: VehiculoDetailModal
) => [
  {
    key: 'dominio',
    label: 'Dominio',
    render: (vehiculo: Vehiculo) => <Text fw={500}>{vehiculo.dominio}</Text>,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (vehiculo: Vehiculo) => vehiculo.tipo,
  },
  {
    key: 'marca_modelo',
    label: 'Marca/Modelo',
    render: (vehiculo: Vehiculo) =>
      `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim() || 'N/A',
  },
  {
    key: 'empresa',
    label: 'Empresa',
    render: (vehiculo: Vehiculo) =>
      getEmpresaNombre(
        empresas,
        typeof vehiculo.empresa === 'string' ? vehiculo.empresa : vehiculo.empresa._id
      ),
  },
  {
    key: 'año',
    label: 'Año',
    render: (vehiculo: Vehiculo) => vehiculo.año || 'N/A',
  },
  {
    key: 'activo',
    label: 'Estado',
    render: (vehiculo: Vehiculo) => getStatusBadge(vehiculo),
  },
  {
    key: 'actions',
    label: 'Acciones',
    render: (vehiculo: Vehiculo) => (
      <Group gap="xs">
        <ActionIcon
          size="sm"
          variant="subtle"
          color="green"
          onClick={() => detailModal.openView(vehiculo)}
        >
          <IconEye size={16} />
        </ActionIcon>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="blue"
          onClick={() => formModal.openEdit(vehiculo)}
        >
          <IconEdit size={16} />
        </ActionIcon>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="red"
          onClick={() => vehiculo._id && openDeleteModal(vehiculo._id, vehiculo.dominio)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    ),
  },
];
