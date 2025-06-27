import React, { useMemo } from 'react';
import {
  Table,
  Badge,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Card,
  Stack,
  Title,
  Alert,
  Progress,
  ThemeIcon,
  Select,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconLicense,
  IconStethoscope,
  IconEye,
  IconEdit,
  IconDownload,
  IconFilter,
} from '@tabler/icons-react';
import type { Personal } from '../../types';

interface DocumentoInfo {
  personalId: string;
  personalNombre: string;
  dni: string;
  empresa: string;
  tipo: string;
  tipoDocumento: string;
  numero?: string;
  categoria?: string;
  fechaEmision?: Date;
  fechaVencimiento?: Date;
  resultado?: string;
  daysUntilExpiry: number;
  status: 'expired' | 'expiring' | 'valid' | 'missing';
}

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

  // Extract all documents from personal data
  const documentos = useMemo(() => {
    const docs: DocumentoInfo[] = [];
    const now = new Date();

    personal.forEach(person => {
      const empresaInfo = typeof person.empresa === 'object' ? person.empresa : null;
      
      if (person.documentacion) {
        const { documentacion } = person;

        // Licencia de Conducir
        if (documentacion.licenciaConducir?.numero) {
          const vencimiento = documentacion.licenciaConducir.vencimiento;
          const daysUntilExpiry = vencimiento ? 
            Math.ceil((new Date(vencimiento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
            Infinity;

          docs.push({
            personalId: person._id,
            personalNombre: `${person.nombre} ${person.apellido}`,
            dni: person.dni,
            empresa: empresaInfo?.nombre || 'Sin empresa',
            tipo: person.tipo,
            tipoDocumento: 'Licencia de Conducir',
            numero: documentacion.licenciaConducir.numero,
            categoria: documentacion.licenciaConducir.categoria,
            fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
            daysUntilExpiry,
            status: getDocumentStatus(daysUntilExpiry),
          });
        }

        // Carnet Profesional
        if (documentacion.carnetProfesional?.numero) {
          const vencimiento = documentacion.carnetProfesional.vencimiento;
          const daysUntilExpiry = vencimiento ? 
            Math.ceil((new Date(vencimiento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
            Infinity;

          docs.push({
            personalId: person._id,
            personalNombre: `${person.nombre} ${person.apellido}`,
            dni: person.dni,
            empresa: empresaInfo?.nombre || 'Sin empresa',
            tipo: person.tipo,
            tipoDocumento: 'Carnet Profesional',
            numero: documentacion.carnetProfesional.numero,
            fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
            daysUntilExpiry,
            status: getDocumentStatus(daysUntilExpiry),
          });
        }

        // Evaluación Médica
        if (documentacion.evaluacionMedica?.fecha) {
          const fecha = documentacion.evaluacionMedica.fecha;
          const vencimiento = documentacion.evaluacionMedica.vencimiento;
          const daysUntilExpiry = vencimiento ? 
            Math.ceil((new Date(vencimiento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
            Infinity;

          docs.push({
            personalId: person._id,
            personalNombre: `${person.nombre} ${person.apellido}`,
            dni: person.dni,
            empresa: empresaInfo?.nombre || 'Sin empresa',
            tipo: person.tipo,
            tipoDocumento: 'Evaluación Médica',
            fechaEmision: fecha ? new Date(fecha) : undefined,
            fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
            resultado: documentacion.evaluacionMedica.resultado,
            daysUntilExpiry,
            status: getDocumentStatus(daysUntilExpiry),
          });
        }

        // Psicofísico
        if (documentacion.psicofisico?.fecha) {
          const fecha = documentacion.psicofisico.fecha;
          const vencimiento = documentacion.psicofisico.vencimiento;
          const daysUntilExpiry = vencimiento ? 
            Math.ceil((new Date(vencimiento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
            Infinity;

          docs.push({
            personalId: person._id,
            personalNombre: `${person.nombre} ${person.apellido}`,
            dni: person.dni,
            empresa: empresaInfo?.nombre || 'Sin empresa',
            tipo: person.tipo,
            tipoDocumento: 'Psicofísico',
            fechaEmision: fecha ? new Date(fecha) : undefined,
            fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
            resultado: documentacion.psicofisico.resultado,
            daysUntilExpiry,
            status: getDocumentStatus(daysUntilExpiry),
          });
        }
      }
    });

    return docs;
  }, [personal]);

  // Filter documents
  const filteredDocumentos = useMemo(() => {
    return documentos.filter(doc => {
      // Filter by status
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      
      // Filter by tipo
      if (tipoFilter !== 'all' && doc.tipo !== tipoFilter) return false;
      
      // Only show documents that expire within the specified days
      if (doc.daysUntilExpiry > maxExpireDays && doc.status !== 'expired') return false;
      
      return true;
    });
  }, [documentos, statusFilter, tipoFilter, maxExpireDays]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = documentos.length;
    const expired = documentos.filter(d => d.status === 'expired').length;
    const expiring = documentos.filter(d => d.status === 'expiring').length;
    const valid = documentos.filter(d => d.status === 'valid').length;
    
    return { total, expired, expiring, valid };
  }, [documentos]);

  function getDocumentStatus(daysUntilExpiry: number): 'expired' | 'expiring' | 'valid' | 'missing' {
    if (daysUntilExpiry === Infinity) return 'missing';
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'expired': return 'red';
      case 'expiring': return 'yellow';
      case 'valid': return 'green';
      default: return 'gray';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'expired': return 'Vencido';
      case 'expiring': return 'Por Vencer';
      case 'valid': return 'Vigente';
      default: return 'Sin Datos';
    }
  }

  function getTipoIcon(tipoDocumento: string) {
    switch (tipoDocumento) {
      case 'Licencia de Conducir':
      case 'Carnet Profesional':
        return <IconLicense size={16} />;
      case 'Evaluación Médica':
      case 'Psicofísico':
        return <IconStethoscope size={16} />;
      default:
        return <IconCalendarEvent size={16} />;
    }
  }

  function formatDate(date: Date | undefined) {
    if (!date) return '-';
    return date.toLocaleDateString('es-AR');
  }

  function getDaysUntilText(days: number, status: string) {
    if (status === 'expired') return `Vencido hace ${Math.abs(days)} días`;
    if (status === 'expiring') return `Vence en ${days} días`;
    if (status === 'valid') return `Vigente (${days} días)`;
    return '-';
  }

  const findPersonalById = (id: string) => {
    return personal.find(p => p._id === id);
  };

  return (
    <Stack gap="md">
      {/* Statistics Card */}
      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Estado de Documentación</Title>
          <Text size="sm" color="dimmed">
            {filteredDocumentos.length} de {documentos.length} documentos
          </Text>
        </Group>
        
        {/* Progress component no longer supports sections in Mantine 7 */}
        <Progress
          size="lg"
          value={(stats.valid / stats.total) * 100}
          color="green"
        />
        
        <Group gap="xl" mt="md">
          <Group gap="xs">
            <ThemeIcon size="sm" color="green" variant="light">
              <span style={{ fontSize: '12px' }}>{stats.valid}</span>
            </ThemeIcon>
            <Text size="sm">Vigentes</Text>
          </Group>
          <Group gap="xs">
            <ThemeIcon size="sm" color="yellow" variant="light">
              <span style={{ fontSize: '12px' }}>{stats.expiring}</span>
            </ThemeIcon>
            <Text size="sm">Por Vencer</Text>
          </Group>
          <Group gap="xs">
            <ThemeIcon size="sm" color="red" variant="light">
              <span style={{ fontSize: '12px' }}>{stats.expired}</span>
            </ThemeIcon>
            <Text size="sm">Vencidos</Text>
          </Group>
        </Group>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card withBorder p="md">
          <Group>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'all')}
              data={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'expired', label: 'Vencidos' },
                { value: 'expiring', label: 'Por vencer' },
                { value: 'valid', label: 'Vigentes' },
              ]}
              leftSection={<IconFilter size={16} />}
            />
            <Select
              label="Tipo de Personal"
              value={tipoFilter}
              onChange={(value) => setTipoFilter(value || 'all')}
              data={[
                { value: 'all', label: 'Todos los tipos' },
                { value: 'Conductor', label: 'Conductor' },
                { value: 'Administrativo', label: 'Administrativo' },
                { value: 'Mecánico', label: 'Mecánico' },
                { value: 'Supervisor', label: 'Supervisor' },
                { value: 'Otro', label: 'Otro' },
              ]}
              leftSection={<IconFilter size={16} />}
            />
          </Group>
        </Card>
      )}

      {/* Alerts for critical issues */}
      {stats.expired > 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Documentos Vencidos"
          color="red"
        >
          Hay {stats.expired} documento{stats.expired > 1 ? 's' : ''} vencido{stats.expired > 1 ? 's' : ''} que requieren atención inmediata.
        </Alert>
      )}

      {stats.expiring > 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Documentos Por Vencer"
          color="yellow"
        >
          Hay {stats.expiring} documento{stats.expiring > 1 ? 's' : ''} que vence{stats.expiring > 1 ? 'n' : ''} en los próximos 30 días.
        </Alert>
      )}

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
              <tr key={`${doc.personalId}-${doc.tipoDocumento}-${index}`}>
                <td>
                  <div>
                    <Text size="sm" fw={500}>
                      {doc.personalNombre}
                    </Text>
                    <Text size="xs" color="dimmed">
                      DNI: {doc.dni}
                    </Text>
                  </div>
                </td>
                <td>
                  <Badge size="sm" variant="light" color="blue">
                    {doc.empresa}
                  </Badge>
                </td>
                <td>
                  <Group gap="xs">
                    {getTipoIcon(doc.tipoDocumento)}
                    <div>
                      <Text size="sm">{doc.tipoDocumento}</Text>
                      {doc.categoria && (
                        <Text size="xs" color="dimmed">
                          Categoría: {doc.categoria}
                        </Text>
                      )}
                      {doc.resultado && (
                        <Text size="xs" color="dimmed">
                          Resultado: {doc.resultado}
                        </Text>
                      )}
                    </div>
                  </Group>
                </td>
                <td>
                  <Text size="sm">{doc.numero || '-'}</Text>
                </td>
                <td>
                  <Text size="sm">{formatDate(doc.fechaVencimiento)}</Text>
                </td>
                <td>
                  <Badge
                    color={getStatusColor(doc.status)}
                    variant="light"
                    size="sm"
                  >
                    {getStatusLabel(doc.status)}
                  </Badge>
                </td>
                <td>
                  <Text 
                    size="xs" 
                    color={doc.status === 'expired' ? 'red' : 
                           doc.status === 'expiring' ? 'orange' : 'dimmed'}
                  >
                    {getDaysUntilText(doc.daysUntilExpiry, doc.status)}
                  </Text>
                </td>
                <td>
                  <Group gap="xs">
                    {onViewPersonal && (
                      <Tooltip label="Ver personal">
                        <ActionIcon
                          size="sm"
                          onClick={() => {
                            const person = findPersonalById(doc.personalId);
                            if (person) onViewPersonal(person);
                          }}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {onEditPersonal && (
                      <Tooltip label="Editar personal">
                        <ActionIcon
                          size="sm"
                          color="blue"
                          onClick={() => {
                            const person = findPersonalById(doc.personalId);
                            if (person) onEditPersonal(person);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </td>
              </tr>
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