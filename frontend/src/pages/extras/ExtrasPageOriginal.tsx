import { Stack, Group, Title, Button, Paper, Tabs, Box } from '@mantine/core';
import { IconPlus, IconCalendar, IconExclamationCircle } from '@tabler/icons-react';
import DataTable from '../../components/base/DataTable';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { ExtrasFilters } from '../../components/extras/ExtrasFilters';
import { useExtrasData } from '../../hooks/useExtrasData';
import { useExtrasActions } from '../../hooks/useExtrasActions';
import { createExtrasTableColumns } from '../../utils/extrasTableColumns';

const TIPOS_EXTRA = ['PEAJE', 'COMBUSTIBLE', 'ESTADIA', 'CARGA_DESCARGA', 'SEGURO', 'OTROS'];

export function ExtrasPage() {
  const {
    searchTerm,
    setSearchTerm,
    selectedCliente,
    setSelectedCliente,
    selectedTipo,
    setSelectedTipo,
    activeTab,
    setActiveTab,
    extras,
    filteredExtras,
    loading,
    loadData,
    vigenteCount,
    vencidoCount,
  } = useExtrasData();

  const { handleEdit, handleDelete } = useExtrasActions(loadData);

  const columns = createExtrasTableColumns(handleEdit, handleDelete);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Gestión de Extras</Title>
        <Button leftSection={<IconPlus size={16} />}>Nuevo Extra</Button>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <ExtrasFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCliente={selectedCliente}
            setSelectedCliente={setSelectedCliente}
            selectedTipo={selectedTipo}
            setSelectedTipo={setSelectedTipo}
            tiposExtra={TIPOS_EXTRA}
          />

          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'vigentes')}>
            <Tabs.List>
              <Tabs.Tab value="vigentes" leftSection={<IconCalendar size={16} />}>
                Vigentes ({vigenteCount})
              </Tabs.Tab>
              <Tabs.Tab value="todos">Todos ({extras.length})</Tabs.Tab>
              <Tabs.Tab value="vencidos" leftSection={<IconExclamationCircle size={16} />}>
                Vencidos ({vencidoCount})
              </Tabs.Tab>
            </Tabs.List>

            <Box mt="md">
              <DataTable data={filteredExtras} columns={columns} loading={loading} />
            </Box>
          </Tabs>
        </Stack>
      </Paper>

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Stack>
  );
}
