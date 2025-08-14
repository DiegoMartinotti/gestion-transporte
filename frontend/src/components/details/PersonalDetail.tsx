import React from 'react';
import {
  Title,
  Grid,
  Text,
  Badge,
  Stack,
  Group,
  Card,
  Avatar,
  Timeline,
  Table,
  Alert,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconUser,
  IconId,
  IconPhone,
  IconMapPin,
  IconBuilding,
  IconLicense,
  IconSchool,
  IconAlertTriangle,
  IconClock,
  IconExclamationMark,
  IconEdit,
} from '@tabler/icons-react';
import type { Personal, Empresa } from '../../types';

// Types for helper functions
interface DireccionData {
  calle?: string;
  numero?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

interface DatosLaboralesData {
  categoria?: string;
  obraSocial?: string;
  art?: string;
}

interface PeriodoEmpleo {
  fechaIngreso: Date | string;
  fechaEgreso?: Date | string;
  categoria?: string;
  motivo?: string;
}

// Helper functions for calculations and data processing
const calculateAge = (fechaNacimiento: Date | string | undefined): number | null => {
  if (!fechaNacimiento) return null;
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getDocumentStatus = (vencimiento: Date | string | undefined) => {
  if (!vencimiento) return null;
  const now = new Date();
  const expiry = new Date(vencimiento);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0)
    return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'red' };
  if (daysUntilExpiry <= 30) return { status: 'expiring', days: daysUntilExpiry, color: 'yellow' };
  return { status: 'valid', days: daysUntilExpiry, color: 'green' };
};

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'No especificado';
  return new Date(date).toLocaleDateString('es-AR');
};

const getTipoColor = (tipo: string): string => {
  const colors = {
    Conductor: 'blue',
    Administrativo: 'green',
    Mecánico: 'orange',
    Supervisor: 'purple',
  };
  return colors[tipo as keyof typeof colors] || 'gray';
};

const getIncidentColor = (tipo: string): string => {
  const colors = {
    Accidente: 'red',
    Infracción: 'orange',
  };
  return colors[tipo as keyof typeof colors] || 'gray';
};

const isCurrentlyEmployed = (periodosEmpleo: PeriodoEmpleo[]): boolean => {
  if (!periodosEmpleo || periodosEmpleo.length === 0) return false;
  const lastPeriod = periodosEmpleo[periodosEmpleo.length - 1];
  return !lastPeriod.fechaEgreso;
};

const getStatusText = (status: { status: string; days: number } | null): string => {
  if (!status) return 'Sin vencimiento';
  if (status.status === 'expired') return `Vencida hace ${status.days} días`;
  if (status.status === 'expiring') return `Vence en ${status.days} días`;
  return 'Vigente';
};

const hasValidAddress = (direccion: DireccionData | undefined): boolean => {
  return direccion && Object.values(direccion).some((v) => v);
};

const hasValidDatosLaborales = (datosLaborales: DatosLaboralesData | undefined): boolean => {
  return datosLaborales && Object.values(datosLaborales).some((v) => v);
};

const buildAddressString = (direccion: DireccionData): string => {
  return [
    direccion.calle,
    direccion.numero,
    direccion.localidad,
    direccion.provincia,
    direccion.codigoPostal,
  ]
    .filter(Boolean)
    .join(', ');
};

