import React, { useState } from 'react';
import { Stack } from '@mantine/core';
import { VehiculoAssignment } from './VehiculoAssigner';
import { VehicleDetectionResult } from './VehicleTypeDetector';
import { useConfigurationSummary } from '../../hooks/useConfigurationSummary';
import { ConfigurationSummaryCard } from './ConfigurationPreview/ConfigurationSummaryCard';
import { RisksSection } from './ConfigurationPreview/RisksSection';
import { VehicleDetailsSection } from './ConfigurationPreview/VehicleDetailsSection';
import { CostAnalysisSection } from './ConfigurationPreview/CostAnalysisSection';
import { ValidationStatusCard } from './ConfigurationPreview/ValidationStatusCard';
import { EmptyConfigurationCard } from './ConfigurationPreview/EmptyConfigurationCard';

interface ConfigurationPreviewProps {
  assignments: VehiculoAssignment[];
  detectionResults?: Record<string, VehicleDetectionResult>;
  viajeData?: {
    tramo?: unknown;
    extras?: unknown[];
    cargaTotal?: number;
    distanciaTotal?: number;
    fechaViaje?: Date;
  };
  onEdit?: () => void;
  readonly?: boolean;
}

export function ConfigurationPreview({
  assignments,
  detectionResults = {},
  viajeData,
  onEdit,
  readonly = false,
}: ConfigurationPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vehicles: true,
    costs: false,
    risks: false,
  });

  const summary = useConfigurationSummary(assignments, viajeData);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getUtilizationColor = (utilizacion: number) => {
    if (utilizacion > 95) return 'red';
    if (utilizacion > 85) return 'orange';
    if (utilizacion > 60) return 'green';
    if (utilizacion > 30) return 'blue';
    return 'gray';
  };

  if (assignments.length === 0) {
    return <EmptyConfigurationCard />;
  }

  return (
    <Stack gap="md">
      <ConfigurationSummaryCard
        summary={summary}
        viajeData={viajeData}
        readonly={readonly}
        onEdit={onEdit}
        getUtilizationColor={getUtilizationColor}
      />

      <RisksSection
        riesgos={summary.riesgos}
        expanded={expandedSections.risks}
        onToggle={() => toggleSection('risks')}
      />

      <VehicleDetailsSection
        assignments={assignments}
        detectionResults={detectionResults}
        riesgos={summary.riesgos}
        expanded={expandedSections.vehicles}
        onToggle={() => toggleSection('vehicles')}
      />

      <CostAnalysisSection
        summary={summary}
        viajeData={viajeData}
        expanded={expandedSections.costs}
        onToggle={() => toggleSection('costs')}
      />

      <ValidationStatusCard riesgos={summary.riesgos} />
    </Stack>
  );
}
