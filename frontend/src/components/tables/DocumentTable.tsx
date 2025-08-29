import React, { useState } from 'react';
import {
  Table,
  Paper,
  Box,
  TextInput,
  Select,
  Flex
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { DocumentTableForm } from './DocumentTableForm';
import { 
  DocumentAlerts, 
  AddDocumentButton, 
  DocumentRow, 
  getDocumentStatus 
} from './DocumentTableComponents';

// Tipos de documentos según el backend
export const TIPOS_DOCUMENTO = {
  licencia_conducir: 'Licencia de Conducir',
  carnet_conducir: 'Carnet de Conducir',
  vtv: 'VTV',
  seguro: 'Seguro',
  patente: 'Patente',
  habilitacion_municipal: 'Habilitación Municipal',
  habilitacion_provincial: 'Habilitación Provincial',
  habilitacion_nacional: 'Habilitación Nacional',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  otros: 'Otros'
} as const;

export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;

// Constantes para strings duplicados
const FILTER_ALL_VALUE = 'todos';

export interface Documento {
  _id?: string;
  tipo: TipoDocumento;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  archivo?: string;
}

interface DocumentTableProps {
  vehiculoId?: string;
  documentos: Documento[];
  onUpdate: (documentos: Documento[]) => void;
  onUpload?: (documento: Documento, file: File) => void;
  onDownload?: (documento: Documento) => void;
  readOnly?: boolean;
}

// Componente para los filtros
const DocumentFilters: React.FC<{
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterTipo: string;
  setFilterTipo: (value: string) => void;
  filterEstado: string;
  setFilterEstado: (value: string) => void;
  readOnly: boolean;
  onAddDocument: () => void;
}> = ({ searchTerm, setSearchTerm, filterTipo, setFilterTipo, filterEstado, setFilterEstado, readOnly, onAddDocument }) => (
  <Paper p="md" mb="md" withBorder>
    <Flex gap="md" align="end" wrap="wrap">
      <TextInput
        placeholder="Buscar documentos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
        flex={1}
        miw={200}
      />
      
      <Select
        placeholder="Filtrar por tipo"
        value={filterTipo}
        onChange={(value) => setFilterTipo(value || FILTER_ALL_VALUE)}
        data={[
          { value: FILTER_ALL_VALUE, label: 'Todos los tipos' },
          ...Object.entries(TIPOS_DOCUMENTO).map(([key, label]) => ({ value: key, label }))
        ]}
        w={200}
        clearable
      />
      
      <Select
        placeholder="Filtrar por estado"
        value={filterEstado}
        onChange={(value) => setFilterEstado(value || FILTER_ALL_VALUE)}
        data={[
          { value: FILTER_ALL_VALUE, label: 'Todos los estados' },
          { value: 'vigente', label: 'Vigente' },
          { value: 'por-vencer', label: 'Por vencer' },
          { value: 'vencido', label: 'Vencido' }
        ]}
        w={180}
        clearable
      />
      
      <AddDocumentButton onClick={onAddDocument} readOnly={readOnly} />
    </Flex>
  </Paper>
);

// Custom hook para manejo del estado de la tabla
const useDocumentTable = (documentos: Documento[], onUpdate: (documentos: Documento[]) => void) => {
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState(FILTER_ALL_VALUE);
  const [filterEstado, setFilterEstado] = useState(FILTER_ALL_VALUE);
  const [opened, { close }] = useDisclosure(false);

  const filteredDocumentos = documentos.filter((doc) => {
    const matchesSearch = !searchTerm || 
      doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numero?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === FILTER_ALL_VALUE || doc.tipo === filterTipo;
    
    const status = getDocumentStatus(doc.fechaVencimiento);
    const matchesEstado = filterEstado === FILTER_ALL_VALUE || status.status === filterEstado;
    
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const handleEdit = (doc: Documento) => setEditingDoc(doc);
  
  const handleSave = (updatedDoc: Documento) => {
    const updatedDocs = editingDoc?._id
      ? documentos.map(doc => doc._id === editingDoc._id ? updatedDoc : doc)
      : [...documentos, { ...updatedDoc, _id: Date.now().toString() }];
    
    onUpdate(updatedDocs);
    setEditingDoc(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(documentos.filter(doc => doc._id !== id));
  };

  const handleAdd = () => {
    setEditingDoc({
      tipo: 'vtv',
      fechaVencimiento: new Date(),
    });
  };

  return {
    editingDoc,
    setEditingDoc,
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    opened,
    close,
    filteredDocumentos,
    handleEdit,
    handleSave,
    handleDelete,
    handleAdd
  };
};

export const DocumentTable: React.FC<DocumentTableProps> = ({
  vehiculoId: _vehiculoId,
  documentos,
  onUpdate,
  onUpload,
  onDownload,
  readOnly = false
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
    filteredDocumentos,
    handleEdit,
    handleSave,
    handleDelete,
    handleAdd
  } = useDocumentTable(documentos, onUpdate);

  // Cálculo de alertas
  const vencidosCount = documentos.filter(doc => {
    const status = getDocumentStatus(doc.fechaVencimiento);
    return status.status === 'vencido';
  }).length;

  const porVencerCount = documentos.filter(doc => {
    const status = getDocumentStatus(doc.fechaVencimiento);
    return status.status === 'por-vencer';
  }).length;

  return (
    <Box>
      <DocumentAlerts vencidosCount={vencidosCount} porVencerCount={porVencerCount} />
      
      <DocumentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
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
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredDocumentos.map((documento) => (
              <DocumentRow
                key={documento._id || documento.tipo}
                documento={documento}
                readOnly={readOnly}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDownload={onDownload}
                onUpload={onUpload}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {editingDoc && (
        <DocumentTableForm
          documento={editingDoc}
          onSave={handleSave}
          onCancel={() => setEditingDoc(null)}
          opened={true}
          onClose={() => setEditingDoc(null)}
        />
      )}
    </Box>
  );
};

export default DocumentTable;