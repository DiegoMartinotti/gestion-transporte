import React from 'react';
import { Group, ActionIcon } from '@mantine/core';
import { IconHistory, IconEdit, IconTrash } from '@tabler/icons-react';
import DataTable from '../../../components/base/DataTable';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { getTarifaStatus } from '../utils/tarifaUtils';

interface TramosListViewProps {
  tramos: Tramo[];
  detailModal: ModalReturn<Tramo>;
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
}

export const TramosListView: React.FC<TramosListViewProps> = ({
  tramos,
  detailModal,
  formModal,
  deleteModal,
}) => {
  return (
    <DataTable
      data={tramos}
      columns={[
        { key: 'cliente.nombre', header: 'Cliente', sortable: true },
        { key: 'origen.nombre', header: 'Origen', sortable: true },
        { key: 'destino.nombre', header: 'Destino', sortable: true },
        { key: 'distancia', header: 'Distancia (km)', sortable: true },
        {
          key: 'tarifa',
          header: 'Tarifa',
          render: getTarifaStatus,
        },
        {
          key: 'actions',
          header: 'Acciones',
          render: (tramo: Tramo) => (
            <Group gap="xs">
              <ActionIcon size="sm" variant="light" onClick={() => detailModal.openView(tramo)}>
                <IconHistory size={14} />
              </ActionIcon>
              <ActionIcon size="sm" variant="light" onClick={() => formModal.openEdit(tramo)}>
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="light"
                color="red"
                onClick={() => deleteModal.openDelete(tramo)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ),
        },
      ]}
    />
  );
};
