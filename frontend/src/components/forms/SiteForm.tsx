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
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMapPin, IconSearch, IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';
import { Site, Cliente } from '../../types';
import { CreateSiteData } from '../../services/siteService';
import {
  siteValidationRules,
  getInitialValues,
  hasValidCoordinates,
} from './validation/siteValidation';
import { loadClientes, geocodeAddress, submitSite, openGoogleMaps } from './helpers/siteHelpers';
import { PROVINCIAS_ARGENTINA } from './constants/siteConstants';

interface SiteFormProps {
  site?: Site;
  onSubmit: (site: Site) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SiteForm({ site, onSubmit, onCancel, loading = false }: SiteFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  const form = useForm<CreateSiteData>({
    initialValues: getInitialValues(site),
    validate: siteValidationRules,
  });

  useEffect(() => {
    loadClientes(setClientes, setLoadingClientes);
  }, []);

  const handleGeocodeAddress = async () => {
    setGeocoding(true);
    const coords = await geocodeAddress(
      form.values.direccion,
      form.values.ciudad,
      form.values.provincia,
      form.values.pais
    );
    if (coords) {
      form.setFieldValue('coordenadas', coords);
    }
    setGeocoding(false);
  };

  const handleSubmit = (values: CreateSiteData) => {
    submitSite(values, site, onSubmit);
  };

  const validCoordinates = hasValidCoordinates(form.values.coordenadas);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Información básica */}
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text fw={600} size="lg">
                Información Básica
              </Text>

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
                data={clientes.map((cliente) => ({
                  value: cliente._id,
                  label: cliente.nombre,
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
                <Text fw={600} size="lg">
                  Ubicación
                </Text>
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
              <Paper p="sm" withBorder radius="sm" bg={validCoordinates ? 'green.0' : 'gray.0'}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500} size="sm">
                      Coordenadas GPS
                    </Text>
                    {validCoordinates ? (
                      <Group gap={4}>
                        <IconCheck size={16} color="green" />
                        <Text size="xs" c="green">
                          Válidas
                        </Text>
                      </Group>
                    ) : (
                      <Group gap={4}>
                        <IconX size={16} color="red" />
                        <Text size="xs" c="red">
                          Requeridas
                        </Text>
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
                    {validCoordinates && (
                      <Tooltip label="Ver en Google Maps">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          style={{ marginTop: 24 }}
                          onClick={() => {
                            const coords = form.values.coordenadas;
                            if (coords) {
                              openGoogleMaps(coords.lat, coords.lng);
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

              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="sm">
                  Use el botón &quot;Geocodificar&quot; para obtener automáticamente las coordenadas
                  de la dirección, o ingrese las coordenadas manualmente si conoce la ubicación
                  exacta.
                </Text>
              </Alert>
            </Stack>
          </Paper>

          {/* Botones de acción */}
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={!validCoordinates}>
              {site ? 'Actualizar' : 'Crear'} Site
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
