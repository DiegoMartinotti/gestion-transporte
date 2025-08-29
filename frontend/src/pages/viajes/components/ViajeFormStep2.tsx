import { Stack, Group, Button, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { VehiculoSelector } from '../../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../../components/selectors/PersonalSelector';
import { ViajeFormData } from '../../../types/viaje';

interface ViajeFormStep2Props {
  form: UseFormReturnType<ViajeFormData>;
}

interface VehiculosSectionProps {
  form: UseFormReturnType<ViajeFormData>;
}

interface ChoferesSectionProps {
  form: UseFormReturnType<ViajeFormData>;
}

const VehiculosSection = ({ form }: VehiculosSectionProps) => {
  const addVehiculo = () => {
    const currentVehiculos = form.values.vehiculos || [];
    form.setFieldValue('vehiculos', [...currentVehiculos, '']);
  };

  const removeVehiculo = (index: number) => {
    const currentVehiculos = form.values.vehiculos || [];
    form.setFieldValue('vehiculos', currentVehiculos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Group justify="space-between" mb="sm">
        <Text fw={500}>Vehículos</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size="0.8rem" />}
          onClick={addVehiculo}
        >
          Agregar Vehículo
        </Button>
      </Group>

      <Stack>
        {(form.values.vehiculos || []).map((vehiculo, index) => (
          <Group key={index}>
            <VehiculoSelector
              value={vehiculo}
              onChange={(value) => form.setFieldValue(`vehiculos.${index}`, value || '')}
              style={{ flex: 1 }}
              placeholder="Seleccionar vehículo"
            />
            {form.values.vehiculos.length > 1 && (
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => removeVehiculo(index)}
              >
                <IconTrash size="0.8rem" />
              </Button>
            )}
          </Group>
        ))}

        {form.values.vehiculos.length === 0 && (
          <Text c="dimmed" size="sm">
            No hay vehículos asignados. Haga clic en &quot;Agregar Vehículo&quot; para asignar uno.
          </Text>
        )}
      </Stack>
    </div>
  );
};

const ChoferesSection = ({ form }: ChoferesSectionProps) => {
  const addChofer = () => {
    const currentChoferes = form.values.choferes || [];
    form.setFieldValue('choferes', [...currentChoferes, '']);
  };

  const removeChofer = (index: number) => {
    const currentChoferes = form.values.choferes || [];
    form.setFieldValue('choferes', currentChoferes.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Group justify="space-between" mb="sm">
        <Text fw={500}>Choferes</Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size="0.8rem" />}
          onClick={addChofer}
        >
          Agregar Chofer
        </Button>
      </Group>

      <Stack>
        {(form.values.choferes || []).map((chofer, index) => (
          <Group key={index}>
            <PersonalSelector
              value={chofer}
              onChange={(value) => form.setFieldValue(`choferes.${index}`, value || '')}
              style={{ flex: 1 }}
              placeholder="Seleccionar chofer"
            />
            {form.values.choferes.length > 1 && (
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => removeChofer(index)}
              >
                <IconTrash size="0.8rem" />
              </Button>
            )}
          </Group>
        ))}

        {form.values.choferes.length === 0 && (
          <Text c="dimmed" size="sm">
            No hay choferes asignados. Haga clic en &quot;Agregar Chofer&quot; para asignar uno.
          </Text>
        )}
      </Stack>
    </div>
  );
};

export const ViajeFormStep2 = ({ form }: ViajeFormStep2Props) => {
  return (
    <Stack>
      <VehiculosSection form={form} />
      <ChoferesSection form={form} />
    </Stack>
  );
};