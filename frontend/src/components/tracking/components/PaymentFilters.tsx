import React from 'react';
import { Card, Title, Grid, Select, Switch } from '@mantine/core';
import { EstadoPartida } from '../../../types/ordenCompra';
import { FiltrosSeguimiento } from '../hooks/usePaymentTracker';

interface PaymentFiltersProps {
  filtros: FiltrosSeguimiento;
  setFiltros: (filtros: FiltrosSeguimiento) => void;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({ filtros, setFiltros }) => {
  return (
    <Card withBorder mb="md">
      <Title order={6} mb="sm">
        Filtros
      </Title>
      <Grid>
        <Grid.Col span={3}>
          <Select
            label="Estado"
            placeholder="Todos los estados"
            data={[
              { value: 'abierta', label: 'Abierta' },
              { value: 'pagada', label: 'Pagada' },
              { value: 'vencida', label: 'Vencida' },
            ]}
            value={filtros.estado || ''}
            onChange={(value) =>
              setFiltros({ ...filtros, estado: (value as EstadoPartida) || undefined })
            }
            clearable
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Prioridad"
            placeholder="Todas las prioridades"
            data={[
              { value: 'alta', label: 'Alta' },
              { value: 'media', label: 'Media' },
              { value: 'baja', label: 'Baja' },
            ]}
            value={filtros.prioridad || ''}
            onChange={(value) => setFiltros({ ...filtros, prioridad: value || undefined })}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <div style={{ marginTop: '25px' }}>
            <Switch
              label="Solo vencidas"
              checked={filtros.soloVencidos || false}
              onChange={(event) =>
                setFiltros({ ...filtros, soloVencidos: event.currentTarget.checked })
              }
            />
          </div>
        </Grid.Col>
      </Grid>
    </Card>
  );
};
