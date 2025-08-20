import React from 'react';
import { Paper, Grid, Select, Button } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import SearchInput from '../../../components/base/SearchInput';
import { Cliente } from '../../../types';

interface LocalSite {
  _id: string;
  nombre: string;
  cliente: string;
}

interface TramosFiltersPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCliente: string;
  setSelectedCliente: (cliente: string) => void;
  selectedOrigen: string;
  setSelectedOrigen: (origen: string) => void;
  selectedDestino: string;
  setSelectedDestino: (destino: string) => void;
  clearFilters: () => void;
  clientes: Cliente[];
  sites: LocalSite[];
}

export const TramosFiltersPanel: React.FC<TramosFiltersPanelProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCliente,
  setSelectedCliente,
  selectedOrigen,
  setSelectedOrigen,
  selectedDestino,
  setSelectedDestino,
  clearFilters,
  clientes,
  sites,
}) => (
  <Paper p="md" withBorder mb="md">
    <Grid>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <SearchInput placeholder="Buscar tramos..." value={searchTerm} onChange={setSearchTerm} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          placeholder="Filtrar por cliente"
          value={selectedCliente}
          onChange={(value) => setSelectedCliente(value || '')}
          data={clientes.map((cliente) => ({ value: cliente._id, label: cliente.nombre }))}
          clearable
          searchable
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 2 }}>
        <Select
          placeholder="Origen"
          value={selectedOrigen}
          onChange={(value) => setSelectedOrigen(value || '')}
          data={sites
            .filter((site) => !selectedCliente || site.cliente === selectedCliente)
            .map((site) => ({ value: site._id, label: site.nombre }))}
          clearable
          searchable
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 2 }}>
        <Select
          placeholder="Destino"
          value={selectedDestino}
          onChange={(value) => setSelectedDestino(value || '')}
          data={sites
            .filter((site) => !selectedCliente || site.cliente === selectedCliente)
            .map((site) => ({ value: site._id, label: site.nombre }))}
          clearable
          searchable
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 2 }}>
        <Button
          leftSection={<IconFilter size={16} />}
          onClick={clearFilters}
          variant="light"
          fullWidth
        >
          Limpiar
        </Button>
      </Grid.Col>
    </Grid>
  </Paper>
);