// Sub-components for better organization
const HeaderCard: React.FC<{
  personal: Personal;
  empresa: Empresa | null;
  onEdit?: (personal: Personal) => void;
  showEditButton: boolean;
  isEmployed: boolean;
}> = ({ personal, onEdit, showEditButton, isEmployed }) => (
  <Card withBorder p="lg">
    <Group justify="space-between" mb="md">
      <Group>
        <Avatar size="xl" radius="xl">
          <IconUser size={32} />
        </Avatar>
        <div>
          <Group gap="xs" align="center">
            <Title order={2}>
              {personal.nombre} {personal.apellido}
            </Title>
            <Badge size="lg" color={getTipoColor(personal.tipo)} variant="light">
              {personal.tipo}
            </Badge>
            <Badge
              size="lg"
              color={personal.activo ? 'green' : 'gray'}
              variant={personal.activo ? 'light' : 'outline'}
            >
              {personal.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Group>
          <Group gap="md" mt="xs">
            <Text size="sm" c="dimmed">
              <IconId size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              DNI: {personal.dni}
            </Text>
            {personal.cuil && (
              <Text size="sm" c="dimmed">
                CUIL: {personal.cuil}
              </Text>
            )}
            {personal.numeroLegajo && (
              <Text size="sm" c="dimmed">
                Legajo: {personal.numeroLegajo}
              </Text>
            )}
          </Group>
        </div>
      </Group>

      {showEditButton && onEdit && (
        <Tooltip label="Editar personal">
          <ActionIcon size="lg" color="blue" onClick={() => onEdit(personal)}>
            <IconEdit size={20} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>

    {!isEmployed && (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        title="Empleado sin período activo"
        color="yellow"
        mb="md"
      >
        Este empleado no tiene un período de empleo activo actualmente.
      </Alert>
    )}
  </Card>
);

const PersonalInfoCard: React.FC<{
  personal: Personal;
  empresa: Empresa | null;
  age: number | null;
}> = ({ personal, empresa, age }) => (
  <Card withBorder p="md">
    <Title order={4} mb="md">
      <IconUser size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
      Información Personal
    </Title>
    <Stack gap="sm">
      {personal.fechaNacimiento && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Fecha de Nacimiento:
          </Text>
          <Text size="sm">
            {formatDate(personal.fechaNacimiento)}
            {age && (
              <Text span c="dimmed">
                {' '}
                ({age} años)
              </Text>
            )}
          </Text>
        </Group>
      )}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Tipo:
        </Text>
        <Badge color={getTipoColor(personal.tipo)} variant="light">
          {personal.tipo}
        </Badge>
      </Group>
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Estado:
        </Text>
        <Badge color={personal.activo ? 'green' : 'gray'}>
          {personal.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </Group>
      {empresa && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Empresa:
          </Text>
          <Text size="sm">{empresa.nombre}</Text>
        </Group>
      )}
    </Stack>
  </Card>
);

const ContactInfoCard: React.FC<{ personal: Personal }> = ({ personal }) => (
  <Card withBorder p="md">
    <Title order={4} mb="md">
      <IconPhone size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
      Información de Contacto
    </Title>
    <Stack gap="sm">
      {personal.contacto?.telefono && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Teléfono:
          </Text>
          <Text size="sm">{personal.contacto.telefono}</Text>
        </Group>
      )}
      {personal.contacto?.telefonoEmergencia && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Tel. Emergencia:
          </Text>
          <Text size="sm">{personal.contacto.telefonoEmergencia}</Text>
        </Group>
      )}
      {personal.contacto?.email && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Email:
          </Text>
          <Text size="sm">{personal.contacto.email}</Text>
        </Group>
      )}
    </Stack>
  </Card>
);

const AddressCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (!hasValidAddress(personal.direccion)) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconMapPin size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Dirección
      </Title>
      <Text size="sm">{buildAddressString(personal.direccion)}</Text>
    </Card>
  );
};

const EmploymentHistoryCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (!personal.periodosEmpleo || personal.periodosEmpleo.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconBuilding size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Historial de Empleo
      </Title>
      <Timeline bulletSize={24} lineWidth={2}>
        {personal.periodosEmpleo.map((periodo, index) => (
          <Timeline.Item
            key={index}
            bullet={
              <ThemeIcon size={24} variant="filled" color={!periodo.fechaEgreso ? 'green' : 'blue'}>
                <IconClock size={12} />
              </ThemeIcon>
            }
            title={
              <Group>
                <Text size="sm" fw={500}>
                  {periodo.categoria || 'Sin categoría especificada'}
                </Text>
                {!periodo.fechaEgreso && (
                  <Badge size="xs" color="green">
                    Actual
                  </Badge>
                )}
              </Group>
            }
          >
            <Text size="xs" c="dimmed" mb="xs">
              {formatDate(periodo.fechaIngreso)} -{' '}
              {periodo.fechaEgreso ? formatDate(periodo.fechaEgreso) : 'Actualidad'}
            </Text>
            {periodo.motivo && (
              <Text size="xs" c="dimmed">
                Motivo: {periodo.motivo}
              </Text>
            )}
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};

const DocumentItem: React.FC<{
  title: string;
  document: { vencimiento?: Date | string };
  fields: Array<{ label: string; value?: string }>;
}> = ({ title, document, fields }) => {
  const status = getDocumentStatus(document.vencimiento);

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          {title}
        </Text>
        {document.vencimiento && (
          <Badge color={status?.color} variant="light">
            {getStatusText(status)}
          </Badge>
        )}
      </Group>
      <Group gap="md">
        {fields.map(
          (field, index) =>
            field.value && (
              <Text key={index} size="xs" c="dimmed">
                {field.label}: {field.value}
              </Text>
            )
        )}
      </Group>
    </div>
  );
};

const DocumentationCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (personal.tipo !== 'Conductor' || !personal.documentacion) return null;

  const { documentacion } = personal;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconLicense size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Documentación
      </Title>
      <Stack gap="md">
        {documentacion.licenciaConducir?.numero && (
          <DocumentItem
            title="Licencia de Conducir"
            document={documentacion.licenciaConducir}
            fields={[
              { label: 'Número', value: documentacion.licenciaConducir.numero },
              { label: 'Categoría', value: documentacion.licenciaConducir.categoria },
              {
                label: 'Vencimiento',
                value: formatDate(documentacion.licenciaConducir.vencimiento),
              },
            ]}
          />
        )}

        {documentacion.carnetProfesional?.numero && (
          <DocumentItem
            title="Carnet Profesional"
            document={documentacion.carnetProfesional}
            fields={[
              { label: 'Número', value: documentacion.carnetProfesional.numero },
              {
                label: 'Vencimiento',
                value: formatDate(documentacion.carnetProfesional.vencimiento),
              },
            ]}
          />
        )}

        {documentacion.evaluacionMedica?.fecha && (
          <DocumentItem
            title="Evaluación Médica"
            document={documentacion.evaluacionMedica}
            fields={[
              { label: 'Fecha', value: formatDate(documentacion.evaluacionMedica.fecha) },
              { label: 'Resultado', value: documentacion.evaluacionMedica.resultado },
              {
                label: 'Vencimiento',
                value: formatDate(documentacion.evaluacionMedica.vencimiento),
              },
            ]}
          />
        )}

        {documentacion.psicofisico?.fecha && (
          <DocumentItem
            title="Psicofísico"
            document={documentacion.psicofisico}
            fields={[
              { label: 'Fecha', value: formatDate(documentacion.psicofisico.fecha) },
              { label: 'Resultado', value: documentacion.psicofisico.resultado },
              { label: 'Vencimiento', value: formatDate(documentacion.psicofisico.vencimiento) },
            ]}
          />
        )}
      </Stack>
    </Card>
  );
};

const LaborDataCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (!hasValidDatosLaborales(personal.datosLaborales)) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconBuilding size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Datos Laborales
      </Title>
      <Grid>
        {personal.datosLaborales?.categoria && (
          <Grid.Col span={4}>
            <Text size="sm" c="dimmed">
              Categoría:
            </Text>
            <Text size="sm">{personal.datosLaborales?.categoria}</Text>
          </Grid.Col>
        )}
        {personal.datosLaborales?.obraSocial && (
          <Grid.Col span={4}>
            <Text size="sm" c="dimmed">
              Obra Social:
            </Text>
            <Text size="sm">{personal.datosLaborales?.obraSocial}</Text>
          </Grid.Col>
        )}
        {personal.datosLaborales?.art && (
          <Grid.Col span={4}>
            <Text size="sm" c="dimmed">
              ART:
            </Text>
            <Text size="sm">{personal.datosLaborales?.art}</Text>
          </Grid.Col>
        )}
      </Grid>
    </Card>
  );
};

const TrainingCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (!personal.capacitaciones || personal.capacitaciones.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconSchool size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Capacitaciones
      </Title>
      <Table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Vencimiento</th>
            <th>Institución</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {personal.capacitaciones.map((capacitacion, index) => {
            const status = getDocumentStatus(capacitacion.vencimiento);
            return (
              <tr key={index}>
                <td>{capacitacion.nombre}</td>
                <td>{formatDate(capacitacion.fecha)}</td>
                <td>{formatDate(capacitacion.vencimiento)}</td>
                <td>{capacitacion.institucion || '-'}</td>
                <td>
                  {status && (
                    <Badge color={status.color} variant="light" size="sm">
                      {status.status === 'expired'
                        ? 'Vencida'
                        : status.status === 'expiring'
                          ? 'Por Vencer'
                          : 'Vigente'}
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
};

const IncidentsCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (!personal.incidentes || personal.incidentes.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconExclamationMark size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Incidentes
      </Title>
      <Table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Consecuencias</th>
          </tr>
        </thead>
        <tbody>
          {personal.incidentes.map((incidente, index) => (
            <tr key={index}>
              <td>{formatDate(incidente.fecha)}</td>
              <td>
                <Badge color={getIncidentColor(incidente.tipo || 'otro')} variant="light" size="sm">
                  {incidente.tipo}
                </Badge>
              </td>
              <td>{incidente.descripcion}</td>
              <td>{incidente.consecuencias || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
};

const ObservationsCard: React.FC<{ personal: Personal }> = ({ personal }) => {
  if (!personal.observaciones) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        Observaciones
      </Title>
      <Text size="sm">{personal.observaciones}</Text>
    </Card>
  );
};

const MetadataCard: React.FC<{ personal: Personal }> = ({ personal }) => (
  <Card withBorder p="md">
    <Title order={4} mb="md">
      Información del Sistema
    </Title>
    <Grid>
      <Grid.Col span={6}>
        <Text size="sm" c="dimmed">
          Fecha de Creación:
        </Text>
        <Text size="sm">{formatDate(personal.createdAt)}</Text>
      </Grid.Col>
      <Grid.Col span={6}>
        <Text size="sm" c="dimmed">
          Última Actualización:
        </Text>
        <Text size="sm">{formatDate(personal.updatedAt)}</Text>
      </Grid.Col>
    </Grid>
  </Card>
);

interface PersonalDetailProps {
  personal: Personal;
  onEdit?: (personal: Personal) => void;
  showEditButton?: boolean;
}

export const PersonalDetail: React.FC<PersonalDetailProps> = ({
  personal,
  onEdit,
  showEditButton = true,
}) => {
  const empresa = typeof personal.empresa === 'object' ? personal.empresa : null;
  const age = calculateAge(personal.fechaNacimiento);
  const isEmployed = isCurrentlyEmployed(personal.periodosEmpleo || []);

  return (
    <Stack gap="md">
      <HeaderCard
        personal={personal}
        empresa={empresa}
        onEdit={onEdit}
        showEditButton={showEditButton}
        isEmployed={isEmployed}
      />

      <Grid>
        <Grid.Col span={6}>
          <PersonalInfoCard personal={personal} empresa={empresa} age={age} />
        </Grid.Col>
        <Grid.Col span={6}>
          <ContactInfoCard personal={personal} />
        </Grid.Col>
      </Grid>

      <AddressCard personal={personal} />
      <EmploymentHistoryCard personal={personal} />
      <DocumentationCard personal={personal} />
      <LaborDataCard personal={personal} />
      <TrainingCard personal={personal} />
      <IncidentsCard personal={personal} />
      <ObservationsCard personal={personal} />
      <MetadataCard personal={personal} />
    </Stack>
  );
};
