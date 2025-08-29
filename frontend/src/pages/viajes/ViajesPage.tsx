import React from 'react';
import { ViajesPageContent } from './components/ViajesPageContent';
import { useViajesLogic, useViajesState } from './hooks/useViajesPageHooks';

export const ViajesPage = () => {
  const { viajes, loading, error, fetchViajes } = useViajesLogic();
  const viajesState = useViajesState();

  return (
    <ViajesPageContent
      viajes={viajes}
      loading={loading}
      error={error}
      fetchViajes={fetchViajes}
      viajesState={viajesState}
    />
  );
};