import { useState, useMemo } from 'react';
import type { ReferenceEntity, ReferenceConfig } from '../ReferenceDataSheets';

const DEFAULT_CONFIG: ReferenceConfig = {
  selectedEntities: [],
  includeInstructions: true,
  includeFullData: true,
  maxRecordsPerSheet: 1000,
  onlyActiveRecords: true,
};

interface UseReferenceDataSheetsProps {
  entities: ReferenceEntity[];
  selectedEntities: string[];
  targetEntity: string;
  onEntitiesChange?: (entities: string[]) => void;
}

export const useReferenceDataSheets = ({
  entities,
  selectedEntities,
  targetEntity,
  onEntitiesChange,
}: UseReferenceDataSheetsProps) => {
  const [config, setConfig] = useState<ReferenceConfig>({
    ...DEFAULT_CONFIG,
    selectedEntities,
  });
  const [expandedEntities, setExpandedEntities] = useState<Record<string, boolean>>({});

  const availableEntities = useMemo(() => {
    return entities.filter((entity) => entity.data.length > 0);
  }, [entities]);

  const recommendedEntities = useMemo(() => {
    return entities.filter(
      (entity) => entity.requiredFor?.includes(targetEntity) || entity.data.length > 0
    );
  }, [entities, targetEntity]);

  const selectedEntitiesData = useMemo(() => {
    return config.selectedEntities
      .map((id) => entities.find((e) => e.id === id))
      .filter(Boolean) as ReferenceEntity[];
  }, [config.selectedEntities, entities]);

  const totalRecords = useMemo(() => {
    return selectedEntitiesData.reduce((sum, entity) => sum + entity.data.length, 0);
  }, [selectedEntitiesData]);

  const handleEntityToggle = (entityId: string) => {
    const newSelected = config.selectedEntities.includes(entityId)
      ? config.selectedEntities.filter((id) => id !== entityId)
      : [...config.selectedEntities, entityId];

    const newConfig = { ...config, selectedEntities: newSelected };
    setConfig(newConfig);
    onEntitiesChange?.(newSelected);
  };

  const handleSelectRecommended = () => {
    const recommended = recommendedEntities.map((e) => e.id);
    const newConfig = { ...config, selectedEntities: recommended };
    setConfig(newConfig);
    onEntitiesChange?.(recommended);
  };

  const handleSelectAll = () => {
    const all = availableEntities.map((e) => e.id);
    const newConfig = { ...config, selectedEntities: all };
    setConfig(newConfig);
    onEntitiesChange?.(all);
  };

  const handleClearAll = () => {
    const newConfig = { ...config, selectedEntities: [] };
    setConfig(newConfig);
    onEntitiesChange?.([]);
  };

  const toggleEntityExpansion = (entityId: string) => {
    setExpandedEntities((prev) => ({
      ...prev,
      [entityId]: !prev[entityId],
    }));
  };

  return {
    config,
    setConfig,
    expandedEntities,
    availableEntities,
    recommendedEntities,
    selectedEntitiesData,
    totalRecords,
    handleEntityToggle,
    handleSelectRecommended,
    handleSelectAll,
    handleClearAll,
    toggleEntityExpansion,
  };
};
