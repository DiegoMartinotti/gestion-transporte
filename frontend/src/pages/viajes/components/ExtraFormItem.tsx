import { Grid, Paper, TextInput, ActionIcon, NumberInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { ViajeFormData } from '../../../types/viaje';

interface ExtraFormItemProps {
  extra: {
    id: string;
    concepto: string;
    monto: number;
    descripcion: string;
  };
  index: number;
  form: UseFormReturnType<ViajeFormData>;
  handleRemoveExtra: (index: number) => void;
  getNumberValue: (value: unknown) => number;
}

export function ExtraFormItem({
  extra,
  index,
  form,
  handleRemoveExtra,
  getNumberValue,
}: ExtraFormItemProps) {
  return (
    <Paper key={extra.id} p="md" withBorder>
      <Grid>
        <Grid.Col span={4}>
          <TextInput
            label="Concepto"
            placeholder="Descripción del extra"
            value={extra.concepto}
            onChange={(e) => {
              const newExtras = [...form.values.extras];
              newExtras[index].concepto = e.target.value;
              form.setFieldValue('extras', newExtras);
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <NumberInput
            label="Monto"
            placeholder="0.00"
            value={extra.monto}
            onChange={(value) => {
              const newExtras = [...form.values.extras];
              newExtras[index].monto = getNumberValue(value);
              form.setFieldValue('extras', newExtras);
            }}
            decimalScale={2}
            min={0}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput
            label="Descripción"
            placeholder="Detalles adicionales"
            value={extra.descripcion}
            onChange={(e) => {
              const newExtras = [...form.values.extras];
              newExtras[index].descripcion = e.target.value;
              form.setFieldValue('extras', newExtras);
            }}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => handleRemoveExtra(index)}
            style={{ marginTop: 25 }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
