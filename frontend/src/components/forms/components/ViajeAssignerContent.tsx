import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Checkbox,
  Table,
  TextInput,
  NumberInput,
  Alert,
  ActionIcon,
  Tooltip,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconCurrencyDollar,
  IconInfoCircle,
  IconEye,
  IconMapPin,
  IconCalendar,
} from '@tabler/icons-react';
import { EstadoPartidaIndicator } from '../../indicators/EstadoPartidaIndicator';
import type { Viaje } from '../../../types/viaje';
import { getOrigenText, getDestinoText, normalizeEstadoPartida } from '../../../utils/viajeHelpers';

interface ViajeAssignerContentProps {
  opened: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredViajes: Viaje[];
  viajesDisponibles: Viaje[];
  selectedViajes: Set<string>;
  importes: Map<string, number>;
  handleViajeSelect: (viajeId: string, checked: boolean) => void;
  handleImporteChange: (viajeId: string, importe: number) => void;
  handleCancel: () => void;
  handleAssign: () => void;
  getTotalSelected: () => number;
}

export function ViajeAssignerContent({
  opened,
  searchTerm,
  setSearchTerm,
  filteredViajes,
  viajesDisponibles,
  selectedViajes,
  importes,
  handleViajeSelect,
  handleImporteChange,
  handleCancel,
  handleAssign,
  getTotalSelected,
}: ViajeAssignerContentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
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
        <TextInput
          placeholder="Buscar por número, origen o destino..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        <ViajesList
          filteredViajes={filteredViajes}
          viajesDisponibles={viajesDisponibles}
          searchTerm={searchTerm}
          selectedViajes={selectedViajes}
          importes={importes}
          handleViajeSelect={handleViajeSelect}
          handleImporteChange={handleImporteChange}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        {selectedViajes.size > 0 && (
          <Alert color="blue" icon={<IconInfoCircle size={16} />}>
            <Group justify="space-between">
              <Text size="sm">{selectedViajes.size} viajes seleccionados</Text>
              <Text size="sm" fw={600}>
                Total: {formatCurrency(getTotalSelected())}
              </Text>
            </Group>
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={selectedViajes.size === 0}>
            Asignar {selectedViajes.size} Viajes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

interface ViajesListProps {
  filteredViajes: Viaje[];
  viajesDisponibles: Viaje[];
  searchTerm: string;
  selectedViajes: Set<string>;
  importes: Map<string, number>;
  handleViajeSelect: (viajeId: string, checked: boolean) => void;
  handleImporteChange: (viajeId: string, importe: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

function ViajesList({
  filteredViajes,
  viajesDisponibles,
  searchTerm,
  selectedViajes,
  importes,
  handleViajeSelect,
  handleImporteChange,
  formatCurrency,
  formatDate,
}: ViajesListProps) {
  if (filteredViajes.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        {getNoViajesMessage(viajesDisponibles.length, searchTerm)}
      </Alert>
    );
  }

  return (
    <>
      <Text size="sm" c="dimmed">
        Mostrando {filteredViajes.length} viajes disponibles
      </Text>
      <ViajesTable
        filteredViajes={filteredViajes}
        selectedViajes={selectedViajes}
        importes={importes}
        handleViajeSelect={handleViajeSelect}
        handleImporteChange={handleImporteChange}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </>
  );
}

function getNoViajesMessage(viajesDisponiblesCount: number, searchTerm: string): string {
  if (viajesDisponiblesCount === 0) {
    return 'No hay viajes disponibles para este cliente';
  }
  if (searchTerm) {
    return 'No se encontraron viajes con los criterios de búsqueda';
  }
  return 'Todos los viajes ya están asignados a esta orden de compra';
}

interface ViajesTableProps {
  filteredViajes: Viaje[];
  selectedViajes: Set<string>;
  importes: Map<string, number>;
  handleViajeSelect: (viajeId: string, checked: boolean) => void;
  handleImporteChange: (viajeId: string, importe: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

function ViajesTable({
  filteredViajes,
  selectedViajes,
  importes,
  handleViajeSelect,
  handleImporteChange,
  formatCurrency,
  formatDate,
}: ViajesTableProps) {
  return (
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
          {filteredViajes.map((viaje) => (
            <ViajeTableRow
              key={viaje._id}
              viaje={viaje}
              isSelected={selectedViajes.has(viaje._id)}
              importe={importes.get(viaje._id) || viaje.total}
              onSelect={handleViajeSelect}
              onImporteChange={handleImporteChange}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

interface ViajeTableRowProps {
  viaje: Viaje;
  isSelected: boolean;
  importe: number;
  onSelect: (viajeId: string, checked: boolean) => void;
  onImporteChange: (viajeId: string, importe: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

function ViajeTableRow({
  viaje,
  isSelected,
  importe,
  onSelect,
  onImporteChange,
  formatCurrency,
  formatDate,
}: ViajeTableRowProps) {
  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(viaje._id, e.currentTarget.checked)}
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
            onChange={(value) => onImporteChange(viaje._id, Number(value) || 0)}
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
}
