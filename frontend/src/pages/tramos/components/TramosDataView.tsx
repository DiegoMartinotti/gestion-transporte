import React from 'react';
import { Paper, LoadingOverlay } from '@mantine/core';
import { TramosListView } from './TramosListView';
import { TramosCardsView } from './TramosCardsView';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';

interface TramosDataViewProps {
  tramos: Tramo[];
  viewMode: 'list' | 'cards';
  loading: boolean;
  detailModal: ModalReturn<Tramo>;
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
}

export const TramosDataView: React.FC<TramosDataViewProps> = ({
  tramos,
  viewMode,
  loading,
  detailModal,
  formModal,
  deleteModal,
}) => {
  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={loading} />
      {viewMode === 'list' ? (
        <TramosListView
          tramos={tramos}
          detailModal={detailModal}
          formModal={formModal}
          deleteModal={deleteModal}
        />
      ) : (
        <TramosCardsView
          tramos={tramos}
          detailModal={detailModal}
          formModal={formModal}
          deleteModal={deleteModal}
        />
      )}
    </Paper>
  );
};
