import React from 'react';
import { Paper, Title, Group, Select, Card, Text, Stack, Code } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { TIPOS_CALCULO, type TipoCalculo, type CalculoConfig } from './constants/tiposCalculo';
import { useTipoCalculoLogic } from './hooks/useTipoCalculoLogic';
import { ConfiguracionesAdicionalesCard } from './components/ConfiguracionesAdicionalesCard';
import { CalculosSimplesConfig } from './components/CalculosSimplesConfig';
import { TarifaFijaConfig } from './components/TarifaFijaConfig';
import { FormulaPersonalizadaConfig } from './components/FormulaPersonalizadaConfig';
import { VistaPrevia } from './components/VistaPrevia';

interface TipoCalculoSelectorProps {
  value?: TipoCalculo;
  onChange?: (tipo: TipoCalculo, config: CalculoConfig) => void;
  readonly?: boolean;
  showPreview?: boolean;
}

export const TipoCalculoSelector: React.FC<TipoCalculoSelectorProps> = ({
  value = 'peso',
  onChange,
  readonly = false,
  showPreview = true,
}) => {
  const {
    selectedTipo,
    config,
    formulaError,
    formulaValid,
    handleTipoChange,
    handleConfigChange,
    handleFormulaChange,
  } = useTipoCalculoLogic(value, onChange);

  const selectedTipoData = TIPOS_CALCULO.find((t) => t.value === selectedTipo);
  const SelectedIcon = selectedTipoData?.icon || IconCalculator;

  return (
    <Paper p="md">
      <Title order={5} mb="md">
        <Group gap="xs">
          <IconCalculator size={20} />
          Método de Cálculo
        </Group>
      </Title>

      <Select
        label="Tipo de Cálculo"
        value={selectedTipo}
        onChange={(value) => handleTipoChange(value as TipoCalculo)}
        data={TIPOS_CALCULO.map((tipo) => ({
          value: tipo.value,
          label: tipo.label,
        }))}
        disabled={readonly}
        mb="md"
      />

      {selectedTipoData && (
        <Card withBorder mb="md" bg={`${selectedTipoData.color}.0`}>
          <Group gap="md">
            <SelectedIcon size={32} color={selectedTipoData.color} />
            <div>
              <Text fw={500}>{selectedTipoData.label}</Text>
              <Text size="sm" c="dimmed">
                {selectedTipoData.description}
              </Text>
              <Code mt="xs">{selectedTipoData.formula}</Code>
            </div>
          </Group>
        </Card>
      )}

      <Stack gap="md">
        <CalculosSimplesConfig
          selectedTipo={selectedTipo}
          config={config}
          readonly={readonly}
          onConfigChange={handleConfigChange}
        />

        <TarifaFijaConfig
          selectedTipo={selectedTipo}
          config={config}
          readonly={readonly}
          onConfigChange={handleConfigChange}
        />

        <FormulaPersonalizadaConfig
          selectedTipo={selectedTipo}
          config={config}
          readonly={readonly}
          formulaError={formulaError}
          formulaValid={formulaValid}
          onFormulaChange={handleFormulaChange}
        />

        <ConfiguracionesAdicionalesCard
          config={config}
          readonly={readonly}
          onConfigChange={handleConfigChange}
        />

        <VistaPrevia selectedTipo={selectedTipo} config={config} showPreview={showPreview} />
      </Stack>
    </Paper>
  );
};
