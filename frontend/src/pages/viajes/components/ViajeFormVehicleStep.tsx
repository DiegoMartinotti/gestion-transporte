import { Grid } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { VehiculoSelector } from '../../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../../components/selectors/PersonalSelector';
import { ViajeFormData } from '../../../types/viaje';

interface ViajeFormVehicleStepProps {
  form: UseFormReturnType<ViajeFormData>;
  getFormErrorAsString: (error: unknown) => string | undefined;
  isArrayValue: (value: unknown) => string[];
}

export function ViajeFormVehicleStep({
  form,
  getFormErrorAsString,
  isArrayValue,
}: ViajeFormVehicleStepProps) {
  return (
    <>
      <VehiculoSelector
        label="Vehículos"
        placeholder="Selecciona los vehículos"
        value={form.values.vehiculos}
        onChange={(value) => form.setFieldValue('vehiculos', isArrayValue(value))}
        multiple
        error={getFormErrorAsString(form.errors.vehiculos)}
        required
      />

      <Grid>
        <Grid.Col span={6}>
          <PersonalSelector
            label="Choferes"
            placeholder="Selecciona los choferes"
            value={form.values.choferes}
            onChange={(value) => form.setFieldValue('choferes', isArrayValue(value))}
            tipo="Conductor"
            multiple
            error={getFormErrorAsString(form.errors.choferes)}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <PersonalSelector
            label="Ayudantes"
            placeholder="Selecciona los ayudantes"
            value={form.values.ayudantes}
            onChange={(value) => form.setFieldValue('ayudantes', isArrayValue(value))}
            tipo="Ayudante"
            multiple
          />
        </Grid.Col>
      </Grid>
    </>
  );
}
