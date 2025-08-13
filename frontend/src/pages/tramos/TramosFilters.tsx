import React from 'react';
import { Paper, Grid, Select, Button, Group } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import SearchInput from '../../components/base/SearchInput';
import { Cliente } from '../../types';

interface LocalSite {
  _id: string;
  nombre: string;
  cliente: string;
}

interface TramosFiltersProps {
  searchTerm: string;
  selectedCliente: string;
  selectedOrigen: string;
  selectedDestino: string;
  clientes: Cliente[];
  sites: LocalSite[];
  onSearchChange: (value: string) => void;
  onClienteChange: (value: string) => void;
  onOrigenChange: (value: string) => void;
  onDestinoChange: (value: string) => void;
  onClearFilters: () => void;
}

const TramosFilters: React.FC<TramosFiltersProps> = ({
  searchTerm,
  selectedCliente,
  selectedOrigen,
  selectedDestino,
  clientes,
  sites,
  onSearchChange,
  onClienteChange,
  onOrigenChange,
  onDestinoChange,
  onClearFilters,
}) => {
  // Sites filtrados por cliente seleccionado
  const sitesFiltered = sites.filter(
    (site) => selectedCliente === '' || site.cliente === selectedCliente
  );

  return (
    <Paper p="md" withBorder>
      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <SearchInput
            placeholder="Buscar tramos..."
            value={searchTerm}
            onChange={onSearchChange}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            placeholder="Filtrar por cliente"
            value={selectedCliente}
            onChange={(value) => onClienteChange(value || '')}
            data={[
              { value: '', label: 'Todos los clientes' },
              ...clientes.map((c) => ({ value: c._id, label: c.nombre })),
            ]}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Select
            placeholder="Origen"
            value={selectedOrigen}
            onChange={(value) => onOrigenChange(value || '')}
            data={[
              { value: '', label: 'Cualquier origen' },
              ...sitesFiltered.map((s) => ({ value: s._id, label: s.nombre })),
            ]}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Select
            placeholder="Destino"
            value={selectedDestino}
            onChange={(value) => onDestinoChange(value || '')}
            data={[
              { value: '', label: 'Cualquier destino' },
              ...sitesFiltered.map((s) => ({ value: s._id, label: s.nombre })),
            ]}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconFilter size={16} />}
              onClick={onClearFilters}
            >
              Limpiar
            </Button>
          </Group>
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

export default TramosFilters;
