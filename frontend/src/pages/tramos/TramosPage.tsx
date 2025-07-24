import React, { useState, lazy, Suspense, useCallback } from 'react';
import {
  Paper,
  Title,
  Group,
  Button,
  Stack,
  Tabs,
  Badge,
  Text,
  Select,
  ActionIcon,
  Modal,
  Grid,
  Card,
  Menu,
  LoadingOverlay
} from '@mantine/core';
import {
  IconPlus,
  IconFilter,
  IconRefresh,
  IconRoute,
  IconMapPin,
  IconRoad,
  IconDots,
  IconEdit,
  IconTrash,
  IconHistory,
  IconMap,
  IconDownload,
  IconUpload,
  IconFileText
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDataLoader } from '../../hooks/useDataLoader';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { useModal } from '../../hooks/useModal';
import { tramoExcelService } from '../../services/BaseExcelService';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import DataTable from '../../components/base/DataTable';
import SearchInput from '../../components/base/SearchInput';
import { tramoService } from '../../services/tramoService';
import { clienteService } from '../../services/clienteService';
import { siteService } from '../../services/siteService';
import TramoDetail from '../../components/details/TramoDetail';
import ConfirmModal from '../../components/base/ConfirmModal';
import TarifaCalculator from '../../components/calculators/TarifaCalculator';
import { TarifaVersioning } from '../../components/versioning/TarifaVersioning';
import { TramosSelector } from '../../components/selectors/TramosSelector';
import { Tramo, Cliente } from '../../types';

// Lazy load del formulario complejo
const TramoForm = lazy(() => import('../../components/forms/TramoForm'));

interface LocalSite {
  _id: string;
  nombre: string;
  cliente: string;
}

const TramosPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedOrigen, setSelectedOrigen] = useState<string>('');
  const [selectedDestino, setSelectedDestino] = useState<string>('');
  const [activeTab, setActiveTab] = useState('todos');
  const [viewMode] = useState<'list' | 'cards'>('list');

  // Hooks centralizados para carga de datos
  const tramosLoader = useDataLoader<Tramo>({
    fetchFunction: useCallback(async () => {
      const response = await tramoService.getAll();
      const tramosData = Array.isArray(response) ? response : (response as any)?.data || [];
      return {
        data: tramosData,
        pagination: { currentPage: 1, totalPages: 1, totalItems: tramosData.length, itemsPerPage: tramosData.length }
      };
    }, []),
    errorMessage: 'Error al cargar tramos',
    onSuccess: useCallback((data: Tramo[]) => console.log('Datos de tramos recibidos:', data.length, 'tramos'), [])
  });

  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: useCallback(async () => {
      const response = await clienteService.getAll();
      const clientesData = Array.isArray(response) ? response : response.data;
      return {
        data: clientesData,
        pagination: { currentPage: 1, totalPages: 1, totalItems: clientesData.length, itemsPerPage: clientesData.length }
      };
    }, []),
    errorMessage: 'Error al cargar clientes'
  });

  const sitesLoader = useDataLoader<LocalSite>({
    fetchFunction: useCallback(async () => {
      const response = await siteService.getAll();
      const sitesData = Array.isArray(response) ? response : response.data;
      return {
        data: sitesData.map((site: any) => ({
          _id: site._id,
          nombre: site.nombre,
          cliente: typeof site.cliente === 'string' ? site.cliente : site.cliente._id
        })),
        pagination: { currentPage: 1, totalPages: 1, totalItems: sitesData.length, itemsPerPage: sitesData.length }
      };
    }, []),
    errorMessage: 'Error al cargar sites'
  });

  // Datos y estados de carga
  const tramos = tramosLoader.data;
  const clientes = clientesLoader.data;
  const sites = sitesLoader.data;
  // Solo mostrar loading si realmente no hay datos cargados aún
  const loading = (tramosLoader.loading && tramos.length === 0) || 
                  (clientesLoader.loading && clientes.length === 0) || 
                  (sitesLoader.loading && sites.length === 0);
  

  // Función de recarga para todos los datos
  const loadData = async () => {
    await Promise.all([
      tramosLoader.refresh(),
      clientesLoader.refresh(),
      sitesLoader.refresh()
    ]);
  };

  const formModal = useModal<Tramo>({
    onSuccess: () => loadData()
  });
  const detailModal = useModal<Tramo>();
  const deleteModal = useModal<Tramo>();
  const importModal = useModal();

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'tramos',
    entityName: 'tramos',
    exportFunction: (filters) => tramoExcelService.exportToExcel(filters),
    templateFunction: () => tramoExcelService.getTemplate(),
    reloadFunction: loadData,
  });

  // Filtrar tramos
  const filteredTramos = tramos.filter(tramo => {
    // Validar que el tramo tenga las propiedades necesarias
    if (!tramo || !tramo.origen || !tramo.destino || !tramo.cliente) {
      return false;
    }
    
    const matchesSearch = searchTerm === '' || 
      (tramo.origen.nombre && tramo.origen.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tramo.destino.nombre && tramo.destino.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tramo.cliente.nombre && tramo.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCliente = selectedCliente === '' || (tramo.cliente._id && tramo.cliente._id === selectedCliente);
    const matchesOrigen = selectedOrigen === '' || (tramo.origen._id && tramo.origen._id === selectedOrigen);
    const matchesDestino = selectedDestino === '' || (tramo.destino._id && tramo.destino._id === selectedDestino);
    
    let matchesTab = true;
    if (activeTab === 'con-tarifa') {
      matchesTab = !!(tramo.tipo || tramo.tarifaVigente);
    } else if (activeTab === 'sin-tarifa') {
      matchesTab = !(tramo.tipo || tramo.tarifaVigente);
    }
    
    return matchesSearch && matchesCliente && matchesOrigen && matchesDestino && matchesTab;
  });
  

  // Sites filtrados por cliente seleccionado
  const sitesFiltered = sites.filter(site => 
    selectedCliente === '' || site.cliente === selectedCliente
  );

  const handleEdit = (tramo: Tramo) => {
    formModal.openEdit(tramo);
  };

  const handleView = (tramo: Tramo) => {
    detailModal.openView(tramo);
  };

  const handleDelete = (tramo: Tramo) => {
    deleteModal.openDelete(tramo);
  };

  const confirmDelete = async () => {
    if (!deleteModal.selectedItem) return;
    
    try {
      await tramoService.delete(deleteModal.selectedItem._id);
      notifications.show({
        title: 'Éxito',
        message: 'Tramo eliminado correctamente',
        color: 'green'
      });
      loadData();
      deleteModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar tramo',
        color: 'red'
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (formModal.selectedItem) {
        await tramoService.update(formModal.selectedItem._id, data);
        notifications.show({
          title: 'Éxito',
          message: 'Tramo actualizado correctamente',
          color: 'green'
        });
      } else {
        await tramoService.create(data);
        notifications.show({
          title: 'Éxito',
          message: 'Tramo creado correctamente',
          color: 'green'
        });
      }
      loadData();
      formModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar tramo',
        color: 'red'
      });
    }
  };

  const handleImportComplete = async (result: any) => {
    importModal.close();
    excelOperations.handleImportComplete(result);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCliente('');
    setSelectedOrigen('');
    setSelectedDestino('');
  };

  const getTarifaStatus = (tramo: Tramo) => {
    // Usar campos del nivel raíz (desde el backend) o del objeto tarifaVigente como fallback
    const tipo = tramo.tipo || tramo.tarifaVigente?.tipo;
    const metodoCalculo = tramo.metodoCalculo || tramo.tarifaVigente?.metodoCalculo;
    const valor = tramo.valor || tramo.tarifaVigente?.valor;
    const valorPeaje = tramo.valorPeaje || tramo.tarifaVigente?.valorPeaje;
    const vigenciaDesde = tramo.vigenciaDesde || tramo.tarifaVigente?.vigenciaDesde;
    const vigenciaHasta = tramo.vigenciaHasta || tramo.tarifaVigente?.vigenciaHasta;
    
    if (!tipo || !metodoCalculo || valor === undefined) {
      return <Badge color="red" size="sm">Sin tarifa</Badge>;
    }
    
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };
    
    const isExpired = vigenciaHasta && new Date(vigenciaHasta) < new Date();
    const isExpiringSoon = vigenciaHasta && 
      new Date(vigenciaHasta) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    
    return (
      <Stack gap="xs">
        <Group gap="xs">
          <Badge color="blue" size="sm">{tipo}</Badge>
          <Badge color="green" size="sm">{metodoCalculo}</Badge>
          <Text size="sm" fw={500}>${valor}</Text>
          {valorPeaje && valorPeaje > 0 && (
            <Text size="sm" fw={500} c="orange">Peaje: ${valorPeaje}</Text>
          )}
        </Group>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Desde: {formatDate(vigenciaDesde)}
          </Text>
          <Text 
            size="xs" 
            c={isExpired ? "red" : isExpiringSoon ? "orange" : "dimmed"}
            fw={isExpired || isExpiringSoon ? 500 : 400}
          >
            Hasta: {formatDate(vigenciaHasta)}
            {isExpired && ' (VENCIDA)'}
            {isExpiringSoon && !isExpired && ' (Próx. vencimiento)'}
          </Text>
        </Stack>
      </Stack>
    );
  };

  const columns = [
    {
      key: 'ruta',
      label: 'Ruta',
      render: (tramo: Tramo) => {
        if (!tramo || !tramo.origen || !tramo.destino) {
          return <Text size="sm" c="dimmed">Datos incompletos</Text>;
        }
        return (
          <Stack gap="xs">
            <Group gap="xs">
              <IconMapPin size={16} color="green" />
              <Text size="sm" fw={500}>{tramo.origen.nombre}</Text>
            </Group>
            <Group gap="xs" ml="md">
              <IconRoad size={16} color="gray" />
              <Text size="xs" c="dimmed">{tramo.distancia} km</Text>
            </Group>
            <Group gap="xs">
              <IconMapPin size={16} color="red" />
              <Text size="sm" fw={500}>{tramo.destino.nombre}</Text>
            </Group>
          </Stack>
        );
      }
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (tramo: Tramo) => {
        if (!tramo || !tramo.cliente) {
          return <Text size="sm" c="dimmed">Sin cliente</Text>;
        }
        return <Text size="sm" fw={500}>{tramo.cliente.nombre}</Text>;
      }
    },
    {
      key: 'tarifa',
      label: 'Tarifa Vigente',
      render: getTarifaStatus
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (tramo: Tramo) => (
        <Menu withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEdit size={16} />}
              onClick={() => handleEdit(tramo)}
            >
              Editar
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconHistory size={16} />}
              onClick={() => handleView(tramo)}
            >
              Ver detalle
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconMap size={16} />}
              onClick={() => {/* TODO: Ver en mapa */}}
            >
              Ver en mapa
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => handleDelete(tramo)}
            >
              Eliminar
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )
    }
  ];

  const renderTramoCard = (tramo: Tramo) => (
    <Card key={tramo._id} shadow="sm" padding="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconRoute size={20} />
          <Text fw={500}>{tramo.cliente.nombre}</Text>
        </Group>
        {getTarifaStatus(tramo)}
      </Group>
      
      <Stack gap="xs" mb="md">
        <Group gap="xs">
          <IconMapPin size={16} color="green" />
          <Text size="sm">{tramo.origen.nombre}</Text>
        </Group>
        <Group gap="xs" justify="center">
          <IconRoad size={16} />
          <Text size="xs" c="dimmed">{tramo.distancia} km</Text>
        </Group>
        <Group gap="xs">
          <IconMapPin size={16} color="red" />
          <Text size="sm">{tramo.destino.nombre}</Text>
        </Group>
      </Stack>

      <Group justify="space-between">
        <Button variant="light" size="xs" onClick={() => handleView(tramo)}>
          Ver detalle
        </Button>
        <Group gap="xs">
          <ActionIcon 
            variant="light" 
            onClick={() => handleEdit(tramo)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="light" 
            color="red"
            onClick={() => handleDelete(tramo)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );

  const tramosStats = {
    total: tramos.length,
    conTarifa: tramos.filter(t => t.tipo || t.tarifaVigente).length,
    sinTarifa: tramos.filter(t => !(t.tipo || t.tarifaVigente)).length
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Gestión de Tramos</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={loadData}
            loading={loading}
          >
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            leftSection={<IconUpload size={16} />}
            onClick={importModal.openCreate}
          >
            Importar
          </Button>
          
          <Button
            variant="outline"
            leftSection={<IconDownload size={16} />}
            onClick={() => {
              const filters = {
                search: searchTerm,
                cliente: selectedCliente,
                origen: selectedOrigen,
                destino: selectedDestino,
              };
              excelOperations.handleExport(filters);
            }}
            loading={excelOperations.isExporting}
          >
            Exportar
          </Button>
          
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={formModal.openCreate}
          >
            Nuevo Tramo
          </Button>
        </Group>
      </Group>

      {/* Filtros */}
      <Paper p="md" withBorder>
        <Grid>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <SearchInput
              placeholder="Buscar tramos..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              placeholder="Filtrar por cliente"
              value={selectedCliente}
              onChange={(value) => setSelectedCliente(value || '')}
              data={[
                { value: '', label: 'Todos los clientes' },
                ...clientes.map(c => ({ value: c._id, label: c.nombre }))
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select
              placeholder="Origen"
              value={selectedOrigen}
              onChange={(value) => setSelectedOrigen(value || '')}
              data={[
                { value: '', label: 'Cualquier origen' },
                ...sitesFiltered.map(s => ({ value: s._id, label: s.nombre }))
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Select
              placeholder="Destino"
              value={selectedDestino}
              onChange={(value) => setSelectedDestino(value || '')}
              data={[
                { value: '', label: 'Cualquier destino' },
                ...sitesFiltered.map(s => ({ value: s._id, label: s.nombre }))
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Group>
              <Button
                variant="outline"
                leftSection={<IconFilter size={16} />}
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tabs con estadísticas */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'todos')}>
        <Tabs.List>
          <Tabs.Tab value="todos">
            Todos ({tramosStats.total})
          </Tabs.Tab>
          <Tabs.Tab value="con-tarifa">
            Con Tarifa ({tramosStats.conTarifa})
          </Tabs.Tab>
          <Tabs.Tab value="sin-tarifa" color="red">
            Sin Tarifa ({tramosStats.sinTarifa})
          </Tabs.Tab>
          <Tabs.Tab value="calculadora" color="blue">
            Calculadora de Tarifas
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={activeTab}>
          {activeTab === 'calculadora' ? (
            <Stack gap="md">
              <TramosSelector
                onTramoSelect={(tramo) => tramo && formModal.openEdit(tramo)}
                selectedTramo={formModal.selectedItem}
              />
              
              {formModal.selectedItem && (
                <>
                  <TarifaCalculator 
                    tramoId={formModal.selectedItem._id}
                    tramo={formModal.selectedItem}
                    onCalculationChange={(result: any) => {
                      // Manejar resultado del cálculo
                      console.log('Resultado cálculo:', result);
                    }}
                  />
                  
                  <TarifaVersioning
                    tramoId={formModal.selectedItem._id}
                    onVersionSelect={(version) => {
                      // Manejar selección de versión
                      console.log('Versión seleccionada:', version);
                    }}
                  />
                </>
              )}
            </Stack>
          ) : (
            <Paper p="md" withBorder>
              <LoadingOverlay visible={loading} />
              
              {viewMode === 'list' ? (
                <>
                  <DataTable
                    data={filteredTramos}
                    columns={columns}
                    loading={loading}
                    emptyMessage="No se encontraron tramos"
                  />
                </>
              ) : (
                <Grid>
                  {filteredTramos.map(tramo => (
                    <Grid.Col key={tramo._id} span={{ base: 12, sm: 6, md: 4 }}>
                      {renderTramoCard(tramo)}
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Modal de formulario */}
      <Modal
        opened={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.selectedItem ? 'Editar Tramo' : 'Nuevo Tramo'}
        size="xl"
      >
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando formulario...</div>}>
          <TramoForm
            tramo={formModal.selectedItem as any}
            clientes={clientes}
            sites={sites as any}
            onSubmit={handleFormSubmit}
            onCancel={formModal.close}
          />
        </Suspense>
      </Modal>

      {/* Modal de detalle */}
      <Modal
        opened={detailModal.isOpen}
        onClose={detailModal.close}
        title="Detalle del Tramo"
        size="xl"
      >
        {detailModal.selectedItem && (
          <TramoDetail
            tramo={detailModal.selectedItem as any}
            onEdit={() => {
              detailModal.close();
              formModal.openEdit(detailModal.selectedItem!);
            }}
            onClose={detailModal.close}
          />
        )}
      </Modal>

      {/* Modal de importación Excel */}
      <ExcelImportModal
        opened={importModal.isOpen}
        onClose={importModal.close}
        title="Importar Tramos desde Excel"
        entityType="cliente"
        onImportComplete={handleImportComplete}
        processExcelFile={async (file: File) => {
          // Usar el sistema base de importación
          return await tramoExcelService.importFromExcel(file);
        }}
        validateExcelFile={async () => {
          // Validación básica de archivo
          return { valid: true };
        }}
        previewExcelFile={async () => {
          // Preview básico de archivo
          return { preview: [], headers: [] };
        }}
        getTemplate={async () => {
          const blob = await tramoExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_tramos.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />

      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        title="Eliminar Tramo"
        message={
          deleteModal.selectedItem 
            ? `¿Estás seguro de que deseas eliminar el tramo ${deleteModal.selectedItem.origen.nombre} → ${deleteModal.selectedItem.destino.nombre}?`
            : ''
        }
        confirmLabel="Eliminar"
        type="delete"
      />
    </Stack>
  );
};

export default TramosPage;