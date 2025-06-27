import React from 'react';
import {
  Paper,
  Title,
  Grid,
  Text,
  Badge,
  Stack,
  Group,
  Card,
  Avatar,
  Divider,
  Timeline,
  Table,
  Progress,
  Alert,
  Accordion,
  ThemeIcon,
  List,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconUser,
  IconId,
  IconCalendar,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBuilding,
  IconLicense,
  IconStethoscope,
  IconSchool,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconClock,
  IconExclamationMark,
  IconEdit,
} from '@tabler/icons-react';
import type { Personal, Empresa } from '../../types';

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

  // Calculate age
  const getAge = () => {
    if (!personal.fechaNacimiento) return null;
    const today = new Date();
    const birthDate = new Date(personal.fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Check document expiration status
  const getDocumentStatus = (vencimiento: Date | string | undefined) => {
    if (!vencimiento) return null;
    const now = new Date();
    const expiry = new Date(vencimiento);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'red' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', days: daysUntilExpiry, color: 'yellow' };
    return { status: 'valid', days: daysUntilExpiry, color: 'green' };
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No especificado';
    return new Date(date).toLocaleDateString('es-AR');
  };

  // Get tipo color
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Conductor': return 'blue';
      case 'Administrativo': return 'green';
      case 'Mecánico': return 'orange';
      case 'Supervisor': return 'purple';
      default: return 'gray';
    }
  };

  // Check if currently employed
  const isCurrentlyEmployed = () => {
    if (!personal.periodosEmpleo || personal.periodosEmpleo.length === 0) return false;
    const lastPeriod = personal.periodosEmpleo[personal.periodosEmpleo.length - 1];
    return !lastPeriod.fechaEgreso;
  };

  // Get current employment period
  const getCurrentPeriod = () => {
    if (!personal.periodosEmpleo || personal.periodosEmpleo.length === 0) return null;
    return personal.periodosEmpleo.find(periodo => !periodo.fechaEgreso) || 
           personal.periodosEmpleo[personal.periodosEmpleo.length - 1];
  };

  const age = getAge();
  const currentPeriod = getCurrentPeriod();

  return (
    <Stack gap="md">
      {/* Header Card */}
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
                <Badge
                  size="lg"
                  color={getTipoColor(personal.tipo)}
                  variant="light"
                >
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
                <Text size="sm" color="dimmed">
                  <IconId size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  DNI: {personal.dni}
                </Text>
                {personal.cuil && (
                  <Text size="sm" color="dimmed">
                    CUIL: {personal.cuil}
                  </Text>
                )}
                {personal.numeroLegajo && (
                  <Text size="sm" color="dimmed">
                    Legajo: {personal.numeroLegajo}
                  </Text>
                )}
              </Group>
            </div>
          </Group>
          
          {showEditButton && onEdit && (
            <Tooltip label="Editar personal">
              <ActionIcon
                size="lg"
                color="blue"
                onClick={() => onEdit(personal)}
              >
                <IconEdit size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Status Alerts */}
        {!isCurrentlyEmployed() && (
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

      {/* Basic Information */}
      <Grid>
        <Grid.Col span={6}>
          <Card withBorder p="md">
            <Title order={4} mb="md">
              <IconUser size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Información Personal
            </Title>
            <Stack gap="sm">
              {personal.fechaNacimiento && (
                <Group justify="space-between">
                  <Text size="sm" color="dimmed">Fecha de Nacimiento:</Text>
                  <Text size="sm">
                    {formatDate(personal.fechaNacimiento)}
                    {age && <Text span color="dimmed"> ({age} años)</Text>}
                  </Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text size="sm" color="dimmed">Tipo:</Text>
                <Badge color={getTipoColor(personal.tipo)} variant="light">
                  {personal.tipo}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" color="dimmed">Estado:</Text>
                <Badge color={personal.activo ? 'green' : 'gray'}>
                  {personal.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </Group>
              {empresa && (
                <Group justify="space-between">
                  <Text size="sm" color="dimmed">Empresa:</Text>
                  <Text size="sm">{empresa.nombre}</Text>
                </Group>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card withBorder p="md">
            <Title order={4} mb="md">
              <IconPhone size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Información de Contacto
            </Title>
            <Stack gap="sm">
              {personal.contacto?.telefono && (
                <Group justify="space-between">
                  <Text size="sm" color="dimmed">Teléfono:</Text>
                  <Text size="sm">{personal.contacto.telefono}</Text>
                </Group>
              )}
              {personal.contacto?.telefonoEmergencia && (
                <Group justify="space-between">
                  <Text size="sm" color="dimmed">Tel. Emergencia:</Text>
                  <Text size="sm">{personal.contacto.telefonoEmergencia}</Text>
                </Group>
              )}
              {personal.contacto?.email && (
                <Group justify="space-between">
                  <Text size="sm" color="dimmed">Email:</Text>
                  <Text size="sm">{personal.contacto.email}</Text>
                </Group>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Address */}
      {personal.direccion && Object.values(personal.direccion).some(v => v) && (
        <Card withBorder p="md">
          <Title order={4} mb="md">
            <IconMapPin size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Dirección
          </Title>
          <Text size="sm">
            {[
              personal.direccion.calle,
              personal.direccion.numero,
              personal.direccion.localidad,
              personal.direccion.provincia,
              personal.direccion.codigoPostal
            ].filter(Boolean).join(', ')}
          </Text>
        </Card>
      )}

      {/* Employment Periods */}
      {personal.periodosEmpleo && personal.periodosEmpleo.length > 0 && (
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
                  <ThemeIcon
                    size={24}
                    variant="filled"
                    color={!periodo.fechaEgreso ? 'green' : 'blue'}
                  >
                    <IconClock size={12} />
                  </ThemeIcon>
                }
                title={
                  <Group>
                    <Text size="sm" fw={500}>
                      {periodo.categoria || 'Sin categoría especificada'}
                    </Text>
                    {!periodo.fechaEgreso && (
                      <Badge size="xs" color="green">Actual</Badge>
                    )}
                  </Group>
                }
              >
                <Text size="xs" color="dimmed" mb="xs">
                  {formatDate(periodo.fechaIngreso)} - {periodo.fechaEgreso ? formatDate(periodo.fechaEgreso) : 'Actualidad'}
                </Text>
                {periodo.motivo && (
                  <Text size="xs" color="dimmed">
                    Motivo: {periodo.motivo}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}

      {/* Documentation */}
      {personal.tipo === 'Conductor' && personal.documentacion && (
        <Card withBorder p="md">
          <Title order={4} mb="md">
            <IconLicense size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Documentación
          </Title>
          <Stack gap="md">
            {/* Licencia de Conducir */}
            {personal.documentacion.licenciaConducir?.numero && (
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Licencia de Conducir</Text>
                  {personal.documentacion.licenciaConducir.vencimiento && (
                    <Badge
                      color={getDocumentStatus(personal.documentacion.licenciaConducir.vencimiento)?.color}
                      variant="light"
                    >
                      {(() => {
                        const status = getDocumentStatus(personal.documentacion.licenciaConducir.vencimiento);
                        if (!status) return 'Sin vencimiento';
                        if (status.status === 'expired') return `Vencida hace ${status.days} días`;
                        if (status.status === 'expiring') return `Vence en ${status.days} días`;
                        return 'Vigente';
                      })()}
                    </Badge>
                  )}
                </Group>
                <Group gap="md">
                  <Text size="xs" color="dimmed">
                    Número: {personal.documentacion.licenciaConducir.numero}
                  </Text>
                  {personal.documentacion.licenciaConducir.categoria && (
                    <Text size="xs" color="dimmed">
                      Categoría: {personal.documentacion.licenciaConducir.categoria}
                    </Text>
                  )}
                  {personal.documentacion.licenciaConducir.vencimiento && (
                    <Text size="xs" color="dimmed">
                      Vencimiento: {formatDate(personal.documentacion.licenciaConducir.vencimiento)}
                    </Text>
                  )}
                </Group>
              </div>
            )}

            {/* Carnet Profesional */}
            {personal.documentacion.carnetProfesional?.numero && (
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Carnet Profesional</Text>
                  {personal.documentacion.carnetProfesional.vencimiento && (
                    <Badge
                      color={getDocumentStatus(personal.documentacion.carnetProfesional.vencimiento)?.color}
                      variant="light"
                    >
                      {(() => {
                        const status = getDocumentStatus(personal.documentacion.carnetProfesional.vencimiento);
                        if (!status) return 'Sin vencimiento';
                        if (status.status === 'expired') return `Vencido hace ${status.days} días`;
                        if (status.status === 'expiring') return `Vence en ${status.days} días`;
                        return 'Vigente';
                      })()}
                    </Badge>
                  )}
                </Group>
                <Group gap="md">
                  <Text size="xs" color="dimmed">
                    Número: {personal.documentacion.carnetProfesional.numero}
                  </Text>
                  {personal.documentacion.carnetProfesional.vencimiento && (
                    <Text size="xs" color="dimmed">
                      Vencimiento: {formatDate(personal.documentacion.carnetProfesional.vencimiento)}
                    </Text>
                  )}
                </Group>
              </div>
            )}

            {/* Evaluación Médica */}
            {personal.documentacion.evaluacionMedica?.fecha && (
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Evaluación Médica</Text>
                  {personal.documentacion.evaluacionMedica.vencimiento && (
                    <Badge
                      color={getDocumentStatus(personal.documentacion.evaluacionMedica.vencimiento)?.color}
                      variant="light"
                    >
                      {(() => {
                        const status = getDocumentStatus(personal.documentacion.evaluacionMedica.vencimiento);
                        if (!status) return 'Sin vencimiento';
                        if (status.status === 'expired') return `Vencida hace ${status.days} días`;
                        if (status.status === 'expiring') return `Vence en ${status.days} días`;
                        return 'Vigente';
                      })()}
                    </Badge>
                  )}
                </Group>
                <Group gap="md">
                  <Text size="xs" color="dimmed">
                    Fecha: {formatDate(personal.documentacion.evaluacionMedica.fecha)}
                  </Text>
                  {personal.documentacion.evaluacionMedica.resultado && (
                    <Text size="xs" color="dimmed">
                      Resultado: {personal.documentacion.evaluacionMedica.resultado}
                    </Text>
                  )}
                  {personal.documentacion.evaluacionMedica.vencimiento && (
                    <Text size="xs" color="dimmed">
                      Vencimiento: {formatDate(personal.documentacion.evaluacionMedica.vencimiento)}
                    </Text>
                  )}
                </Group>
              </div>
            )}

            {/* Psicofísico */}
            {personal.documentacion.psicofisico?.fecha && (
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Psicofísico</Text>
                  {personal.documentacion.psicofisico.vencimiento && (
                    <Badge
                      color={getDocumentStatus(personal.documentacion.psicofisico.vencimiento)?.color}
                      variant="light"
                    >
                      {(() => {
                        const status = getDocumentStatus(personal.documentacion.psicofisico.vencimiento);
                        if (!status) return 'Sin vencimiento';
                        if (status.status === 'expired') return `Vencido hace ${status.days} días`;
                        if (status.status === 'expiring') return `Vence en ${status.days} días`;
                        return 'Vigente';
                      })()}
                    </Badge>
                  )}
                </Group>
                <Group gap="md">
                  <Text size="xs" color="dimmed">
                    Fecha: {formatDate(personal.documentacion.psicofisico.fecha)}
                  </Text>
                  {personal.documentacion.psicofisico.resultado && (
                    <Text size="xs" color="dimmed">
                      Resultado: {personal.documentacion.psicofisico.resultado}
                    </Text>
                  )}
                  {personal.documentacion.psicofisico.vencimiento && (
                    <Text size="xs" color="dimmed">
                      Vencimiento: {formatDate(personal.documentacion.psicofisico.vencimiento)}
                    </Text>
                  )}
                </Group>
              </div>
            )}
          </Stack>
        </Card>
      )}

      {/* Labor Data */}
      {personal.datosLaborales && Object.values(personal.datosLaborales).some(v => v) && (
        <Card withBorder p="md">
          <Title order={4} mb="md">
            <IconBuilding size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Datos Laborales
          </Title>
          <Grid>
            {personal.datosLaborales.categoria && (
              <Grid.Col span={4}>
                <Text size="sm" color="dimmed">Categoría:</Text>
                <Text size="sm">{personal.datosLaborales.categoria}</Text>
              </Grid.Col>
            )}
            {personal.datosLaborales.obraSocial && (
              <Grid.Col span={4}>
                <Text size="sm" color="dimmed">Obra Social:</Text>
                <Text size="sm">{personal.datosLaborales.obraSocial}</Text>
              </Grid.Col>
            )}
            {personal.datosLaborales.art && (
              <Grid.Col span={4}>
                <Text size="sm" color="dimmed">ART:</Text>
                <Text size="sm">{personal.datosLaborales.art}</Text>
              </Grid.Col>
            )}
          </Grid>
        </Card>
      )}

      {/* Training */}
      {personal.capacitaciones && personal.capacitaciones.length > 0 && (
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
                          {status.status === 'expired' ? 'Vencida' :
                           status.status === 'expiring' ? 'Por Vencer' : 'Vigente'}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Incidents */}
      {personal.incidentes && personal.incidentes.length > 0 && (
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
                    <Badge
                      color={incidente.tipo === 'Accidente' ? 'red' : 
                             incidente.tipo === 'Infracción' ? 'orange' : 'gray'}
                      variant="light"
                      size="sm"
                    >
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
      )}

      {/* Observations */}
      {personal.observaciones && (
        <Card withBorder p="md">
          <Title order={4} mb="md">Observaciones</Title>
          <Text size="sm">{personal.observaciones}</Text>
        </Card>
      )}

      {/* Metadata */}
      <Card withBorder p="md">
        <Title order={4} mb="md">Información del Sistema</Title>
        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" color="dimmed">Fecha de Creación:</Text>
            <Text size="sm">{formatDate(personal.createdAt)}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" color="dimmed">Última Actualización:</Text>
            <Text size="sm">{formatDate(personal.updatedAt)}</Text>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
};