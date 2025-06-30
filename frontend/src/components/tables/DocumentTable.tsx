import React, { useState } from 'react';
import {
  Table,
  Text,
  Badge,
  ActionIcon,
  Group,
  Button,
  Modal,
  Stack,
  Alert,
  Paper,
  Box,
  Tooltip,
  TextInput,
  Select,
  Flex
} from '@mantine/core';
import {
  IconFileText,
  IconEdit,
  IconTrash,
  IconDownload,
  IconUpload,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconCalendar,
  IconSearch
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';

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

export interface Documento {
  _id?: string;
  tipo: TipoDocumento;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  archivo?: string;
  activo: boolean;
}

interface DocumentTableProps {
  vehiculoId?: string;
  documentos: Documento[];
  onUpdate: (documentos: Documento[]) => void;
  onUpload?: (documento: Documento, file: File) => void;
  onDownload?: (documento: Documento) => void;
  readOnly?: boolean;
}

const getDocumentStatus = (fechaVencimiento?: Date) => {
  if (!fechaVencimiento) return { status: 'sin-fecha', color: 'gray', label: 'Sin fecha' };
  
  const today = dayjs();
  const vencimiento = dayjs(fechaVencimiento);
  const diasRestantes = vencimiento.diff(today, 'day');
  
  if (diasRestantes < 0) {
    return { status: 'vencido', color: 'red', label: `Vencido hace ${Math.abs(diasRestantes)} días` };
  } else if (diasRestantes <= 30) {
    return { status: 'por-vencer', color: 'orange', label: `Vence en ${diasRestantes} días` };
  } else {
    return { status: 'vigente', color: 'green', label: `Vigente (${diasRestantes} días)` };
  }
};

export const DocumentTable: React.FC<DocumentTableProps> = ({
  vehiculoId,
  documentos,
  onUpdate,
  onUpload,
  onDownload,
  readOnly = false
}) => {
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [opened, { open, close }] = useDisclosure(false);

  const filteredDocumentos = documentos.filter(doc => {
    const matchesSearch = !searchTerm || 
      TIPOS_DOCUMENTO[doc.tipo].toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numero?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todos' || doc.tipo === filterTipo;
    
    const status = getDocumentStatus(doc.fechaVencimiento);
    const matchesEstado = filterEstado === 'todos' || status.status === filterEstado;
    
    return matchesSearch && matchesTipo && matchesEstado && doc.activo;
  });

  const handleEdit = (documento: Documento) => {
    setEditingDoc(documento);
    open();
  };

  const handleSave = () => {
    if (!editingDoc) return;
    
    const updatedDocs = documentos.map(doc => 
      doc._id === editingDoc._id ? editingDoc : doc
    );
    onUpdate(updatedDocs);
    close();
    setEditingDoc(null);
  };

  const handleDelete = (docId: string) => {
    const updatedDocs = documentos.map(doc => 
      doc._id === docId ? { ...doc, activo: false } : doc
    );
    onUpdate(updatedDocs);
  };

  const handleAdd = () => {
    const newDoc: Documento = {
      _id: `temp_${Date.now()}`,
      tipo: 'otros',
      activo: true
    };
    setEditingDoc(newDoc);
    open();
  };

  const renderRow = (documento: Documento) => {
    const status = getDocumentStatus(documento.fechaVencimiento);
    
    return (
      <Table.Tr key={documento._id}>
        <Table.Td>
          <Group gap="xs">
            <IconFileText size={16} />
            <Text size="sm" fw={500}>
              {TIPOS_DOCUMENTO[documento.tipo]}
            </Text>
          </Group>
        </Table.Td>
        
        <Table.Td>
          <Text size="sm">{documento.numero || '-'}</Text>
        </Table.Td>
        
        <Table.Td>
          <Text size="sm">
            {documento.fechaEmision ? dayjs(documento.fechaEmision).format('DD/MM/YYYY') : '-'}
          </Text>
        </Table.Td>
        
        <Table.Td>
          <Group gap="xs">
            <Text size="sm">
              {documento.fechaVencimiento ? dayjs(documento.fechaVencimiento).format('DD/MM/YYYY') : '-'}
            </Text>
            {documento.fechaVencimiento && (
              <Badge size="xs" color={status.color} variant="light">
                {status.label}
              </Badge>
            )}
          </Group>
        </Table.Td>
        
        <Table.Td>
          <Group gap="xs">
            {documento.archivo && (
              <Tooltip label="Descargar archivo">
                <ActionIcon 
                  size="sm" 
                  variant="light" 
                  color="blue"
                  onClick={() => onDownload?.(documento)}
                >
                  <IconDownload size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {!readOnly && (
              <>
                <Tooltip label="Subir archivo">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    color="green"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.jpg,.jpeg,.png';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) onUpload?.(documento, file);
                      };
                      input.click();
                    }}
                  >
                    <IconUpload size={14} />
                  </ActionIcon>
                </Tooltip>
                
                <Tooltip label="Editar">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    onClick={() => handleEdit(documento)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                
                <Tooltip label="Eliminar">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    color="red"
                    onClick={() => documento._id && handleDelete(documento._id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  };

  const vencidosCount = documentos.filter(doc => {
    const status = getDocumentStatus(doc.fechaVencimiento);
    return status.status === 'vencido' && doc.activo;
  }).length;

  const porVencerCount = documentos.filter(doc => {
    const status = getDocumentStatus(doc.fechaVencimiento);
    return status.status === 'por-vencer' && doc.activo;
  }).length;

  return (
    <Box>
      {/* Alertas de estado */}
      {vencidosCount > 0 && (
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          color="red" 
          mb="md"
          variant="light"
        >
          <Text size="sm">
            {vencidosCount} documento{vencidosCount > 1 ? 's' : ''} vencido{vencidosCount > 1 ? 's' : ''}
          </Text>
        </Alert>
      )}
      
      {porVencerCount > 0 && (
        <Alert 
          icon={<IconCalendar size={16} />} 
          color="orange" 
          mb="md"
          variant="light"
        >
          <Text size="sm">
            {porVencerCount} documento{porVencerCount > 1 ? 's' : ''} por vencer en 30 días
          </Text>
        </Alert>
      )}

      {/* Controles de filtrado */}
      <Paper p="md" mb="md" withBorder>
        <Flex gap="md" align="end" wrap="wrap">
          <TextInput
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, minWidth: 200 }}
          />
          
          <Select
            placeholder="Tipo de documento"
            value={filterTipo}
            onChange={(value) => setFilterTipo(value || 'todos')}
            data={[
              { value: 'todos', label: 'Todos los tipos' },
              ...Object.entries(TIPOS_DOCUMENTO).map(([key, label]) => ({
                value: key,
                label
              }))
            ]}
            style={{ minWidth: 180 }}
          />
          
          <Select
            placeholder="Estado"
            value={filterEstado}
            onChange={(value) => setFilterEstado(value || 'todos')}
            data={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'vigente', label: 'Vigentes' },
              { value: 'por-vencer', label: 'Por vencer' },
              { value: 'vencido', label: 'Vencidos' },
              { value: 'sin-fecha', label: 'Sin fecha' }
            ]}
            style={{ minWidth: 150 }}
          />
          
          {!readOnly && (
            <Button onClick={handleAdd} leftSection={<IconFileText size={16} />}>
              Agregar Documento
            </Button>
          )}
        </Flex>
      </Paper>

      {/* Tabla de documentos */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tipo de Documento</Table.Th>
            <Table.Th>Número</Table.Th>
            <Table.Th>F. Emisión</Table.Th>
            <Table.Th>F. Vencimiento</Table.Th>
            <Table.Th style={{ width: 120 }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredDocumentos.length > 0 ? (
            filteredDocumentos.map(renderRow)
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text ta="center" c="dimmed" py="xl">
                  No hay documentos para mostrar
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Modal de edición */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingDoc?._id?.startsWith('temp_') ? 'Agregar Documento' : 'Editar Documento'}
        size="md"
      >
        {editingDoc && (
          <Stack>
            <Select
              label="Tipo de Documento"
              value={editingDoc.tipo}
              onChange={(value) => setEditingDoc(prev => prev ? { ...prev, tipo: value as TipoDocumento } : null)}
              data={Object.entries(TIPOS_DOCUMENTO).map(([key, label]) => ({
                value: key,
                label
              }))}
              required
            />
            
            <TextInput
              label="Número"
              value={editingDoc.numero || ''}
              onChange={(e) => setEditingDoc(prev => prev ? { ...prev, numero: e.currentTarget.value } : null)}
              placeholder="Número del documento"
            />
            
            <TextInput
              label="Fecha de Emisión"
              type="date"
              value={editingDoc.fechaEmision ? dayjs(editingDoc.fechaEmision).format('YYYY-MM-DD') : ''}
              onChange={(e) => setEditingDoc(prev => prev ? { 
                ...prev, 
                fechaEmision: e.currentTarget.value ? new Date(e.currentTarget.value) : undefined 
              } : null)}
            />
            
            <TextInput
              label="Fecha de Vencimiento"
              type="date"
              value={editingDoc.fechaVencimiento ? dayjs(editingDoc.fechaVencimiento).format('YYYY-MM-DD') : ''}
              onChange={(e) => setEditingDoc(prev => prev ? { 
                ...prev, 
                fechaVencimiento: e.currentTarget.value ? new Date(e.currentTarget.value) : undefined 
              } : null)}
            />
            
            <TextInput
              label="Observaciones"
              value={editingDoc.observaciones || ''}
              onChange={(e) => setEditingDoc(prev => prev ? { ...prev, observaciones: e.currentTarget.value } : null)}
              placeholder="Observaciones adicionales"
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={close}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default DocumentTable;