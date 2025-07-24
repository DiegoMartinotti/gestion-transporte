import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Title,
  Select,
  Group,
  Card,
  Text,
  Badge,
  Stack,
  Alert
} from '@mantine/core';
import { IconRoute, IconMapPin } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { tramoService } from '../../services/tramoService';
import { Tramo, TramoSite } from '../../types';

interface TramosSelectorProps {
  onTramoSelect: (tramo: Tramo | null) => void;
  selectedTramo?: Tramo | null;
}

export const TramosSelector: React.FC<TramosSelectorProps> = ({
  onTramoSelect,
  selectedTramo
}) => {
  const [selectedOrigen, setSelectedOrigen] = useState<string>('');
  const [selectedDestino, setSelectedDestino] = useState<string>('');

  // Cargar todos los tramos
  const { data: tramos = [], isLoading } = useQuery({
    queryKey: ['tramos'],
    queryFn: () => tramoService.getAll(),
    select: (data) => {
      const processedTramos = Array.isArray(data) ? data : (data as any)?.data || [];
      return processedTramos.filter((tramo: Tramo) => tramo.activo !== false);
    }
  });

  // Obtener lista única de orígenes
  const origenes = useMemo(() => {
    const uniqueOrigenes = new Map<string, TramoSite>();
    tramos.forEach((tramo: Tramo) => {
      if (tramo.origen) {
        uniqueOrigenes.set(tramo.origen._id, tramo.origen);
      }
    });
    return Array.from(uniqueOrigenes.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tramos]);

  // Obtener destinos disponibles para el origen seleccionado
  const destinosDisponibles = useMemo(() => {
    if (!selectedOrigen) return [];
    
    const uniqueDestinos = new Map<string, TramoSite>();
    tramos
      .filter((tramo: Tramo) => tramo.origen?._id === selectedOrigen)
      .forEach((tramo: Tramo) => {
        if (tramo.destino) {
          uniqueDestinos.set(tramo.destino._id, tramo.destino);
        }
      });
    
    return Array.from(uniqueDestinos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tramos, selectedOrigen]);

  // Obtener tramo específico basado en origen y destino
  const tramoSeleccionado = useMemo(() => {
    if (!selectedOrigen || !selectedDestino) return null;
    
    return tramos.find((tramo: Tramo) => 
      tramo.origen?._id === selectedOrigen && 
      tramo.destino?._id === selectedDestino
    ) || null;
  }, [tramos, selectedOrigen, selectedDestino]);

  // Efecto para notificar cambios al componente padre
  useEffect(() => {
    onTramoSelect(tramoSeleccionado);
  }, [tramoSeleccionado, onTramoSelect]);

  // Limpiar destino cuando cambia el origen
  const handleOrigenChange = (origenId: string | null) => {
    setSelectedOrigen(origenId || '');
    setSelectedDestino(''); // Limpiar destino
  };

  const handleDestinoChange = (destinoId: string | null) => {
    setSelectedDestino(destinoId || '');
  };

  // Sincronizar con tramo seleccionado externamente
  useEffect(() => {
    if (selectedTramo) {
      setSelectedOrigen(selectedTramo.origen?._id || '');
      setSelectedDestino(selectedTramo.destino?._id || '');
    }
  }, [selectedTramo]);

  if (isLoading) {
    return (
      <Paper p="md" withBorder>
        <Text>Cargando tramos...</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">
        <Group gap="xs">
          <IconRoute size={20} />
          Selección de Ruta
        </Group>
      </Title>

      <Stack gap="md">
        {/* Selector de Origen */}
        <Select
          label="Origen"
          placeholder="Seleccione el punto de origen"
          value={selectedOrigen}
          onChange={handleOrigenChange}
          data={origenes.map(origen => ({
            value: origen._id,
            label: origen.nombre
          }))}
          leftSection={<IconMapPin size={16} color="green" />}
          searchable
          clearable
        />

        {/* Selector de Destino */}
        <Select
          label="Destino"
          placeholder={selectedOrigen ? "Seleccione el punto de destino" : "Primero seleccione un origen"}
          value={selectedDestino}
          onChange={handleDestinoChange}
          data={destinosDisponibles.map(destino => ({
            value: destino._id,
            label: destino.nombre
          }))}
          leftSection={<IconMapPin size={16} color="red" />}
          disabled={!selectedOrigen}
          searchable
          clearable
        />

        {/* Información del tramo seleccionado */}
        {tramoSeleccionado && (
          <Card withBorder p="sm">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500} size="sm">Tramo Seleccionado</Text>
                <Badge color="green" size="sm">Activo</Badge>
              </Group>
              
              <Group gap="xs">
                <IconMapPin size={14} color="green" />
                <Text size="sm">{tramoSeleccionado.origen.nombre}</Text>
                <Text size="sm" c="dimmed">→</Text>
                <IconMapPin size={14} color="red" />
                <Text size="sm">{tramoSeleccionado.destino.nombre}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Cliente:</Text>
                <Text size="xs" fw={500}>{tramoSeleccionado.cliente.nombre}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Distancia:</Text>
                <Text size="xs" fw={500}>{tramoSeleccionado.distancia || 0} km</Text>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Información de destinos disponibles */}
        {selectedOrigen && destinosDisponibles.length > 0 && !selectedDestino && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              Destinos disponibles desde <strong>{origenes.find(o => o._id === selectedOrigen)?.nombre}</strong>: {destinosDisponibles.length}
            </Text>
          </Alert>
        )}

        {/* Sin destinos disponibles */}
        {selectedOrigen && destinosDisponibles.length === 0 && (
          <Alert color="orange" variant="light">
            <Text size="sm">
              No hay destinos disponibles desde <strong>{origenes.find(o => o._id === selectedOrigen)?.nombre}</strong>
            </Text>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};