import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Checkbox,
  Table,
  Badge,
  TextInput,
  NumberInput,
  Alert,
  ActionIcon,
  Tooltip,
  ScrollArea
} from '@mantine/core';
import {
  IconSearch,
  IconCurrencyDollar,
  IconInfoCircle,
  IconEye,
  IconMapPin,
  IconCalendar
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EstadoPartidaIndicator } from '../indicators/EstadoPartidaIndicator';
import type { Viaje } from '../../types/viaje';
import type { ViajeItem } from '../../types/ordenCompra';
import { getOrigenText, getDestinoText, normalizeEstadoPartida } from '../../utils/viajeHelpers';

interface ViajeAssignerProps {
  opened: boolean;
  onClose: () => void;
  clienteId: string;
  viajesDisponibles: Viaje[];
  viajesExcluidos: string[];
  onAssign: (viajes: ViajeItem[]) => void;
}

export function ViajeAssigner({
  opened,
  onClose,
  clienteId,
  viajesDisponibles,
  viajesExcluidos,
  onAssign
}: ViajeAssignerProps) {
  const [selectedViajes, setSelectedViajes] = useState<Set<string>>(new Set());
  const [importes, setImportes] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredViajes, setFilteredViajes] = useState<Viaje[]>([]);

  useEffect(() => {
    const available = viajesDisponibles.filter(viaje => 
      !viajesExcluidos.includes(viaje._id)
    );
    
    const filtered = available.filter(viaje => {
      const searchLower = searchTerm.toLowerCase();
      return (
        viaje.numeroViaje?.toString().toLowerCase().includes(searchLower) ||
        viaje.dt?.toString().toLowerCase().includes(searchLower) ||
        getOrigenText(viaje).toLowerCase().includes(searchLower) ||
        getDestinoText(viaje).toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredViajes(filtered);
  }, [viajesDisponibles, viajesExcluidos, searchTerm]);

  const handleViajeSelect = (viajeId: string, checked: boolean) => {
    const newSelected = new Set(selectedViajes);
    if (checked) {
      newSelected.add(viajeId);
      // Setear el importe por defecto al total del viaje
      const viaje = viajesDisponibles.find(v => v._id === viajeId);
      if (viaje) {
        setImportes(prev => new Map(prev).set(viajeId, viaje.total));
      }
    } else {
      newSelected.delete(viajeId);
      setImportes(prev => {
        const newMap = new Map(prev);
        newMap.delete(viajeId);
        return newMap;
      });
    }
    setSelectedViajes(newSelected);
  };

  const handleImporteChange = (viajeId: string, importe: number) => {
    setImportes(prev => new Map(prev).set(viajeId, importe));
  };

  const handleAssign = () => {
    if (selectedViajes.size === 0) {
      notifications.show({
        title: 'Error',
        message: 'Debe seleccionar al menos un viaje',
        color: 'red'
      });
      return;
    }

    const viajesItems: ViajeItem[] = Array.from(selectedViajes).map(viajeId => ({
      viaje: viajeId,
      importe: importes.get(viajeId) || 0
    }));

    const invalidViajes = viajesItems.filter(item => item.importe <= 0);
    if (invalidViajes.length > 0) {
      notifications.show({
        title: 'Error',
        message: 'Todos los viajes deben tener un importe mayor a 0',
        color: 'red'
      });
      return;
    }

    onAssign(viajesItems);
    setSelectedViajes(new Set());
    setImportes(new Map());
    setSearchTerm('');
  };

  const handleCancel = () => {
    setSelectedViajes(new Set());
    setImportes(new Map());
    setSearchTerm('');
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getTotalSelected = () => {
    return Array.from(selectedViajes).reduce((total, viajeId) => {
      return total + (importes.get(viajeId) || 0);
    }, 0);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title="Asignar Viajes a Orden de Compra"
      size="xl"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {/* Search */}
        <TextInput
          placeholder="Buscar por número, origen o destino..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        {/* Info */}
        {filteredViajes.length === 0 ? (
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            {viajesDisponibles.length === 0 
              ? 'No hay viajes disponibles para este cliente'
              : searchTerm 
                ? 'No se encontraron viajes con los criterios de búsqueda'
                : 'Todos los viajes ya están asignados a esta orden de compra'
            }
          </Alert>
        ) : (
          <Text size="sm" c="dimmed">
            Mostrando {filteredViajes.length} viajes disponibles
          </Text>
        )}

        {/* Viajes Table */}
        {filteredViajes.length > 0 && (
          <ScrollArea h={400}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Selec.</Table.Th>
                  <Table.Th>Viaje</Table.Th>
                  <Table.Th>Ruta</Table.Th>
                  <Table.Th>Total Original</Table.Th>
                  <Table.Th>Importe OC</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Info</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredViajes.map((viaje) => {
                  const isSelected = selectedViajes.has(viaje._id);
                  const importe = importes.get(viaje._id) || viaje.total;
                  
                  return (
                    <Table.Tr key={viaje._id}>
                      <Table.Td>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleViajeSelect(viaje._id, e.currentTarget.checked)}
                        />
                      </Table.Td>
                      
                      <Table.Td>
                        <div>
                          <Text size="sm" fw={500}>
                            {viaje.numeroViaje}
                          </Text>
                          <Text size="xs" c="dimmed">
                            <IconCalendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {formatDate(viaje.fecha)}
                          </Text>
                        </div>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap={4} align="center">
                          <IconMapPin size={12} />
                          <Text size="sm">
                            {getOrigenText(viaje)} → {getDestinoText(viaje)}
                          </Text>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {formatCurrency(viaje.total)}
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        {isSelected ? (
                          <NumberInput
                            value={importe}
                            onChange={(value) => handleImporteChange(viaje._id, Number(value) || 0)}
                            min={0}
                            decimalScale={2}
                            fixedDecimalScale
                            thousandSeparator
                            leftSection={<IconCurrencyDollar size={14} />}
                            w={140}
                            size="sm"
                          />
                        ) : (
                          <Text size="sm" c="dimmed">
                            {formatCurrency(viaje.total)}
                          </Text>
                        )}
                      </Table.Td>
                      
                      <Table.Td>
                        <EstadoPartidaIndicator
                          estado={normalizeEstadoPartida(viaje.estadoPartida)}
                          totalViaje={viaje.total}
                          totalCobrado={viaje.totalCobrado || 0}
                          size="xs"
                        />
                      </Table.Td>
                      
                      <Table.Td>
                        <Tooltip label="Ver detalles del viaje">
                          <ActionIcon variant="light" size="sm">
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {/* Summary */}
        {selectedViajes.size > 0 && (
          <Alert color="blue" icon={<IconInfoCircle size={16} />}>
            <Group justify="space-between">
              <Text size="sm">
                {selectedViajes.size} viajes seleccionados
              </Text>
              <Text size="sm" fw={600}>
                Total: {formatCurrency(getTotalSelected())}
              </Text>
            </Group>
          </Alert>
        )}

        {/* Actions */}
        <Group justify="flex-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedViajes.size === 0}
          >
            Asignar {selectedViajes.size} Viajes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}