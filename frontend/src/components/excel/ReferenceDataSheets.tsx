import React from 'react';
import { Stack, Alert, List } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { ReferenceHeader } from './components/ReferenceHeader';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { EntitiesList } from './components/EntitiesList';
import { GenerationSection } from './components/GenerationSection';
import { generateAndDownloadReferenceSheets } from './helpers/referenceSheetHelpers';
import { useReferenceDataSheets } from './hooks/useReferenceDataSheets';

export interface ReferenceEntity {
  id: string;
  name: string;
  description: string;
  fields: ReferenceField[];
  data: Record<string, unknown>[];
  requiredFor?: string[]; // Entities that require this reference
  isLoading?: boolean;
  lastUpdated?: Date;
}

export interface ReferenceField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  isPrimary?: boolean; // Primary key field
  isDisplayName?: boolean; // Field to show as display name
  includeInReference?: boolean; // Include in reference sheet
}

export interface ReferenceDataSheetsProps {
  entities: ReferenceEntity[];
  selectedEntities?: string[];
  onEntitiesChange?: (entities: string[]) => void;
  onRefresh?: (entityId: string) => void;
  onDownload?: (config: ReferenceConfig) => void;
  isGenerating?: boolean;
  targetEntity?: string; // The entity that will use these references
}

export interface ReferenceConfig {
  selectedEntities: string[];
  includeInstructions: boolean;
  includeFullData: boolean;
  maxRecordsPerSheet: number;
  onlyActiveRecords: boolean;
}

// Helper function for generating reference sheets
const handleGenerateReferenceSheets = (
  entities: ReferenceEntity[],
  config: ReferenceConfig,
  targetEntity: string,
  onDownload?: (config: ReferenceConfig) => void
) => {
  generateAndDownloadReferenceSheets(entities, config, targetEntity, onDownload);
};

// Help section component
const HelpSection: React.FC = () => (
  <Alert
    icon={<IconInfoCircle size={16} />}
    color="blue"
    title="¿Cómo usar las hojas de referencia?"
  >
    <List size="sm" spacing="xs">
      <List.Item>
        <strong>Selecciona las entidades</strong> que necesitas como referencia para tu importación
      </List.Item>
      <List.Item>
        <strong>Descarga el archivo Excel</strong> que contendrá hojas separadas con los datos
        existentes
      </List.Item>
      <List.Item>
        <strong>Usa los IDs</strong> de las hojas de referencia para completar campos de relación en
        tu plantilla principal
      </List.Item>
      <List.Item>
        <strong>Lee las instrucciones</strong> incluidas en el archivo para ejemplos específicos
      </List.Item>
    </List>
  </Alert>
);

export const ReferenceDataSheets: React.FC<ReferenceDataSheetsProps> = ({
  entities,
  selectedEntities = [],
  onEntitiesChange,
  onRefresh,
  onDownload,
  isGenerating = false,
  targetEntity = 'datos',
}) => {
  const {
    config,
    setConfig,
    expandedEntities,
    availableEntities,
    recommendedEntities,
    totalRecords,
    handleEntityToggle,
    handleSelectRecommended,
    handleSelectAll,
    handleClearAll,
    toggleEntityExpansion,
  } = useReferenceDataSheets({
    entities,
    selectedEntities,
    targetEntity,
    onEntitiesChange,
  });

  const generateReferenceSheets = () => {
    handleGenerateReferenceSheets(entities, config, targetEntity, onDownload);
  };

  return (
    <Stack gap="md">
      <ReferenceHeader
        targetEntity={targetEntity}
        selectedCount={config.selectedEntities.length}
        totalRecords={totalRecords}
      />

      <QuickActionsPanel
        recommendedCount={recommendedEntities.length}
        availableCount={availableEntities.length}
        selectedCount={config.selectedEntities.length}
        onSelectRecommended={handleSelectRecommended}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      <ConfigurationPanel config={config} onConfigChange={setConfig} />

      <EntitiesList
        availableEntities={availableEntities}
        selectedEntities={config.selectedEntities}
        expandedEntities={expandedEntities}
        onToggleSelection={handleEntityToggle}
        onToggleExpansion={toggleEntityExpansion}
        onRefresh={onRefresh}
      />

      <GenerationSection
        selectedCount={config.selectedEntities.length}
        totalRecords={totalRecords}
        isGenerating={isGenerating}
        onGenerate={generateReferenceSheets}
      />

      <HelpSection />
    </Stack>
  );
};

export default ReferenceDataSheets;
