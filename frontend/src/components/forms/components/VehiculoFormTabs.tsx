import {
  TextInput,
  Select,
  NumberInput,
  Textarea,
  Switch,
  Stack,
  Grid,
  Tabs,
  Paper,
  Title,
} from '@mantine/core';
import { Empresa } from '../../../types';
import { TIPOS_VEHICULO } from '../constants/vehiculoConstants';
import type { UseFormReturnType } from '@mantine/form';
import type { Vehiculo } from '../../../types/vehiculo';

interface TabProps {
  form: UseFormReturnType<Vehiculo>;
}

interface DatosBasicosTabProps {
  form: UseFormReturnType<Vehiculo>;
  empresas: Empresa[];
}

export function DatosBasicosTab({ form, empresas }: DatosBasicosTabProps) {
  return (
    <Tabs.Panel value="basicos">
      <Stack gap="md">
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Dominio/Patente"
              placeholder="ABC123 o AB123CD"
              required
              {...form.getInputProps('dominio')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Tipo de Vehículo"
              data={TIPOS_VEHICULO.map((tipo) => ({ value: tipo, label: tipo }))}
              required
              {...form.getInputProps('tipo')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={4}>
            <TextInput
              label="Marca"
              placeholder="Scania, Mercedes, etc."
              {...form.getInputProps('marca')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Modelo"
              placeholder="R450, Actros, etc."
              {...form.getInputProps('modelo')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Año"
              placeholder="2020"
              min={1950}
              max={new Date().getFullYear() + 1}
              {...form.getInputProps('año')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Número de Chasis"
              placeholder="Número de chasis"
              {...form.getInputProps('numeroChasis')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Número de Motor"
              placeholder="Número de motor"
              {...form.getInputProps('numeroMotor')}
            />
          </Grid.Col>
        </Grid>

        <Select
          label="Empresa"
          placeholder="Seleccionar empresa"
          data={empresas.map((e) => ({ value: e._id || '', label: e.nombre }))}
          searchable
          required
          {...form.getInputProps('empresa')}
        />

        <Switch label="Vehículo activo" {...form.getInputProps('activo', { type: 'checkbox' })} />

        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales"
          rows={3}
          {...form.getInputProps('observaciones')}
        />
      </Stack>
    </Tabs.Panel>
  );
}

export function DocumentacionTab({ form }: TabProps) {
  return (
    <Tabs.Panel value="documentacion">
      <Stack gap="md">
        <Paper withBorder p="md">
          <Title order={5} mb="sm">
            Seguro
          </Title>
          <Grid>
            <Grid.Col span={4}>
              <TextInput
                label="Número de Póliza"
                {...form.getInputProps('documentacion.seguro.numero')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Compañía"
                {...form.getInputProps('documentacion.seguro.compania')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Vencimiento"
                placeholder="yyyy-mm-dd"
                type="date"
                {...form.getInputProps('documentacion.seguro.vencimiento')}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <Paper withBorder p="md">
          <Title order={5} mb="sm">
            VTV
          </Title>
          <Grid>
            <Grid.Col span={6}>
              <TextInput label="Número" {...form.getInputProps('documentacion.vtv.numero')} />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Vencimiento"
                placeholder="yyyy-mm-dd"
                type="date"
                {...form.getInputProps('documentacion.vtv.vencimiento')}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <Paper withBorder p="md">
          <Title order={5} mb="sm">
            Ruta
          </Title>
          <Grid>
            <Grid.Col span={6}>
              <TextInput label="Número" {...form.getInputProps('documentacion.ruta.numero')} />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Vencimiento"
                placeholder="yyyy-mm-dd"
                type="date"
                {...form.getInputProps('documentacion.ruta.vencimiento')}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <Paper withBorder p="md">
          <Title order={5} mb="sm">
            SENASA
          </Title>
          <Grid>
            <Grid.Col span={6}>
              <TextInput label="Número" {...form.getInputProps('documentacion.senasa.numero')} />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Vencimiento"
                placeholder="yyyy-mm-dd"
                type="date"
                {...form.getInputProps('documentacion.senasa.vencimiento')}
              />
            </Grid.Col>
          </Grid>
        </Paper>
      </Stack>
    </Tabs.Panel>
  );
}

export function CaracteristicasTab({ form }: TabProps) {
  return (
    <Tabs.Panel value="caracteristicas">
      <Stack gap="md">
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Capacidad de Carga (kg)"
              placeholder="0"
              min={0}
              {...form.getInputProps('caracteristicas.capacidadCarga')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Tara - Peso Vacío (kg)"
              placeholder="0"
              min={0}
              {...form.getInputProps('caracteristicas.tara')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label="Largo (m)"
              placeholder="0"
              min={0}
              step={0.1}
              decimalScale={2}
              {...form.getInputProps('caracteristicas.largo')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Ancho (m)"
              placeholder="0"
              min={0}
              step={0.1}
              decimalScale={2}
              {...form.getInputProps('caracteristicas.ancho')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Alto (m)"
              placeholder="0"
              min={0}
              step={0.1}
              decimalScale={2}
              {...form.getInputProps('caracteristicas.alto')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Configuración de Ejes"
              placeholder="4x2, 6x4, etc."
              {...form.getInputProps('caracteristicas.configuracionEjes')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Tipo de Carrocería"
              placeholder="Furgón, Plataforma, etc."
              {...form.getInputProps('caracteristicas.tipoCarroceria')}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Tabs.Panel>
  );
}
