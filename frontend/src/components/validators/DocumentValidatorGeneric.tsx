import React, { useState, useCallback } from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Tabs,
  Button,
  ActionIcon,
  Modal,
  NumberInput,
  Switch,
} from '@mantine/core';
import {
  IconShieldCheck,
  IconRefresh,
  IconSettings,
  IconFileText,
  IconEye,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  DocumentValidatorProps,
  DocumentValidationResult,
  ValidationConfig,
  ValidationStatsProps,
} from './DocumentValidationTypes';
import { VALIDATION_RULES } from './DocumentValidationRules';
import {
  ValidationStats,
  ValidationSummaryComponent,
  ValidationByCategory,
  ValidationDetailsTable,
} from './DocumentValidationComponents';
import {
  useValidationConfig,
  useEnabledRules,
  useDocumentValidation,
} from './DocumentValidationHooks';

// Componente de configuración del modal
const ConfigurationModal: React.FC<{
  opened: boolean;
  onClose: () => void;
  validationConfig: ValidationConfig;
  updateConfig: (updates: Partial<ValidationConfig>) => void;
  enabledRules: string[];
  onToggleRule: (ruleId: string) => void;
  onSave: () => void;
}> = ({ opened, onClose, validationConfig, updateConfig, enabledRules, onToggleRule, onSave }) => (
  <Modal opened={opened} onClose={onClose} title="Configuración de Validación" size="lg">
    <Stack>
      <Title order={5}>Parámetros Generales</Title>

      <Group grow>
        <NumberInput
          label="Días críticos"
          value={validationConfig.diasCritico}
          onChange={(value) => updateConfig({ diasCritico: Number(value) || 7 })}
          min={1}
          max={30}
        />

        <NumberInput
          label="Días próximos"
          value={validationConfig.diasProximo}
          onChange={(value) => updateConfig({ diasProximo: Number(value) || 30 })}
          min={1}
          max={90}
        />
      </Group>

      <Switch
        label="Requiere número de documento"
        checked={validationConfig.requiereNumeroDocumento}
        onChange={(event) => updateConfig({ requiereNumeroDocumento: event.currentTarget.checked })}
      />

      <Switch
        label="Validar consistencia de fechas"
        checked={validationConfig.validarConsistenciaFechas}
        onChange={(event) =>
          updateConfig({ validarConsistenciaFechas: event.currentTarget.checked })
        }
      />

      <Title order={5} mt="md">
        Reglas Activas
      </Title>

      <Stack gap="xs">
        {VALIDATION_RULES.map((rule) => (
          <Group key={rule.id} justify="space-between">
            <div>
              <Text fw={500} size="sm">
                {rule.name}
              </Text>
              <Text size="xs" c="dimmed">
                {rule.description}
              </Text>
            </div>

            <Switch
              checked={enabledRules.includes(rule.id)}
              onChange={() => onToggleRule(rule.id)}
            />
          </Group>
        ))}
      </Stack>

      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSave}>Guardar Configuración</Button>
      </Group>
    </Stack>
  </Modal>
);

