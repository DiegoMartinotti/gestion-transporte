import { useState, useCallback } from 'react';
import {
  Stack,
  Group,
  Title,
  Button,
  Paper,
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
} from '@tabler/icons-react';
import { useDataLoader } from '../../hooks/useDataLoader';
import { extraService, type Extra } from '../../services/extraService';
import { clienteService } from '../../services/clienteService';
import { Cliente } from '../../types';
import { useExtrasActions } from './hooks/useExtrasActions';
import { useExtrasStats } from './hooks/useExtrasStats';
import { ExtrasPageFilters } from './components/ExtrasPageFilters';
import { ExtrasPageTabs } from './components/ExtrasPageTabs';
import { createExtrasColumns } from './components/ExtrasPageColumns';

export function ExtrasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('vigentes');

  // Hook para cargar extras con filtros dinámicos
  const extrasLoader = useDataLoader<Extra>({
    fetchFunction: useCallback(async () => {
      const filters: Record<string, unknown> = {};
      if (selectedCliente) filters.cliente = selectedCliente;
      if (selectedTipo) filters.tipo = selectedTipo;
      if (activeTab === 'vigentes') filters.vigente = true;

      const response = await extraService.getExtras(filters);
      // La API devuelve directamente el array, no un objeto con .data
      const data = Array.isArray(response) ? response : [];
      return {
        data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: data.length,
          itemsPerPage: data.length,
        },
      };
    }, [selectedCliente, selectedTipo, activeTab]),
    dependencies: [selectedCliente, selectedTipo, activeTab],
    errorMessage: 'Error al cargar extras',
  });

  // Hook para cargar clientes (solo una vez)
  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: useCallback(async () => {
      const response = await clienteService.getAll();
      // La API de clientes puede devolver data dentro de response
      const data = response.data || response;
      return {
        data: Array.isArray(data) ? data : [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: Array.isArray(data) ? data.length : 0,
          itemsPerPage: Array.isArray(data) ? data.length : 0,
        },
      };
    }, []),
    errorMessage: 'Error cargando clientes',
  });

  // Datos y estados
  const extras = extrasLoader.data;
  const loading = extrasLoader.loading || clientesLoader.loading;

  // Hooks para acciones y estadísticas
  const { handleCreate, handleEdit, handleDelete } = useExtrasActions(extrasLoader.refresh);
  const { vigentesCount, vencidosCount, totalCount } = useExtrasStats(extras);

  // Filtrar datos por término de búsqueda
  const filteredExtras = extras.filter((extra) =>
    extra.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Configurar columnas
  const columns = createExtrasColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={1}>Gestión de Extras</Title>
        <Button leftSection={<IconPlus size="1rem" />} onClick={handleCreate}>
          Nuevo Extra
        </Button>
      </Group>

      {/* Filtros */}
      <Paper withBorder p="md">
        <Group justify="space-between" align="center" mb="md">
          <Group gap="xs">
            <IconFilter size={20} />
            <Title order={3}>Filtros</Title>
          </Group>
        </Group>

        <ExtrasPageFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCliente={selectedCliente}
          onClienteChange={setSelectedCliente}
          selectedTipo={selectedTipo}
          onTipoChange={setSelectedTipo}
        />
      </Paper>

      {/* Tabs */}
      <ExtrasPageTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vigentesCount={vigentesCount}
        totalCount={totalCount}
        vencidosCount={vencidosCount}
        columns={columns}
        filteredExtras={filteredExtras}
        loading={loading}
      />
    </Stack>
  );
}