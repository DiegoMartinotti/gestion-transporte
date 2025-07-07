import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Select,
  Grid,
  Paper,
  Text,
  ActionIcon,
  Stack,
  Tooltip,
  SegmentedControl
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconMapPin,
  IconBuilding,
  IconExternalLink,
  IconMap2,
  IconTable,
  IconMap,
  IconDownload,
  IconUpload
} from '@tabler/icons-react';
import { DataTable, ConfirmModal } from '../../components/base';
import { ExcelImportModal } from '../../components/modals';
import SiteMap from '../../components/maps/SiteMap';
import { Site, SiteFilters, Cliente } from '../../types';
import { siteService } from '../../services/siteService';
import { clienteService } from '../../services/clienteService';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { siteExcelService } from '../../services/BaseExcelService';

const SitesPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [selectedSite, setSelectedSite] = useState<Site | undefined>();
  const [filters, setFilters] = useState<SiteFilters>({
    page: 1,
    limit: 10,
    sortBy: 'nombre',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    site: Site | null;
  }>({ isOpen: false, site: null });
  const [importModalOpened, setImportModalOpened] = useState(false);

  const loadSites = useCallback(async () => {
    try {
      setLoading(true);
      const response = await siteService.getAll(filters);
      setSites(response.data);
      setPagination(response.pagination);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los sites',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadClientes = useCallback(async () => {
    try {
      const response = await clienteService.getAll({ limit: 1000 });
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'sites',
    entityName: 'sites',
    exportFunction: (filters) => siteExcelService.exportToExcel(filters),
    templateFunction: () => siteExcelService.getTemplate(),
    reloadFunction: loadSites,
  });

  const handleImportComplete = async (result: any) => {
    setImportModalOpened(false);
    excelOperations.handleImportComplete(result);
  };


  const handleFilterChange = (key: keyof SiteFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };


  const handleDelete = async (site: Site) => {
    try {
      await siteService.delete(site._id);
      notifications.show({
        title: 'Éxito',
        message: 'Site eliminado correctamente',
        color: 'green'
      });
      loadSites();
      setDeleteModal({ isOpen: false, site: null });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el site',
        color: 'red'
      });
    }
  };


  const getClienteNombre = (cliente: string | Cliente): string => {
    if (typeof cliente === 'string') {
      const clienteObj = clientes.find(c => c._id === cliente);
      return clienteObj?.nombre || 'Cliente no encontrado';
    }
    return cliente.nombre;
  };

  const openGoogleMaps = (site: Site) => {
    if (!site.coordenadas) return;
    const url = `https://maps.google.com/?q=${site.coordenadas.lat},${site.coordenadas.lng}`;
    window.open(url, '_blank');
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (site: Site) => (
        <Stack gap={4}>
          <Text fw={500}>{site?.nombre || 'Sin nombre'}</Text>
          <Group gap={4}>
            <IconMapPin size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
            <Text size="xs" c="dimmed">{site?.localidad || 'Sin localidad'}, {site?.provincia || 'Sin provincia'}</Text>
          </Group>
        </Stack>
      )
    },
    {
      key: 'cliente',
      label: 'Cliente',
      sortable: true,
      render: (site: Site) => (
        <Group gap={8}>
          <IconBuilding size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text>{site && site.cliente ? getClienteNombre(site.cliente) : 'Sin cliente'}</Text>
        </Group>
      )
    },
    {
      key: 'direccion',
      label: 'Dirección',
      render: (site: Site) => (
        <Stack gap={4}>
          <Text size="sm">{site?.direccion || '-'}</Text>
          {site?.codigo && (
            <Text size="xs" c="dimmed">Código: {site.codigo}</Text>
          )}
        </Stack>
      )
    },
    {
      key: 'fechas',
      label: 'Fechas',
      render: (site: Site) => (
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Creado: {site?.createdAt ? new Date(site.createdAt).toLocaleDateString() : 'No disponible'}
          </Text>
          <Text size="xs" c="dimmed">
            Actualizado: {site?.updatedAt ? new Date(site.updatedAt).toLocaleDateString() : 'No disponible'}
          </Text>
        </Stack>
      )
    },
    {
      key: 'coordenadas',
      label: 'Ubicación',
      render: (site: Site) => (
        <Group gap={8}>
          {site?.coordenadas ? (
            <>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Lat: {site.coordenadas.lat.toFixed(6)}
                </Text>
                <Text size="xs" c="dimmed">
                  Lng: {site.coordenadas.lng.toFixed(6)}
                </Text>
              </Stack>
              <Tooltip label="Ver en Google Maps">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  onClick={() => openGoogleMaps(site)}
                >
                  <IconExternalLink size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          ) : (
            <Text size="xs" c="dimmed">Sin coordenadas</Text>
          )}
        </Group>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (site: Site) => (
        <Group gap={4}>
          <Tooltip label="Ver detalles">
            <ActionIcon size="sm" variant="subtle" color="blue">
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          {site?.coordenadas && (
            <Tooltip label="Ver en mapa">
              <ActionIcon size="sm" variant="subtle" color="green" onClick={() => openGoogleMaps(site)}>
                <IconMap2 size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Editar">
            <ActionIcon size="sm" variant="subtle" color="yellow">
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar">
            <ActionIcon 
              size="sm" 
              variant="subtle" 
              color="red"
              onClick={() => site && setDeleteModal({ isOpen: true, site })}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )
    }
  ];

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={1}>Gestión de Sites</Title>
          <Group>
            <SegmentedControl
              value={viewMode}
              onChange={(value: string) => setViewMode(value as 'table' | 'map')}
              data={[
                {
                  label: (
                    <Group gap={4} justify="center">
                      <IconTable size={16} />
                      <span>Tabla</span>
                    </Group>
                  ),
                  value: 'table'
                },
                {
                  label: (
                    <Group gap={4} justify="center">
                      <IconMap size={16} />
                      <span>Mapa</span>
                    </Group>
                  ),
                  value: 'map'
                }
              ]}
            />
            <Button
              variant="outline"
              leftSection={<IconUpload size={16} />}
              onClick={() => setImportModalOpened(true)}
            >
              Importar
            </Button>
            <Button
              variant="outline"
              leftSection={<IconDownload size={16} />}
              onClick={() => excelOperations.handleExport(filters)}
              loading={excelOperations.isExporting}
            >
              Exportar
            </Button>
            <Button leftSection={<IconPlus size={16} />}>
              Nuevo Site
            </Button>
          </Group>
        </Group>

        <Paper p="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="Cliente"
                placeholder="Filtrar por cliente"
                data={[
                  { value: '', label: 'Todos los clientes' },
                  ...clientes.map(cliente => ({
                    value: cliente._id,
                    label: cliente.nombre
                  }))
                ]}
                value={filters.cliente || ''}
                onChange={(value) => handleFilterChange('cliente', value || undefined)}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="Elementos por página"
                data={[
                  { value: '10', label: '10' },
                  { value: '25', label: '25' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' }
                ]}
                value={filters.limit?.toString() || '10'}
                onChange={(value) => handleFilterChange('limit', parseInt(value || '10'))}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {viewMode === 'table' ? (
          <DataTable
            data={sites}
            columns={columns}
            loading={loading}
            totalItems={pagination.totalItems}
            currentPage={pagination.currentPage}
            pageSize={pagination.itemsPerPage}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => handleFilterChange('limit', pageSize)}
            onFiltersChange={(filters) => {
              if (filters.search !== undefined) handleFilterChange('search', filters.search);
              if (filters.sortBy && filters.sortOrder) {
                setFilters(prev => ({
                  ...prev,
                  sortBy: filters.sortBy!,
                  sortOrder: filters.sortOrder!
                }));
              }
            }}
          />
        ) : (
          <SiteMap
            sites={sites}
            selectedSite={selectedSite}
            onSiteSelect={setSelectedSite}
            onSiteEdit={(site) => {
              // TODO: Implementar edición de site
              notifications.show({
                title: 'Funcionalidad pendiente',
                message: 'La edición de sites desde el mapa estará disponible pronto',
                color: 'blue'
              });
            }}
            height={600}
            showFilters={false} // Los filtros ya están arriba
            clientes={clientes}
          />
        )}
      </Stack>

      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, site: null })}
        onConfirm={() => deleteModal.site && handleDelete(deleteModal.site)}
        title="Eliminar Site"
        message={`¿Está seguro que desea eliminar el site "${deleteModal.site?.nombre}"?`}
        type="delete"
      />

      <ExcelImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        title="Importar Sites desde Excel"
        entityType="sites"
        onImportComplete={handleImportComplete}
        processExcelFile={siteService.processExcelFile}
        validateExcelFile={siteService.validateExcelFile}
        previewExcelFile={siteService.previewExcelFile}
        getTemplate={async () => {
          const blob = await siteExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_sites.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />
    </Container>
  );
};

export default SitesPage;