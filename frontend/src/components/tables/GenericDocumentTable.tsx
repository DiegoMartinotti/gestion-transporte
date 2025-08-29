import React from 'react';
import { Table, Paper, Box, Modal, Stack } from '@mantine/core';
import { 
  DocumentoGenerico, 
  GenericDocumentTableProps,
  TIPOS_DOCUMENTO
} from './GenericDocumentTable/types';
import {
  DocumentAlerts,
  DocumentStats,
  DocumentFilters,
  DocumentRow
} from './GenericDocumentTable/components';
import { useGenericDocumentTable } from './GenericDocumentTable/hooks';
import { calculateDocumentStats } from './GenericDocumentTable/helpers';

// Re-export types for external use
export { DocumentoGenerico, TIPOS_DOCUMENTO };
export type { GenericDocumentTableProps };

// Componente de formulario de documento (placeholder - se implementaría externamente)
const DocumentForm: React.FC<{
  documento: DocumentoGenerico;
  onSave: (doc: DocumentoGenerico) => void;
  onCancel: () => void;
}> = ({ documento, onSave, onCancel }) => (
  <Stack gap="md">
    {/* Este sería implementado como un formulario completo */}
    <div>Formulario de documento (implementar según necesidades)</div>
    <div>
      <button onClick={() => onSave(documento)}>Guardar</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  </Stack>
);

export const GenericDocumentTable: React.FC<GenericDocumentTableProps> = ({
  documentos,
  entidadTipo,
  onUpdate,
  onUpload,
  onDownload,
  readOnly = false,
  showEntidadInfo = false,
  allowedTypes,
}) => {
  const {
    editingDoc,
    setEditingDoc,
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    filterEntidad,
    setFilterEntidad,
    filteredDocumentos,
    entidadesDisponibles,
    handleEdit,
    handleSave,
    handleDelete,
    handleAdd,
  } = useGenericDocumentTable(documentos, onUpdate, entidadTipo, allowedTypes);

  // Calcular estadísticas para alertas
  const stats = calculateDocumentStats(documentos);

  return (
    <Box>
      <DocumentAlerts 
        vencidosCount={stats.vencidos} 
        porVencerCount={stats.porVencer} 
      />
      
      <DocumentStats documentos={documentos} />
      
      <DocumentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        filterEntidad={filterEntidad}
        setFilterEntidad={setFilterEntidad}
        allowedTypes={allowedTypes}
        entidades={entidadesDisponibles}
        readOnly={readOnly}
        onAddDocument={handleAdd}
      />

      <Paper withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Número</Table.Th>
              <Table.Th>Vencimiento</Table.Th>
              {showEntidadInfo && <Table.Th>Entidad</Table.Th>}
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredDocumentos.map((documento) => (
              <DocumentRow
                key={documento._id || `${documento.tipo}-${documento.numero}`}
                documento={documento}
                showEntidadInfo={showEntidadInfo}
                readOnly={readOnly}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDownload={onDownload}
                onUpload={onUpload}
              />
            ))}
          </Table.Tbody>
        </Table>
        
        {filteredDocumentos.length === 0 && (
          <Box p="md" ta="center">
            No se encontraron documentos
          </Box>
        )}
      </Paper>

      {editingDoc && (
        <Modal
          opened={true}
          onClose={() => setEditingDoc(null)}
          title={editingDoc._id ? 'Editar Documento' : 'Nuevo Documento'}
          size="md"
        >
          <DocumentForm
            documento={editingDoc}
            onSave={handleSave}
            onCancel={() => setEditingDoc(null)}
          />
        </Modal>
      )}
    </Box>
  );
};

export default GenericDocumentTable;