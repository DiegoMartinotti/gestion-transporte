import React, { useState, useMemo } from 'react';
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
  Flex,
  Card,
  Title,
  Progress,
  ThemeIcon
} from '@mantine/core';
import {
  IconFileText,
  IconEdit,
  IconTrash,
  IconDownload,
  IconUpload,
  IconAlertTriangle,
  IconX,
  IconCalendar,
  IconSearch,
  IconEye,
  IconLicense,
  IconStethoscope,
  IconTruck,
  IconUser
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';

// Tipos unificados para documentos
export const TIPOS_DOCUMENTO = {
  // Documentos de vehículos
  vtv: 'VTV',
  seguro: 'Seguro',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  patente: 'Patente',
  habilitacion_municipal: 'Habilitación Municipal',
  habilitacion_provincial: 'Habilitación Provincial',
  habilitacion_nacional: 'Habilitación Nacional',
  // Documentos de personal
  licenciaConducir: 'Licencia de Conducir',
  carnetProfesional: 'Carnet Profesional',
  aptitudPsicofisica: 'Aptitud Psicofísica',
  cargaPeligrosa: 'Carga Peligrosa',
  cursoDefensivo: 'Curso Defensivo',
  evaluacionMedica: 'Evaluación Médica',
  psicofisico: 'Psicofísico',
  // Otros
  otros: 'Otros'
} as const;

export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;

// Interface unificada para documentos
export interface DocumentoGenerico {
  _id?: string;
  tipo: TipoDocumento;
  numero?: string;
  categoria?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  resultado?: string;
  archivo?: string;
  activo: boolean;
  // Información de la entidad dueña del documento
  entidadId: string;
  entidadNombre: string;
  entidadTipo: 'vehiculo' | 'personal';
  entidadInfo?: string; // DNI, patente, etc.
  empresa?: string;
}

// Props del componente
interface GenericDocumentTableProps {
  // Datos de documentos
  documentos: DocumentoGenerico[];
  // Callbacks
  onUpdate?: (documentos: DocumentoGenerico[]) => void;
  onUpload?: (documento: DocumentoGenerico, file: File) => void;
  onDownload?: (documento: DocumentoGenerico) => void;
  onViewEntity?: (entidadId: string, entidadTipo: 'vehiculo' | 'personal') => void;
  onEditEntity?: (entidadId: string, entidadTipo: 'vehiculo' | 'personal') => void;
  // Configuración
  readOnly?: boolean;
  showFilters?: boolean;
  showStatistics?: boolean;
  showEntityActions?: boolean;
  maxExpireDays?: number;
  // Filtros permitidos por entidad
  allowedEntityTypes?: ('vehiculo' | 'personal')[];
  allowedDocumentTypes?: TipoDocumento[];
}

// Función para obtener el estado de un documento
const getDocumentStatus = (fechaVencimiento?: Date) => {
  if (!fechaVencimiento) return { status: 'sin-fecha', color: 'gray', label: 'Sin fecha' };
  
  const today = dayjs();
  const vencimiento = dayjs(fechaVencimiento);
  const diasRestantes = vencimiento.diff(today, 'day');
  
  if (diasRestantes < 0) {
    return { 
      status: 'vencido', 
      color: 'red', 
      label: `Vencido hace ${Math.abs(diasRestantes)} días`,
      days: diasRestantes
    };
  } else if (diasRestantes <= 7) {
    return { 
      status: 'critico', 
      color: 'red', 
      label: `Vence en ${diasRestantes} días`,
      days: diasRestantes
    };
  } else if (diasRestantes <= 30) {
    return { 
      status: 'por-vencer', 
      color: 'orange', 
      label: `Vence en ${diasRestantes} días`,
      days: diasRestantes
    };
  } else {
    return { 
      status: 'vigente', 
      color: 'green', 
      label: `Vigente (${diasRestantes} días)`,
      days: diasRestantes
    };
  }
};

// Función para obtener el ícono según el tipo de documento
const getTipoIcon = (tipoDocumento: TipoDocumento) => {
  switch (tipoDocumento) {
    case 'licenciaConducir':
    case 'carnetProfesional':
      return <IconLicense size={16} />;
    case 'evaluacionMedica':
    case 'psicofisico':
    case 'aptitudPsicofisica':
      return <IconStethoscope size={16} />;
    case 'vtv':
    case 'seguro':
    case 'ruta':
    case 'senasa':
      return <IconTruck size={16} />;
    default:
      return <IconFileText size={16} />;
  }
};

// Función para obtener el ícono de la entidad
const getEntidadIcon = (entidadTipo: 'vehiculo' | 'personal') => {
  return entidadTipo === 'vehiculo' ? <IconTruck size={16} /> : <IconUser size={16} />;
};

export const GenericDocumentTable: React.FC<GenericDocumentTableProps> = ({
  documentos,
  onUpdate,
  onUpload,
  onDownload,
  onViewEntity,
  onEditEntity,
  readOnly = false,
  showFilters = true,
  showStatistics = true,
  showEntityActions = true,
  maxExpireDays = 90,
  allowedEntityTypes = ['vehiculo', 'personal'],
  allowedDocumentTypes
}) => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterEntidad, setFilterEntidad] = useState<string>('todos');
  
  // Estados para el modal de edición
  const [editingDoc, setEditingDoc] = useState<DocumentoGenerico | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  // Documentos filtrados
  const filteredDocumentos = useMemo(() => {
    return documentos.filter(doc => {
      // Filtro por término de búsqueda
      const matchesSearch = !searchTerm || 
        TIPOS_DOCUMENTO[doc.tipo].toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.entidadNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.entidadInfo?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por tipo de documento
      const matchesTipo = filterTipo === 'todos' || doc.tipo === filterTipo;
      
      // Filtro por estado
      const status = getDocumentStatus(doc.fechaVencimiento);
      const matchesEstado = filterEstado === 'todos' || status.status === filterEstado;
      
      // Filtro por tipo de entidad
      const matchesEntidad = filterEntidad === 'todos' || doc.entidadTipo === filterEntidad;
      
      // Filtro por entidades permitidas
      const allowedEntity = allowedEntityTypes.includes(doc.entidadTipo);
      
      // Filtro por tipos de documento permitidos
      const allowedDocType = !allowedDocumentTypes || allowedDocumentTypes.includes(doc.tipo);
      
      // Filtro por días hasta vencimiento (solo para estadísticas)
      const withinExpireDays = !doc.fechaVencimiento || 
        (status.days !== undefined && status.days <= maxExpireDays) || 
        status.status === 'vencido';
      
      return matchesSearch && matchesTipo && matchesEstado && matchesEntidad && 
             allowedEntity && allowedDocType && doc.activo && withinExpireDays;
    });
  }, [documentos, searchTerm, filterTipo, filterEstado, filterEntidad, allowedEntityTypes, allowedDocumentTypes, maxExpireDays]);

  // Estadísticas
  const statistics = useMemo(() => {
    const total = filteredDocumentos.length;
    const vencidos = filteredDocumentos.filter(d => getDocumentStatus(d.fechaVencimiento).status === 'vencido').length;
    const criticos = filteredDocumentos.filter(d => getDocumentStatus(d.fechaVencimiento).status === 'critico').length;
    const porVencer = filteredDocumentos.filter(d => getDocumentStatus(d.fechaVencimiento).status === 'por-vencer').length;
    const vigentes = filteredDocumentos.filter(d => getDocumentStatus(d.fechaVencimiento).status === 'vigente').length;
    
    return { total, vencidos, criticos, porVencer, vigentes };
  }, [filteredDocumentos]);

  // Manejadores
  const handleEdit = (documento: DocumentoGenerico) => {
    setEditingDoc(documento);
    open();
  };

  const handleSave = () => {
    if (!editingDoc || !onUpdate) return;
    
    const updatedDocs = documentos.map(doc => 
      doc._id === editingDoc._id ? editingDoc : doc
    );
    onUpdate(updatedDocs);
    close();
    setEditingDoc(null);
  };

  const handleDelete = (docId: string) => {
    if (!onUpdate) return;
    
    const updatedDocs = documentos.map(doc => 
      doc._id === docId ? { ...doc, activo: false } : doc
    );
    onUpdate(updatedDocs);
  };

  const handleAdd = () => {
    const newDoc: DocumentoGenerico = {
      _id: `temp_${Date.now()}`,
      tipo: 'otros',
      activo: true,
      entidadId: '',
      entidadNombre: '',
      entidadTipo: allowedEntityTypes[0] || 'vehiculo'
    };
    setEditingDoc(newDoc);
    open();
  };

  // Render de una fila de la tabla
  const renderRow = (documento: DocumentoGenerico) => {
    const status = getDocumentStatus(documento.fechaVencimiento);
    
    return (
      <Table.Tr key={documento._id}>
        <Table.Td>
          <Group gap="xs">
            {getEntidadIcon(documento.entidadTipo)}
            <Box>
              <Text size="sm" fw={500}>{documento.entidadNombre}</Text>
              {documento.entidadInfo && (
                <Text size="xs" c="dimmed">{documento.entidadInfo}</Text>
              )}
              {documento.empresa && (
                <Badge size="xs" variant="light" color="blue">{documento.empresa}</Badge>
              )}
            </Box>
          </Group>
        </Table.Td>
        
        <Table.Td>
          <Group gap="xs">
            {getTipoIcon(documento.tipo)}
            <Box>
              <Text size="sm">{TIPOS_DOCUMENTO[documento.tipo]}</Text>
              {documento.categoria && (
                <Text size="xs" c="dimmed">Cat: {documento.categoria}</Text>
              )}
              {documento.resultado && (
                <Text size="xs" c="dimmed">Resultado: {documento.resultado}</Text>
              )}
            </Box>
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
            {/* Acciones de archivo */}
            {documento.archivo && onDownload && (
              <Tooltip label="Descargar archivo">
                <ActionIcon 
                  size="sm" 
                  variant="light" 
                  color="blue"
                  onClick={() => onDownload(documento)}
                >
                  <IconDownload size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {!readOnly && onUpload && (
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
                      if (file) onUpload(documento, file);
                    };
                    input.click();
                  }}
                >
                  <IconUpload size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {/* Acciones de entidad */}
            {showEntityActions && onViewEntity && (
              <Tooltip label="Ver entidad">
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => onViewEntity(documento.entidadId, documento.entidadTipo)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {showEntityActions && onEditEntity && (
              <Tooltip label="Editar entidad">
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="blue"
                  onClick={() => onEditEntity(documento.entidadId, documento.entidadTipo)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {/* Acciones de documento */}
            {!readOnly && onUpdate && (
              <>
                <Tooltip label="Editar documento">
                  <ActionIcon 
                    size="sm" 
                    variant="light" 
                    onClick={() => handleEdit(documento)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                
                <Tooltip label="Eliminar documento">
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

  return (
    <Stack gap="md">
      {/* Estadísticas */}
      {showStatistics && (
        <Card withBorder p="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>Estado de Documentación</Title>
            <Text size="sm" c="dimmed">
              {filteredDocumentos.length} documentos
            </Text>
          </Group>
          
          <Progress
            size="lg"
            value={statistics.total > 0 ? (statistics.vigentes / statistics.total) * 100 : 0}
            color="green"
            mb="md"
          />
          
          <Group gap="xl">
            <Group gap="xs">
              <ThemeIcon size="sm" color="green" variant="light">
                <span style={{ fontSize: '12px' }}>{statistics.vigentes}</span>
              </ThemeIcon>
              <Text size="sm">Vigentes</Text>
            </Group>
            <Group gap="xs">
              <ThemeIcon size="sm" color="orange" variant="light">
                <span style={{ fontSize: '12px' }}>{statistics.porVencer}</span>
              </ThemeIcon>
              <Text size="sm">Por Vencer</Text>
            </Group>
            <Group gap="xs">
              <ThemeIcon size="sm" color="red" variant="light">
                <span style={{ fontSize: '12px' }}>{statistics.criticos}</span>
              </ThemeIcon>
              <Text size="sm">Críticos</Text>
            </Group>
            <Group gap="xs">
              <ThemeIcon size="sm" color="red" variant="light">
                <span style={{ fontSize: '12px' }}>{statistics.vencidos}</span>
              </ThemeIcon>
              <Text size="sm">Vencidos</Text>
            </Group>
          </Group>
        </Card>
      )}

      {/* Alertas */}
      {statistics.vencidos > 0 && (
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          color="red" 
          variant="light"
        >
          <Text size="sm">
            {statistics.vencidos} documento{statistics.vencidos > 1 ? 's' : ''} vencido{statistics.vencidos > 1 ? 's' : ''}
          </Text>
        </Alert>
      )}
      
      {statistics.criticos > 0 && (
        <Alert 
          icon={<IconX size={16} />} 
          color="red" 
          variant="light"
        >
          <Text size="sm">
            {statistics.criticos} documento{statistics.criticos > 1 ? 's' : ''} crítico{statistics.criticos > 1 ? 's' : ''} (vence en 7 días o menos)
          </Text>
        </Alert>
      )}

      {statistics.porVencer > 0 && (
        <Alert 
          icon={<IconCalendar size={16} />} 
          color="orange" 
          variant="light"
        >
          <Text size="sm">
            {statistics.porVencer} documento{statistics.porVencer > 1 ? 's' : ''} por vencer en 30 días
          </Text>
        </Alert>
      )}

      {/* Controles de filtrado */}
      {showFilters && (
        <Paper p="md" withBorder>
          <Flex gap="md" align="end" wrap="wrap">
            <TextInput
              placeholder="Buscar documentos, entidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1, minWidth: 200 }}
            />
            
            <Select
              placeholder="Tipo de entidad"
              value={filterEntidad}
              onChange={(value) => setFilterEntidad(value || 'todos')}
              data={[
                { value: 'todos', label: 'Todas las entidades' },
                ...(allowedEntityTypes.includes('vehiculo') ? [{ value: 'vehiculo', label: 'Vehículos' }] : []),
                ...(allowedEntityTypes.includes('personal') ? [{ value: 'personal', label: 'Personal' }] : [])
              ]}
              style={{ minWidth: 150 }}
            />
            
            <Select
              placeholder="Tipo de documento"
              value={filterTipo}
              onChange={(value) => setFilterTipo(value || 'todos')}
              data={[
                { value: 'todos', label: 'Todos los tipos' },
                ...Object.entries(TIPOS_DOCUMENTO)
                  .filter(([key]) => !allowedDocumentTypes || allowedDocumentTypes.includes(key as TipoDocumento))
                  .map(([key, label]) => ({ value: key, label }))
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
                { value: 'critico', label: 'Críticos' },
                { value: 'vencido', label: 'Vencidos' },
                { value: 'sin-fecha', label: 'Sin fecha' }
              ]}
              style={{ minWidth: 150 }}
            />
            
            {!readOnly && onUpdate && (
              <Button onClick={handleAdd} leftSection={<IconFileText size={16} />}>
                Agregar Documento
              </Button>
            )}
          </Flex>
        </Paper>
      )}

      {/* Tabla de documentos */}
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Entidad</Table.Th>
            <Table.Th>Tipo de Documento</Table.Th>
            <Table.Th>Número</Table.Th>
            <Table.Th>F. Emisión</Table.Th>
            <Table.Th>F. Vencimiento</Table.Th>
            <Table.Th style={{ width: 160 }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredDocumentos.length > 0 ? (
            filteredDocumentos.map(renderRow)
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
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
              data={Object.entries(TIPOS_DOCUMENTO)
                .filter(([key]) => !allowedDocumentTypes || allowedDocumentTypes.includes(key as TipoDocumento))
                .map(([key, label]) => ({ value: key, label }))}
              required
            />
            
            <TextInput
              label="Número"
              value={editingDoc.numero || ''}
              onChange={(e) => setEditingDoc(prev => prev ? { ...prev, numero: e.currentTarget.value } : null)}
              placeholder="Número del documento"
            />
            
            {(editingDoc.tipo === 'licenciaConducir' || editingDoc.tipo === 'carnetProfesional') && (
              <TextInput
                label="Categoría"
                value={editingDoc.categoria || ''}
                onChange={(e) => setEditingDoc(prev => prev ? { ...prev, categoria: e.currentTarget.value } : null)}
                placeholder="Categoría de licencia"
              />
            )}
            
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
            
            {(editingDoc.tipo === 'evaluacionMedica' || editingDoc.tipo === 'psicofisico' || editingDoc.tipo === 'aptitudPsicofisica') && (
              <TextInput
                label="Resultado"
                value={editingDoc.resultado || ''}
                onChange={(e) => setEditingDoc(prev => prev ? { ...prev, resultado: e.currentTarget.value } : null)}
                placeholder="Resultado del examen"
              />
            )}
            
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
    </Stack>
  );
};

export default GenericDocumentTable;