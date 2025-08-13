import { Grid, Card, Text } from '@mantine/core';
import DataTable from '../base/DataTable';
import { VehiculoCard } from '../cards/VehiculoCard';
import { Vehiculo } from '../../types/vehiculo';
import { VEHICULOS_CONSTANTS } from '../../constants/vehiculos';

interface VehiculosTableProps {
  vehiculos: Vehiculo[];
  columns: any[];
  loading: boolean;
  viewMode: 'list' | 'cards';
  onEdit: (vehiculo: Vehiculo) => void;
  onDelete: (id: string, dominio?: string) => void;
  onView: (vehiculo: Vehiculo) => void;
}

export const VehiculosTable = ({
  vehiculos,
  columns,
  loading,
  viewMode,
  onEdit,
  onDelete,
  onView,
}: VehiculosTableProps) => {
  if (viewMode === 'list') {
    return (
      <DataTable
        data={vehiculos || []}
        columns={columns}
        loading={loading}
        emptyMessage={VEHICULOS_CONSTANTS.MESSAGES.EMPTY_VEHICULOS}
      />
    );
  }

  return (
    <Grid>
      {vehiculos.map((vehiculo) => (
        <Grid.Col key={vehiculo._id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <VehiculoCard vehiculo={vehiculo} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        </Grid.Col>
      ))}
      {vehiculos.length === 0 && !loading && (
        <Grid.Col span={12}>
          <Card withBorder>
            <Text ta="center" c="dimmed" py="xl">
              {VEHICULOS_CONSTANTS.MESSAGES.EMPTY_VEHICULOS}
            </Text>
          </Card>
        </Grid.Col>
      )}
    </Grid>
  );
};
