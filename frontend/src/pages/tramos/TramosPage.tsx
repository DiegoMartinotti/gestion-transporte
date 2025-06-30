import React, { useState, useEffect } from 'react';
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
  IconMap
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import DataTable from '../../components/base/DataTable';
import SearchInput from '../../components/base/SearchInput';
import { tramoService } from '../../services/tramoService';
import { clienteService } from '../../services/clienteService';
import { siteService } from '../../services/siteService';
import TramoForm from '../../components/forms/TramoForm';
import TramoDetail from '../../components/details/TramoDetail';
import ConfirmModal from '../../components/base/ConfirmModal';

interface Tramo {
  _id: string;
  origen: {
    _id: string;
    nombre: string;
    direccion: string;
  };
  destino: {
    _id: string;
    nombre: string;
    direccion: string;
  };
  cliente: {
    _id: string;
    nombre: string;
  };
  distancia: number;
  // Campos de la tarifa vigente a nivel raíz (desde el backend)
  tipo?: 'TRMC' | 'TRMI';
  metodoCalculo?: 'Kilometro' | 'Palet' | 'Fijo';
  valor?: number;
  valorPeaje?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  // Arrays y objetos opcionales
  tarifasHistoricas?: Array<{
    _id: string;
    tipo: 'TRMC' | 'TRMI';
    metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
    valor: number;
    valorPeaje: number;
    vigenciaDesde: string;
    vigenciaHasta: string;
  }>;
  tarifaVigente?: {
    tipo: 'TRMC' | 'TRMI';
    metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
    valor: number;
    valorPeaje: number;
    vigenciaDesde: string;
    vigenciaHasta: string;
  };
  originalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Cliente {
  _id: string;
  nombre: string;
}

interface LocalSite {
  _id: string;
  nombre: string;
  cliente: string;
}

const TramosPage: React.FC = () => {
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sites, setSites] = useState<LocalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedOrigen, setSelectedOrigen] = useState<string>('');
  const [selectedDestino, setSelectedDestino] = useState<string>('');
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);
  const [activeTab, setActiveTab] = useState('todos');
  const [viewMode] = useState<'list' | 'cards'>('list');

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure();
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure();
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure();

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tramosData, clientesData, sitesData] = await Promise.all([
        tramoService.getAll(),
        clienteService.getAll(),
        siteService.getAll()
      ]);
      
      const processedTramos = Array.isArray(tramosData) ? tramosData : (tramosData as any)?.data || [];
      console.log('Datos de tramos recibidos:', processedTramos.length, 'tramos');
      setTramos(processedTramos);
      setClientes(Array.isArray(clientesData) ? clientesData : clientesData.data);
      setSites((Array.isArray(sitesData) ? sitesData : sitesData.data).map((site: any) => ({
        _id: site._id,
        nombre: site.nombre,
        cliente: typeof site.cliente === 'string' ? site.cliente : site.cliente._id
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar datos',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tramos
  const filteredTramos = tramos.filter(tramo => {
    // Validar que el tramo tenga las propiedades necesarias
    if (!tramo || !tramo.origen || !tramo.destino || !tramo.cliente) {
      console.log('Tramo filtrado por datos incompletos:', tramo);
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
  
  console.log('Tramos filtrados:', filteredTramos.length, 'de', tramos.length);

  // Sites filtrados por cliente seleccionado
  const sitesFiltered = sites.filter(site => 
    selectedCliente === '' || site.cliente === selectedCliente
  );

  const handleEdit = (tramo: Tramo) => {
    setSelectedTramo(tramo);
    openForm();
  };

  const handleView = (tramo: Tramo) => {
    setSelectedTramo(tramo);
    openDetail();
  };

  const handleDelete = (tramo: Tramo) => {
    setSelectedTramo(tramo);
    openDelete();
  };

  const confirmDelete = async () => {
    if (!selectedTramo) return;
    
    try {
      await tramoService.delete(selectedTramo._id);
      notifications.show({
        title: 'Éxito',
        message: 'Tramo eliminado correctamente',
        color: 'green'
      });
      loadData();
      closeDelete();
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
      if (selectedTramo) {
        await tramoService.update(selectedTramo._id, data);
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
      closeForm();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar tramo',
        color: 'red'
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCliente('');
    setSelectedOrigen('');
    setSelectedDestino('');
  };

  const getTarifaStatus = (value: any, tramo: Tramo) => {
    // Usar campos del nivel raíz (desde el backend) o del objeto tarifaVigente como fallback
    const tipo = tramo.tipo || tramo.tarifaVigente?.tipo;
    const metodoCalculo = tramo.metodoCalculo || tramo.tarifaVigente?.metodoCalculo;
    const valor = tramo.valor || tramo.tarifaVigente?.valor;
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
      render: (value: any, tramo: Tramo) => {
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
      render: (value: any, tramo: Tramo) => {
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
        {getTarifaStatus(null, tramo)}
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
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setSelectedTramo(null);
              openForm();
            }}
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
        </Tabs.List>

        <Tabs.Panel value={activeTab}>
          <Paper p="md" withBorder>
            <LoadingOverlay visible={loading} />
            
            {viewMode === 'list' ? (
              <DataTable
                data={filteredTramos}
                columns={columns}
                loading={loading}
                emptyMessage="No se encontraron tramos"
              />
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
        </Tabs.Panel>
      </Tabs>

      {/* Modal de formulario */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={selectedTramo ? 'Editar Tramo' : 'Nuevo Tramo'}
        size="xl"
      >
        <TramoForm
          tramo={selectedTramo as any}
          clientes={clientes}
          sites={sites as any}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      </Modal>

      {/* Modal de detalle */}
      <Modal
        opened={detailOpened}
        onClose={closeDetail}
        title="Detalle del Tramo"
        size="xl"
      >
        {selectedTramo && (
          <TramoDetail
            tramo={selectedTramo as any}
            onEdit={() => {
              closeDetail();
              openForm();
            }}
            onClose={closeDetail}
          />
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        opened={deleteOpened}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Eliminar Tramo"
        message={
          selectedTramo 
            ? `¿Estás seguro de que deseas eliminar el tramo ${selectedTramo.origen.nombre} → ${selectedTramo.destino.nombre}?`
            : ''
        }
        confirmLabel="Eliminar"
        type="delete"
      />
    </Stack>
  );
};

export default TramosPage;