// Componente para renderizar variantes simples
const SimpleVariantRenderer: React.FC<{
  variant: 'summary' | 'by-category';
  stats: ValidationStatsProps['stats'];
  detailedResults: DocumentValidationResult[];
  resultsByCategory: Record<string, DocumentValidationResult[]>;
  onEditDocument?: (documentoId: string) => void;
}> = ({ variant, stats, detailedResults, resultsByCategory, onEditDocument }) => {
  if (variant === 'summary') {
    return (
      <Stack gap="md">
        <ValidationStats stats={stats} />
        <ValidationSummaryComponent
          stats={stats}
          detailedResults={detailedResults}
          onEditDocument={onEditDocument}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <ValidationStats stats={stats} />
      <ValidationByCategory resultsByCategory={resultsByCategory} onEditDocument={onEditDocument} />
    </Stack>
  );
};

// Componente completo de validación
const CompleteValidator: React.FC<{
  documentos: unknown[];
  enabledRules: string[];
  stats: ValidationStatsProps['stats'];
  detailedResults: DocumentValidationResult[];
  resultsByCategory: Record<string, DocumentValidationResult[]>;
  onEditDocument?: (documentoId: string) => void;
  onAutoFix?: (result: DocumentValidationResult) => void;
  showConfig: boolean;
  loading: boolean;
  configModalOpened: boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  validationConfig: ValidationConfig;
  updateConfig: (updates: Partial<ValidationConfig>) => void;
  handleToggleRule: (ruleId: string) => void;
  handleConfigSave: () => void;
}> = ({
  documentos,
  enabledRules,
  stats,
  detailedResults,
  resultsByCategory,
  onEditDocument,
  onAutoFix,
  showConfig,
  loading,
  configModalOpened,
  openConfigModal,
  closeConfigModal,
  validationConfig,
  updateConfig,
  handleToggleRule,
  handleConfigSave,
}) => {
  const [selectedTab, setSelectedTab] = useState('summary');

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconShieldCheck size={24} />
            <Title order={3}>Validador de Documentos</Title>
          </Group>

          <Group gap="xs">
            {showConfig && (
              <ActionIcon variant="light" onClick={openConfigModal}>
                <IconSettings size={16} />
              </ActionIcon>
            )}

            <Button variant="light" leftSection={<IconRefresh size={16} />} loading={loading}>
              Validar
            </Button>
          </Group>
        </Group>

        <Text size="sm" c="dimmed">
          Validando {documentos.length} documentos con {enabledRules.length} reglas activas
          {stats.score && <> • Puntuación: {stats.score.toFixed(0)}%</>}
        </Text>
      </Paper>

      <ValidationStats stats={stats} />

      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'summary')}>
        <Tabs.List>
          <Tabs.Tab value="summary" leftSection={<IconFileText size={16} />}>
            Resumen
          </Tabs.Tab>
          <Tabs.Tab value="category" leftSection={<IconShieldCheck size={16} />}>
            Por Categoría
          </Tabs.Tab>
          <Tabs.Tab value="details" leftSection={<IconEye size={16} />}>
            Detalles
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="summary" pt="md">
          <ValidationSummaryComponent
            stats={stats}
            detailedResults={detailedResults}
            onEditDocument={onEditDocument}
          />
        </Tabs.Panel>

        <Tabs.Panel value="category" pt="md">
          <ValidationByCategory
            resultsByCategory={resultsByCategory}
            onEditDocument={onEditDocument}
          />
        </Tabs.Panel>

        <Tabs.Panel value="details" pt="md">
          <ValidationDetailsTable
            detailedResults={detailedResults}
            onEditDocument={onEditDocument}
            onAutoFix={onAutoFix}
          />
        </Tabs.Panel>
      </Tabs>

      {showConfig && (
        <ConfigurationModal
          opened={configModalOpened}
          onClose={closeConfigModal}
          validationConfig={validationConfig}
          updateConfig={updateConfig}
          enabledRules={enabledRules}
          onToggleRule={handleToggleRule}
          onSave={handleConfigSave}
        />
      )}
    </Stack>
  );
};

export const DocumentValidatorGeneric: React.FC<DocumentValidatorProps> = ({
  documentos,
  config = {},
  variant = 'complete',
  showConfig = true,
  onValidationComplete,
  onAutoFix,
  onEditDocument,
  onConfigChange,
  loading = false,
}) => {
  const { validationConfig, updateConfig } = useValidationConfig(config);
  const { enabledRules, toggleRule } = useEnabledRules();
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] =
    useDisclosure(false);

  const { validator, detailedResults, resultsByCategory, stats } = useDocumentValidation(
    documentos,
    validationConfig,
    enabledRules,
    onValidationComplete
  );

  const handleConfigSave = useCallback(() => {
    validator.updateConfig(validationConfig);
    onConfigChange?.(validationConfig);
    closeConfigModal();

    notifications.show({
      title: 'Configuración Guardada',
      message: 'Las reglas de validación han sido actualizadas',
      color: 'green',
    });
  }, [validator, validationConfig, onConfigChange, closeConfigModal]);

  const handleToggleRule = useCallback(
    (ruleId: string) => {
      toggleRule(ruleId, validator);
    },
    [toggleRule, validator]
  );

  if (variant === 'summary' || variant === 'by-category') {
    return (
      <SimpleVariantRenderer
        variant={variant}
        stats={stats}
        detailedResults={detailedResults}
        resultsByCategory={resultsByCategory}
        onEditDocument={onEditDocument}
      />
    );
  }

  return (
    <CompleteValidator
      documentos={documentos}
      enabledRules={enabledRules}
      stats={stats}
      detailedResults={detailedResults}
      resultsByCategory={resultsByCategory}
      onEditDocument={onEditDocument}
      onAutoFix={onAutoFix}
      showConfig={showConfig}
      loading={loading}
      configModalOpened={configModalOpened}
      openConfigModal={openConfigModal}
      closeConfigModal={closeConfigModal}
      validationConfig={validationConfig}
      updateConfig={updateConfig}
      handleToggleRule={handleToggleRule}
      handleConfigSave={handleConfigSave}
    />
  );
};

export default DocumentValidatorGeneric;
