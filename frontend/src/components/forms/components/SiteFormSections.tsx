import {
  TextInput,
  Select,
  NumberInput,
  Switch,
  Paper,
  Text,
  Group,
  Stack,
  Button,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import { IconMapPin, IconSearch, IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';
import { Cliente } from '../../../types';
import { openGoogleMaps } from '../helpers/siteHelpers';
import { PROVINCIAS_ARGENTINA } from '../constants/siteConstants';
import type { UseFormReturnType } from '@mantine/form';
import type { CreateSiteData } from '../../../services/siteService';

interface InformacionBasicaSectionProps {
  form: UseFormReturnType<CreateSiteData>;
  clientes: Cliente[];
  loadingClientes: boolean;
}

export function InformacionBasicaSection({
  form,
  clientes,
  loadingClientes,
}: InformacionBasicaSectionProps) {
  return (
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
  );
}

interface UbicacionSectionProps {
  form: UseFormReturnType<CreateSiteData>;
  geocoding: boolean;
  onGeocode: () => void;
  validCoordinates: boolean;
}

export function UbicacionSection({
  form,
  geocoding,
  onGeocode,
  validCoordinates,
}: UbicacionSectionProps) {
  return (
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
            onClick={onGeocode}
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

        <CoordenadasSection form={form} validCoordinates={validCoordinates} />

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Use el botón &quot;Geocodificar&quot; para obtener automáticamente las coordenadas de la
            dirección, o ingrese las coordenadas manualmente si conoce la ubicación exacta.
          </Text>
        </Alert>
      </Stack>
    </Paper>
  );
}

interface CoordenadasSectionProps {
  form: UseFormReturnType<CreateSiteData>;
  validCoordinates: boolean;
}

function CoordenadasSection({ form, validCoordinates }: CoordenadasSectionProps) {
  return (
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
  );
}
