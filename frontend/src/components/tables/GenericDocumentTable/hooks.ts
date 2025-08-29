import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { DocumentoGenerico, TipoDocumento, FILTER_ALL_VALUE } from './types';
import { filterDocuments, groupDocumentsByEntity } from './helpers';

export const useGenericDocumentTable = (
  documentos: DocumentoGenerico[],
  onUpdate: (documentos: DocumentoGenerico[]) => void,
  entidadTipo: 'vehiculo' | 'personal' | 'empresa',
  allowedTypes?: TipoDocumento[]
) => {
  // Estado local
  const [editingDoc, setEditingDoc] = useState<DocumentoGenerico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState(FILTER_ALL_VALUE);
  const [filterEstado, setFilterEstado] = useState(FILTER_ALL_VALUE);
  const [filterEntidad, setFilterEntidad] = useState(FILTER_ALL_VALUE);
  const [opened, { close }] = useDisclosure(false);

  // Documentos filtrados
  const filteredDocumentos = useMemo(() => {
    return filterDocuments(documentos, searchTerm, filterTipo, filterEstado, filterEntidad);
  }, [documentos, searchTerm, filterTipo, filterEstado, filterEntidad]);

  // Entidades disponibles para el filtro
  const entidadesDisponibles = useMemo(() => {
    const grupos = groupDocumentsByEntity(documentos);
    return Object.values(grupos).map(grupo => ({
      value: grupo.entidadId,
      label: grupo.entidadNombre
    }));
  }, [documentos]);

  // Handlers
  const handleEdit = (doc: DocumentoGenerico) => {
    setEditingDoc(doc);
  };

  const handleSave = (updatedDoc: DocumentoGenerico) => {
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
    const defaultType = allowedTypes?.[0] || 'vtv';
    setEditingDoc({
      tipo: defaultType as TipoDocumento,
      entidadTipo,
      fechaVencimiento: new Date(),
    });
  };

  return {
    // Estado
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
    opened,
    close,
    
    // Datos procesados
    filteredDocumentos,
    entidadesDisponibles,
    
    // Handlers
    handleEdit,
    handleSave,
    handleDelete,
    handleAdd,
  };
};