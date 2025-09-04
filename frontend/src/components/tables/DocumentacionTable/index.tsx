import React from 'react';
import { Table, Card, Stack, Text } from '@mantine/core';
import type { Personal } from '../../../types';
import { useDocumentosData } from './hooks/useDocumentosData';
import { useFilteredDocumentos } from './hooks/useFilteredDocumentos';
import { useDocumentStats } from './hooks/useDocumentStats';
import { StatisticsCard } from './StatisticsCard';
import { FiltersCard } from './FiltersCard';
import { AlertsSection } from './AlertsSection';
import { DocumentRow } from './DocumentRow';

interface DocumentacionTableProps {
  personal: Personal[];
  onViewPersonal?: (personal: Personal) => void;
  onEditPersonal?: (personal: Personal) => void;
  showFilters?: boolean;
  maxExpireDays?: number;
}

export const DocumentacionTable: React.FC<DocumentacionTableProps> = ({
  personal,
  onViewPersonal,
  onEditPersonal,
  showFilters = true,
  maxExpireDays = 90,
}) => {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [tipoFilter, setTipoFilter] = React.useState<string>('all');

  const documentos = useDocumentosData(personal);
  const filteredDocumentos = useFilteredDocumentos(
    documentos,
    statusFilter,
    tipoFilter,
    maxExpireDays
  );
  const stats = useDocumentStats(documentos);

  const findPersonalById = (id: string) => {
    return personal.find((p) => p._id === id);
  };

  return (
    <Stack gap="md">
      {/* Statistics Card */}
      <StatisticsCard
        stats={stats}
        filteredCount={filteredDocumentos.length}
        totalCount={documentos.length}
      />

      {/* Filters */}
      {showFilters && (
        <FiltersCard
          statusFilter={statusFilter}
          tipoFilter={tipoFilter}
          onStatusFilterChange={setStatusFilter}
          onTipoFilterChange={setTipoFilter}
        />
      )}

      {/* Alerts for critical issues */}
      <AlertsSection stats={stats} />

      {/* Documents Table */}
      <Card withBorder>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Personal</th>
              <th>Empresa</th>
              <th>Tipo de Documento</th>
              <th>Número</th>
              <th>Fecha Vencimiento</th>
              <th>Estado</th>
              <th>Días</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocumentos.map((doc, index) => (
              <DocumentRow
                key={`${doc.personalId}-${doc.tipoDocumento}-${index}`}
                doc={doc}
                index={index}
                onViewPersonal={onViewPersonal}
                onEditPersonal={onEditPersonal}
                findPersonalById={findPersonalById}
              />
            ))}
          </tbody>
        </Table>

        {filteredDocumentos.length === 0 && (
          <Text size="sm" color="dimmed" ta="center" py="xl">
            No hay documentos que coincidan con los filtros seleccionados.
          </Text>
        )}
      </Card>
    </Stack>
  );
};
