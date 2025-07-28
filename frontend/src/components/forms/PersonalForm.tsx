import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Grid,
  TextInput,
  Select,
  Textarea,
  Button,
  Stack,
  Divider,
  Group,
  Card,
  Text,
  ActionIcon,
  Badge,
  Accordion,
  Switch,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import DynamicListField from './DynamicListField';
import type { 
  Personal, 
  Empresa, 
  PersonalDireccion, 
  PersonalContacto, 
  PeriodoEmpleo, 
  PersonalDocumentacion,
  DatosLaborales,
  Capacitacion,
  Incidente
} from '../../types';
import { personalService } from '../../services/personalService';
import { empresaService } from '../../services/empresaService';

interface PersonalFormProps {
  personal?: Personal;
  onSubmit: (personal: Personal) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const tiposPersonal = [
  { value: 'Conductor', label: 'Conductor' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Mecánico', label: 'Mecánico' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Otro', label: 'Otro' },
];

const tiposIncidente = [
  { value: 'Accidente', label: 'Accidente' },
  { value: 'Infracción', label: 'Infracción' },
  { value: 'Otro', label: 'Otro' },
];

const categoriasLicencia = [
  { value: 'A', label: 'Clase A' },
  { value: 'B', label: 'Clase B' },
  { value: 'C', label: 'Clase C' },
  { value: 'D', label: 'Clase D' },
  { value: 'E', label: 'Clase E' },
];

export const PersonalForm: React.FC<PersonalFormProps> = ({
  personal,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [validatingDNI, setValidatingDNI] = useState(false);
  const [validatingCUIL, setValidatingCUIL] = useState(false);

  const form = useForm({
    initialValues: {
      // Datos básicos
      nombre: personal?.nombre || '',
      apellido: personal?.apellido || '',
      dni: personal?.dni || '',
      cuil: personal?.cuil || '',
      tipo: personal?.tipo || 'Conductor',
      fechaNacimiento: personal?.fechaNacimiento ? new Date(personal.fechaNacimiento) : null,
      empresa: typeof personal?.empresa === 'string' ? personal.empresa : personal?.empresa?._id || '',
      activo: personal?.activo ?? true,
      observaciones: personal?.observaciones || '',
      
      // Dirección
      direccion: {
        calle: personal?.direccion?.calle || '',
        numero: personal?.direccion?.numero || '',
        localidad: personal?.direccion?.localidad || '',
        provincia: personal?.direccion?.provincia || '',
        codigoPostal: personal?.direccion?.codigoPostal || '',
      },
      
      // Contacto
      contacto: {
        telefono: personal?.contacto?.telefono || '',
        telefonoEmergencia: personal?.contacto?.telefonoEmergencia || '',
        email: personal?.contacto?.email || '',
      },
      
      // Períodos de empleo
      periodosEmpleo: personal?.periodosEmpleo?.map(periodo => ({
        fechaIngreso: new Date(periodo.fechaIngreso),
        fechaEgreso: periodo.fechaEgreso ? new Date(periodo.fechaEgreso) : null,
        motivo: periodo.motivo || '',
        categoria: periodo.categoria || '',
      })) || [{ fechaIngreso: new Date(), fechaEgreso: null, motivo: '', categoria: '' }],
      
      // Documentación
      documentacion: {
        licenciaConducir: {
          numero: personal?.documentacion?.licenciaConducir?.numero || '',
          categoria: personal?.documentacion?.licenciaConducir?.categoria || '',
          vencimiento: personal?.documentacion?.licenciaConducir?.vencimiento ? 
            new Date(personal.documentacion.licenciaConducir.vencimiento) : null,
        },
        carnetProfesional: {
          numero: personal?.documentacion?.carnetProfesional?.numero || '',
          vencimiento: personal?.documentacion?.carnetProfesional?.vencimiento ? 
            new Date(personal.documentacion.carnetProfesional.vencimiento) : null,
        },
        evaluacionMedica: {
          fecha: personal?.documentacion?.evaluacionMedica?.fecha ? 
            new Date(personal.documentacion.evaluacionMedica.fecha) : null,
          vencimiento: personal?.documentacion?.evaluacionMedica?.vencimiento ? 
            new Date(personal.documentacion.evaluacionMedica.vencimiento) : null,
          resultado: personal?.documentacion?.evaluacionMedica?.resultado || '',
        },
        psicofisico: {
          fecha: personal?.documentacion?.psicofisico?.fecha ? 
            new Date(personal.documentacion.psicofisico.fecha) : null,
          vencimiento: personal?.documentacion?.psicofisico?.vencimiento ? 
            new Date(personal.documentacion.psicofisico.vencimiento) : null,
          resultado: personal?.documentacion?.psicofisico?.resultado || '',
        },
      },
      
      // Datos laborales
      datosLaborales: {
        categoria: personal?.datosLaborales?.categoria || '',
        obraSocial: personal?.datosLaborales?.obraSocial || '',
        art: personal?.datosLaborales?.art || '',
      },
      
      // Capacitaciones
      capacitaciones: personal?.capacitaciones?.map(cap => ({
        nombre: cap.nombre || '',
        fecha: cap.fecha ? new Date(cap.fecha) : null,
        vencimiento: cap.vencimiento ? new Date(cap.vencimiento) : null,
        institucion: cap.institucion || '',
        certificado: cap.certificado || '',
      })) || [],
      
      // Incidentes
      incidentes: personal?.incidentes?.map(inc => ({
        fecha: inc.fecha ? new Date(inc.fecha) : null,
        tipo: inc.tipo || 'Otro',
        descripcion: inc.descripcion || '',
        consecuencias: inc.consecuencias || '',
      })) || [],
    },
    
    validate: {
      nombre: (value) => (!value ? 'El nombre es obligatorio' : null),
      apellido: (value) => (!value ? 'El apellido es obligatorio' : null),
      dni: (value) => {
        if (!value) return 'El DNI es obligatorio';
        if (!/^[0-9]{7,8}$/.test(value)) return 'DNI debe tener 7 u 8 dígitos';
        return null;
      },
      cuil: (value) => {
        if (value && !/^[0-9]{2}-[0-9]{8}-[0-9]$/.test(value)) {
          return 'CUIL debe tener formato XX-XXXXXXXX-X';
        }
        return null;
      },
      tipo: (value) => (!value ? 'El tipo de personal es obligatorio' : null),
      empresa: (value) => (!value ? 'La empresa es obligatoria' : null),
      contacto: {
        email: (value) => {
          if (value && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
            return 'Email inválido';
          }
          return null;
        },
      },
    },
  });

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const response = await empresaService.getAll({ activa: true });
        setEmpresas(response.data);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Error al cargar empresas',
          color: 'red',
        });
      } finally {
        setLoadingEmpresas(false);
      }
    };

    loadEmpresas();
  }, []);

  const validateDNI = async (dni: string) => {
    if (!dni || dni.length < 7) return;
    
    setValidatingDNI(true);
    try {
      const result = await personalService.validateDNI(dni, personal?._id);
      if (!result.valid) {
        form.setFieldError('dni', result.message || 'DNI ya existe');
      }
    } catch (error) {
      console.error('Error validating DNI:', error);
    } finally {
      setValidatingDNI(false);
    }
  };

  const validateCUIL = async (cuil: string) => {
    if (!cuil) return;
    
    setValidatingCUIL(true);
    try {
      const result = await personalService.validateCUIL(cuil, personal?._id);
      if (!result.valid) {
        form.setFieldError('cuil', result.message || 'CUIL ya existe');
      }
    } catch (error) {
      console.error('Error validating CUIL:', error);
    } finally {
      setValidatingCUIL(false);
    }
  };


  const handleSubmit = async (values: typeof form.values) => {
    try {
      const personalData = {
        ...values,
        fechaNacimiento: values.fechaNacimiento || undefined,
        periodosEmpleo: values.periodosEmpleo.map(periodo => ({
          ...periodo,
          fechaIngreso: periodo.fechaIngreso,
          fechaEgreso: periodo.fechaEgreso || undefined,
        })),
        documentacion: {
          licenciaConducir: values.documentacion.licenciaConducir.numero ? 
            {
              ...values.documentacion.licenciaConducir,
              vencimiento: values.documentacion.licenciaConducir.vencimiento || undefined
            } : undefined,
          carnetProfesional: values.documentacion.carnetProfesional.numero ? 
            {
              ...values.documentacion.carnetProfesional,
              vencimiento: values.documentacion.carnetProfesional.vencimiento || undefined
            } : undefined,
          evaluacionMedica: values.documentacion.evaluacionMedica.fecha ? 
            {
              ...values.documentacion.evaluacionMedica,
              fecha: values.documentacion.evaluacionMedica.fecha,
              vencimiento: values.documentacion.evaluacionMedica.vencimiento || undefined
            } : undefined,
          psicofisico: values.documentacion.psicofisico.fecha ? 
            {
              ...values.documentacion.psicofisico,
              fecha: values.documentacion.psicofisico.fecha,
              vencimiento: values.documentacion.psicofisico.vencimiento || undefined
            } : undefined,
        },
        datosLaborales: Object.values(values.datosLaborales).some(v => v) ? 
          values.datosLaborales : undefined,
        capacitaciones: values.capacitaciones.filter(cap => cap.nombre).map(cap => ({
          ...cap,
          fecha: cap.fecha || undefined,
          vencimiento: cap.vencimiento || undefined,
        })),
        incidentes: values.incidentes.filter(inc => inc.descripcion).map(inc => ({
          ...inc,
          fecha: inc.fecha || undefined,
        })),
      };

      let result;
      if (personal) {
        result = await personalService.update(personal._id, personalData);
      } else {
        result = await personalService.create(personalData as any);
      }

      notifications.show({
        title: 'Éxito',
        message: `Personal ${personal ? 'actualizado' : 'creado'} correctamente`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      onSubmit(result);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || `Error al ${personal ? 'actualizar' : 'crear'} personal`,
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  const isDocumentExpiring = (vencimiento: Date | null, days: number = 30): boolean => {
    if (!vencimiento) return false;
    const now = new Date();
    const diffTime = vencimiento.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
  };

  const isDocumentExpired = (vencimiento: Date | null): boolean => {
    if (!vencimiento) return false;
    return vencimiento < new Date();
  };

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={isLoading} />
      
      <Title order={3} mb="lg">
        {personal ? 'Editar Personal' : 'Nuevo Personal'}
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Datos Básicos */}
          <Card withBorder>
            <Title order={4} mb="md">Datos Básicos</Title>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Nombre"
                  placeholder="Ingrese el nombre"
                  required
                  {...form.getInputProps('nombre')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Apellido"
                  placeholder="Ingrese el apellido"
                  required
                  {...form.getInputProps('apellido')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="DNI"
                  placeholder="12345678"
                  required
                  rightSection={validatingDNI ? <Text size="xs">Validando...</Text> : null}
                  {...form.getInputProps('dni')}
                  onBlur={(e) => validateDNI(e.target.value)}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="CUIL"
                  placeholder="20-12345678-9"
                  rightSection={validatingCUIL ? <Text size="xs">Validando...</Text> : null}
                  {...form.getInputProps('cuil')}
                  onBlur={(e) => validateCUIL(e.target.value)}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <DatePickerInput
                  label="Fecha de Nacimiento"
                  placeholder="Seleccione fecha"
                  {...form.getInputProps('fechaNacimiento')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Tipo de Personal"
                  placeholder="Seleccione tipo"
                  required
                  data={tiposPersonal}
                  {...form.getInputProps('tipo')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Empresa"
                  placeholder="Seleccione empresa"
                  required
                  disabled={loadingEmpresas}
                  data={empresas.map(emp => ({ value: emp._id, label: emp.nombre }))}
                  {...form.getInputProps('empresa')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Switch
                  label="Activo"
                  {...form.getInputProps('activo', { type: 'checkbox' })}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Dirección */}
          <Card withBorder>
            <Title order={4} mb="md">Dirección</Title>
            <Grid>
              <Grid.Col span={8}>
                <TextInput
                  label="Calle"
                  placeholder="Nombre de la calle"
                  {...form.getInputProps('direccion.calle')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Número"
                  placeholder="123"
                  {...form.getInputProps('direccion.numero')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Localidad"
                  placeholder="Ciudad"
                  {...form.getInputProps('direccion.localidad')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Provincia"
                  placeholder="Provincia"
                  {...form.getInputProps('direccion.provincia')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Código Postal"
                  placeholder="1234"
                  {...form.getInputProps('direccion.codigoPostal')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Contacto */}
          <Card withBorder>
            <Title order={4} mb="md">Contacto</Title>
            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  label="Teléfono"
                  placeholder="+54 11 1234-5678"
                  {...form.getInputProps('contacto.telefono')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Teléfono de Emergencia"
                  placeholder="+54 11 1234-5678"
                  {...form.getInputProps('contacto.telefonoEmergencia')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Email"
                  placeholder="email@ejemplo.com"
                  type="email"
                  {...form.getInputProps('contacto.email')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Documentación */}
          <Card withBorder>
            <Title order={4} mb="md">Documentación</Title>
            <Accordion defaultValue={form.values.tipo === 'Conductor' ? 'licencia' : undefined}>
              {form.values.tipo === 'Conductor' && (
                <Accordion.Item value="licencia">
                  <Accordion.Control>
                    <Group>
                      <Text>Licencia de Conducir</Text>
                      {form.values.documentacion.licenciaConducir.vencimiento && (
                        <Badge
                          color={
                            isDocumentExpired(form.values.documentacion.licenciaConducir.vencimiento) ? 'red' :
                            isDocumentExpiring(form.values.documentacion.licenciaConducir.vencimiento) ? 'yellow' : 'green'
                          }
                          size="sm"
                        >
                          {isDocumentExpired(form.values.documentacion.licenciaConducir.vencimiento) ? 'Vencida' :
                           isDocumentExpiring(form.values.documentacion.licenciaConducir.vencimiento) ? 'Por Vencer' : 'Vigente'}
                        </Badge>
                      )}
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Grid>
                      <Grid.Col span={4}>
                        <TextInput
                          label="Número de Licencia"
                          placeholder="12345678"
                          {...form.getInputProps('documentacion.licenciaConducir.numero')}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Select
                          label="Categoría"
                          placeholder="Seleccione categoría"
                          data={categoriasLicencia}
                          {...form.getInputProps('documentacion.licenciaConducir.categoria')}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <DatePickerInput
                          label="Vencimiento"
                          placeholder="Seleccione fecha"
                          {...form.getInputProps('documentacion.licenciaConducir.vencimiento')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {form.values.tipo === 'Conductor' && (
                <Accordion.Item value="carnet">
                  <Accordion.Control>
                    <Group>
                      <Text>Carnet Profesional</Text>
                      {form.values.documentacion.carnetProfesional.vencimiento && (
                        <Badge
                          color={
                            isDocumentExpired(form.values.documentacion.carnetProfesional.vencimiento) ? 'red' :
                            isDocumentExpiring(form.values.documentacion.carnetProfesional.vencimiento) ? 'yellow' : 'green'
                          }
                          size="sm"
                        >
                          {isDocumentExpired(form.values.documentacion.carnetProfesional.vencimiento) ? 'Vencido' :
                           isDocumentExpiring(form.values.documentacion.carnetProfesional.vencimiento) ? 'Por Vencer' : 'Vigente'}
                        </Badge>
                      )}
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Número de Carnet"
                          placeholder="12345678"
                          {...form.getInputProps('documentacion.carnetProfesional.numero')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <DatePickerInput
                          label="Vencimiento"
                          placeholder="Seleccione fecha"
                          {...form.getInputProps('documentacion.carnetProfesional.vencimiento')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              <Accordion.Item value="medica">
                <Accordion.Control>
                  <Group>
                    <Text>Evaluación Médica</Text>
                    {form.values.documentacion.evaluacionMedica.vencimiento && (
                      <Badge
                        color={
                          isDocumentExpired(form.values.documentacion.evaluacionMedica.vencimiento) ? 'red' :
                          isDocumentExpiring(form.values.documentacion.evaluacionMedica.vencimiento) ? 'yellow' : 'green'
                        }
                        size="sm"
                      >
                        {isDocumentExpired(form.values.documentacion.evaluacionMedica.vencimiento) ? 'Vencida' :
                         isDocumentExpiring(form.values.documentacion.evaluacionMedica.vencimiento) ? 'Por Vencer' : 'Vigente'}
                      </Badge>
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    <Grid.Col span={4}>
                      <DatePickerInput
                        label="Fecha de Evaluación"
                        placeholder="Seleccione fecha"
                        {...form.getInputProps('documentacion.evaluacionMedica.fecha')}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <DatePickerInput
                        label="Vencimiento"
                        placeholder="Seleccione fecha"
                        {...form.getInputProps('documentacion.evaluacionMedica.vencimiento')}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <TextInput
                        label="Resultado"
                        placeholder="Apto/No Apto"
                        {...form.getInputProps('documentacion.evaluacionMedica.resultado')}
                      />
                    </Grid.Col>
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="psicofisico">
                <Accordion.Control>
                  <Group>
                    <Text>Psicofísico</Text>
                    {form.values.documentacion.psicofisico.vencimiento && (
                      <Badge
                        color={
                          isDocumentExpired(form.values.documentacion.psicofisico.vencimiento) ? 'red' :
                          isDocumentExpiring(form.values.documentacion.psicofisico.vencimiento) ? 'yellow' : 'green'
                        }
                        size="sm"
                      >
                        {isDocumentExpired(form.values.documentacion.psicofisico.vencimiento) ? 'Vencido' :
                         isDocumentExpiring(form.values.documentacion.psicofisico.vencimiento) ? 'Por Vencer' : 'Vigente'}
                      </Badge>
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    <Grid.Col span={4}>
                      <DatePickerInput
                        label="Fecha de Evaluación"
                        placeholder="Seleccione fecha"
                        {...form.getInputProps('documentacion.psicofisico.fecha')}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <DatePickerInput
                        label="Vencimiento"
                        placeholder="Seleccione fecha"
                        {...form.getInputProps('documentacion.psicofisico.vencimiento')}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <TextInput
                        label="Resultado"
                        placeholder="Apto/No Apto"
                        {...form.getInputProps('documentacion.psicofisico.resultado')}
                      />
                    </Grid.Col>
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Card>

          {/* Períodos de Empleo */}
          <DynamicListField
            title="Períodos de Empleo"
            form={form}
            path="periodosEmpleo"
            initialItem={{
              fechaIngreso: new Date(),
              fechaEgreso: null,
              categoria: '',
              motivo: ''
            }}
            minItems={1}
            renderFields={(periodo, index, form) => (
              <Grid>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label="Fecha de Ingreso"
                    placeholder="Seleccione fecha"
                    required
                    {...form.getInputProps(`periodosEmpleo.${index}.fechaIngreso`)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label="Fecha de Egreso"
                    placeholder="Seleccione fecha"
                    {...form.getInputProps(`periodosEmpleo.${index}.fechaEgreso`)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="Categoría"
                    placeholder="Ej: Chofer Senior"
                    {...form.getInputProps(`periodosEmpleo.${index}.categoria`)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="Motivo"
                    placeholder="Ej: Renuncia"
                    {...form.getInputProps(`periodosEmpleo.${index}.motivo`)}
                  />
                </Grid.Col>
              </Grid>
            )}
          />

          {/* Datos Laborales */}
          <Card withBorder>
            <Title order={4} mb="md">Datos Laborales</Title>
            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  label="Categoría"
                  placeholder="Ej: Chofer Categoría A"
                  {...form.getInputProps('datosLaborales.categoria')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Obra Social"
                  placeholder="Ej: OSDE"
                  {...form.getInputProps('datosLaborales.obraSocial')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="ART"
                  placeholder="Ej: Galeno"
                  {...form.getInputProps('datosLaborales.art')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* Capacitaciones */}
          <DynamicListField
            title="Capacitaciones"
            form={form}
            path="capacitaciones"
            initialItem={{
              nombre: '',
              fecha: null,
              vencimiento: null,
              institucion: '',
              certificado: ''
            }}
            renderFields={(capacitacion, index, form) => (
              <Grid>
                <Grid.Col span={4}>
                  <TextInput
                    label="Nombre"
                    placeholder="Nombre de la capacitación"
                    {...form.getInputProps(`capacitaciones.${index}.nombre`)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <DatePickerInput
                    label="Fecha"
                    placeholder="Fecha"
                    {...form.getInputProps(`capacitaciones.${index}.fecha`)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <DatePickerInput
                    label="Vencimiento"
                    placeholder="Vencimiento"
                    {...form.getInputProps(`capacitaciones.${index}.vencimiento`)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <TextInput
                    label="Institución"
                    placeholder="Institución"
                    {...form.getInputProps(`capacitaciones.${index}.institucion`)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <TextInput
                    label="Certificado"
                    placeholder="Nro. Certificado"
                    {...form.getInputProps(`capacitaciones.${index}.certificado`)}
                  />
                </Grid.Col>
              </Grid>
            )}
          />

          {/* Incidentes */}
          <DynamicListField
            title="Incidentes"
            form={form}
            path="incidentes"
            initialItem={{
              fecha: new Date(),
              tipo: 'Otro',
              descripcion: '',
              consecuencias: ''
            }}
            renderFields={(incidente, index, form) => (
              <Grid>
                <Grid.Col span={3}>
                  <DatePickerInput
                    label="Fecha"
                    placeholder="Fecha del incidente"
                    {...form.getInputProps(`incidentes.${index}.fecha`)}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Select
                    label="Tipo"
                    placeholder="Tipo de incidente"
                    data={tiposIncidente}
                    {...form.getInputProps(`incidentes.${index}.tipo`)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Descripción"
                    placeholder="Descripción del incidente"
                    {...form.getInputProps(`incidentes.${index}.descripcion`)}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Consecuencias"
                    placeholder="Consecuencias del incidente"
                    minRows={2}
                    {...form.getInputProps(`incidentes.${index}.consecuencias`)}
                  />
                </Grid.Col>
              </Grid>
            )}
          />

          {/* Observaciones */}
          <Card withBorder>
            <Title order={4} mb="md">Observaciones</Title>
            <Textarea
              placeholder="Observaciones adicionales..."
              minRows={3}
              {...form.getInputProps('observaciones')}
            />
          </Card>

          {/* Botones de acción */}
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={isLoading}>
              {personal ? 'Actualizar' : 'Crear'} Personal
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};