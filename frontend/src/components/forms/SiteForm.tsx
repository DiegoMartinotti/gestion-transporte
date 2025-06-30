import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Group,
  Stack,
  TextInput,
  Select,
  NumberInput,
  Switch,
  Paper,
  Text,
  Alert,
  ActionIcon,
  Tooltip,
  LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconMapPin,
  IconSearch,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { Site, Cliente } from '../../types';
import { siteService, CreateSiteData } from '../../services/siteService';
import { clienteService } from '../../services/clienteService';

interface SiteFormProps {
  site?: Site;
  onSubmit: (site: Site) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PROVINCIAS_ARGENTINA = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
];

export default function SiteForm({ site, onSubmit, onCancel, loading = false }: SiteFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  const form = useForm<CreateSiteData>({
    initialValues: {
      nombre: site?.nombre || '',
      direccion: site?.direccion || '',
      ciudad: site?.localidad || '',
      provincia: site?.provincia || '',
      codigoPostal: '',
      pais: 'Argentina',
      cliente: typeof site?.cliente === 'string' ? site.cliente : site?.cliente?._id || '',
      coordenadas: site?.coordenadas || { lat: 0, lng: 0 },
      contacto: '',
      telefono: '',
      activo: true
    },
    validate: {
      nombre: (value) => (!value ? 'El nombre es requerido' : null),
      direccion: (value) => (!value ? 'La dirección es requerida' : null),
      ciudad: (value) => (!value ? 'La ciudad es requerida' : null),
      provincia: (value) => (!value ? 'La provincia es requerida' : null),
      pais: (value) => (!value ? 'El país es requerido' : null),
      cliente: (value) => (!value ? 'Debe seleccionar un cliente' : null),
      coordenadas: {
        lat: (value) => (value === 0 ? 'Las coordenadas son requeridas' : null),
        lng: (value) => (value === 0 ? 'Las coordenadas son requeridas' : null)
      }
    }
  });

  const loadClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await clienteService.getAll({ limit: 1000 });
      setClientes(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los clientes',
        color: 'red'
      });
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleGeocodeAddress = async () => {
    const { direccion, ciudad, provincia, pais } = form.values;
    const fullAddress = `${direccion}, ${ciudad}, ${provincia}, ${pais}`;

    if (!direccion || !ciudad) {
      notifications.show({
        title: 'Error',
        message: 'Ingrese al menos la dirección y ciudad para geocodificar',
        color: 'orange'
      });
      return;
    }

    try {
      setGeocoding(true);
      const coords = await siteService.geocodeAddress(fullAddress);
      
      form.setFieldValue('coordenadas', coords);
      
      notifications.show({
        title: 'Éxito',
        message: 'Coordenadas obtenidas correctamente',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron obtener las coordenadas de la dirección',
        color: 'red'
      });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (values: CreateSiteData) => {
    try {
      let result: Site;
      
      if (site) {
        result = await siteService.update(site._id, values);
        notifications.show({
          title: 'Éxito',
          message: 'Site actualizado correctamente',
          color: 'green'
        });
      } else {
        result = await siteService.create(values);
        notifications.show({
          title: 'Éxito',
          message: 'Site creado correctamente',
          color: 'green'
        });
      }
      
      onSubmit(result);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `No se pudo ${site ? 'actualizar' : 'crear'} el site`,
        color: 'red'
      });
    }
  };

  const hasValidCoordinates = form.values.coordenadas?.lat !== 0 && form.values.coordenadas?.lng !== 0;

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Información básica */}
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text fw={600} size="lg">Información Básica</Text>
              
              <TextInput
                label="Nombre del Site"
                placeholder="Ej: Depósito Central"
                required
                {...form.getInputProps('nombre')}
              />

              <Select
                label="Cliente"
                placeholder="Seleccionar cliente"
                required
                searchable
                nothingFoundMessage="No se encontraron clientes"
                data={clientes.map(cliente => ({
                  value: cliente._id,
                  label: cliente.nombre
                }))}
                {...form.getInputProps('cliente')}
                disabled={loadingClientes}
              />

              <Group>
                <TextInput
                  label="Contacto"
                  placeholder="Nombre del contacto"
                  {...form.getInputProps('contacto')}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Teléfono"
                  placeholder="11-1234-5678"
                  {...form.getInputProps('telefono')}
                  style={{ flex: 1 }}
                />
              </Group>

              <Switch
                label="Site activo"
                description="Permite crear tramos y asignar viajes"
                {...form.getInputProps('activo', { type: 'checkbox' })}
              />
            </Stack>
          </Paper>

          {/* Ubicación */}
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600} size="lg">Ubicación</Text>
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconSearch size={16} />}
                  onClick={handleGeocodeAddress}
                  loading={geocoding}
                  disabled={!form.values.direccion || !form.values.ciudad}
                >
                  Geocodificar
                </Button>
              </Group>

              <TextInput
                label="Dirección"
                placeholder="Av. Rivadavia 1234"
                required
                {...form.getInputProps('direccion')}
              />

              <Group>
                <TextInput
                  label="Ciudad"
                  placeholder="Buenos Aires"
                  required
                  {...form.getInputProps('ciudad')}
                  style={{ flex: 2 }}
                />
                <TextInput
                  label="Código Postal"
                  placeholder="1000"
                  {...form.getInputProps('codigoPostal')}
                  style={{ flex: 1 }}
                />
              </Group>

              <Group>
                <Select
                  label="Provincia"
                  placeholder="Seleccionar provincia"
                  required
                  searchable
                  data={PROVINCIAS_ARGENTINA}
                  {...form.getInputProps('provincia')}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="País"
                  placeholder="Argentina"
                  required
                  {...form.getInputProps('pais')}
                  style={{ flex: 1 }}
                />
              </Group>

              {/* Coordenadas */}
              <Paper p="sm" withBorder radius="sm" bg={hasValidCoordinates ? 'green.0' : 'gray.0'}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500} size="sm">Coordenadas GPS</Text>
                    {hasValidCoordinates ? (
                      <Group gap={4}>
                        <IconCheck size={16} color="green" />
                        <Text size="xs" c="green">Válidas</Text>
                      </Group>
                    ) : (
                      <Group gap={4}>
                        <IconX size={16} color="red" />
                        <Text size="xs" c="red">Requeridas</Text>
                      </Group>
                    )}
                  </Group>
                  
                  <Group>
                    <NumberInput
                      label="Latitud"
                      placeholder="-34.6037"
                      decimalScale={6}
                      step={0.000001}
                      {...form.getInputProps('coordenadas.lat')}
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      label="Longitud"
                      placeholder="-58.3816"
                      decimalScale={6}
                      step={0.000001}
                      {...form.getInputProps('coordenadas.lng')}
                      style={{ flex: 1 }}
                    />
                    {hasValidCoordinates && (
                      <Tooltip label="Ver en Google Maps">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          style={{ marginTop: 24 }}
                          onClick={() => {
                            const coords = form.values.coordenadas;
                            if (coords) {
                              const url = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
                              window.open(url, '_blank');
                            }
                          }}
                        >
                          <IconMapPin size={18} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Stack>
              </Paper>

              <Alert
                icon={<IconInfoCircle size={16} />}
                color="blue"
                variant="light"
              >
                <Text size="sm">
                  Use el botón "Geocodificar" para obtener automáticamente las coordenadas de la dirección,
                  o ingrese las coordenadas manualmente si conoce la ubicación exacta.
                </Text>
              </Alert>
            </Stack>
          </Paper>

          {/* Botones de acción */}
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              loading={loading}
              disabled={!hasValidCoordinates}
            >
              {site ? 'Actualizar' : 'Crear'} Site
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}