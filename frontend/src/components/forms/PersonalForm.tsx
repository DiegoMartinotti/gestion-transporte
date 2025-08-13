import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Title,
  Grid,
  TextInput,
  Select,
  Textarea,
  Button,
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Accordion,
  Switch,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
// Icons removed - not used in current implementation
import { DatePickerInput } from '@mantine/dates';
import DynamicListField from './DynamicListField';
import type { Personal, Empresa } from '../../types';
import { personalService } from '../../services/personalService';
import { empresaService } from '../../services/empresaService';
import {
  buildPersonalData,
  savePersonal,
  showSuccessNotification,
  showErrorNotification,
  processPeriodosEmpleoForSubmit,
  processDocumentacionForSubmit,
  hasDatosLaborales,
  processCapacitacionesForSubmit,
  processIncidentesForSubmit,
  createFormInitialValues,
  createFormValidationRules,
  getDocumentBadgeColor,
  getDocumentStatus,
} from './helpers/personalHelpers';

interface PersonalFormProps {
  personal?: Personal;
  onSubmit: (personal: Personal) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Constants
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

// Sub-components for better organization
const BasicDataSection: React.FC<{
  form: any;
  empresas: Empresa[];
  loadingEmpresas: boolean;
  validatingDNI: boolean;
  validatingCUIL: boolean;
  onDNIBlur: (dni: string) => void;
  onCUILBlur: (cuil: string) => void;
}> = ({
  form,
  empresas,
  loadingEmpresas,
  validatingDNI,
  validatingCUIL,
  onDNIBlur,
  onCUILBlur,
}) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Datos Básicos
    </Title>
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
          onBlur={(e) => onDNIBlur(e.target.value)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          label="CUIL"
          placeholder="20-12345678-9"
          rightSection={validatingCUIL ? <Text size="xs">Validando...</Text> : null}
          {...form.getInputProps('cuil')}
          onBlur={(e) => onCUILBlur(e.target.value)}
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
          data={empresas.map((emp) => ({ value: emp._id, label: emp.nombre }))}
          {...form.getInputProps('empresa')}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Switch label="Activo" {...form.getInputProps('activo', { type: 'checkbox' })} />
      </Grid.Col>
    </Grid>
  </Card>
);

const AddressSection: React.FC<{ form: any }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Dirección
    </Title>
    <Grid>
      <Grid.Col span={8}>
        <TextInput
          label="Calle"
          placeholder="Nombre de la calle"
          {...form.getInputProps('direccion.calle')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput label="Número" placeholder="123" {...form.getInputProps('direccion.numero')} />
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
);

const ContactSection: React.FC<{ form: any }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Contacto
    </Title>
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
);

const DocumentItem: React.FC<{
  value: string;
  title: string;
  vencimiento: Date | null;
  children: React.ReactNode;
}> = ({ value, title, vencimiento, children }) => (
  <Accordion.Item value={value}>
    <Accordion.Control>
      <Group>
        <Text>{title}</Text>
        {vencimiento && (
          <Badge color={getDocumentBadgeColor(vencimiento)} size="sm">
            {getDocumentStatus(vencimiento)}
          </Badge>
        )}
      </Group>
    </Accordion.Control>
    <Accordion.Panel>{children}</Accordion.Panel>
  </Accordion.Item>
);

const DocumentationSection: React.FC<{ form: any }> = ({ form }) => {
  const isConductor = form.values.tipo === 'Conductor';

  return (
    <Card withBorder>
      <Title order={4} mb="md">
        Documentación
      </Title>
      <Accordion defaultValue={isConductor ? 'licencia' : undefined}>
        {isConductor && (
          <DocumentItem
            value="licencia"
            title="Licencia de Conducir"
            vencimiento={form.values.documentacion.licenciaConducir.vencimiento}
          >
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
          </DocumentItem>
        )}

        {isConductor && (
          <DocumentItem
            value="carnet"
            title="Carnet Profesional"
            vencimiento={form.values.documentacion.carnetProfesional.vencimiento}
          >
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
          </DocumentItem>
        )}

        <DocumentItem
          value="medica"
          title="Evaluación Médica"
          vencimiento={form.values.documentacion.evaluacionMedica.vencimiento}
        >
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
        </DocumentItem>

        <DocumentItem
          value="psicofisico"
          title="Psicofísico"
          vencimiento={form.values.documentacion.psicofisico.vencimiento}
        >
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
        </DocumentItem>
      </Accordion>
    </Card>
  );
};

const LaboralDataSection: React.FC<{ form: any }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Datos Laborales
    </Title>
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
);

const ObservationsSection: React.FC<{ form: any }> = ({ form }) => (
  <Card withBorder>
    <Title order={4} mb="md">
      Observaciones
    </Title>
    <Textarea
      placeholder="Observaciones adicionales..."
      minRows={3}
      {...form.getInputProps('observaciones')}
    />
  </Card>
);

// Custom hooks for PersonalForm
const useEmpresasData = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

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

  return { empresas, loadingEmpresas };
};

const useValidation = (form: any, personalId?: string) => {
  const [validatingDNI, setValidatingDNI] = useState(false);
  const [validatingCUIL, setValidatingCUIL] = useState(false);

  const handleDNIValidation = useCallback(
    async (dni: string) => {
      if (!dni || dni.length < 7) return;

      setValidatingDNI(true);
      try {
        const result = await personalService.validateDNI(dni, personalId);
        if (!result.valid) {
          form.setFieldError('dni', result.message || 'DNI ya existe');
        }
      } catch (error) {
        console.error('Error validating DNI:', error);
      } finally {
        setValidatingDNI(false);
      }
    },
    [form, personalId]
  );

  const handleCUILValidation = useCallback(
    async (cuil: string) => {
      if (!cuil) return;

      setValidatingCUIL(true);
      try {
        const result = await personalService.validateCUIL(cuil, personalId);
        if (!result.valid) {
          form.setFieldError('cuil', result.message || 'CUIL ya existe');
        }
      } catch (error) {
        console.error('Error validating CUIL:', error);
      } finally {
        setValidatingCUIL(false);
      }
    },
    [form, personalId]
  );

  return {
    validatingDNI,
    validatingCUIL,
    handleDNIValidation,
    handleCUILValidation,
  };
};

const usePersonalSubmit = (personal: Personal | undefined, onSubmit: (result: any) => void) => {
  return useCallback(
    async (values: any) => {
      try {
        const personalData = buildPersonalData(values, {
          processPeriodosEmpleoForSubmit,
          processDocumentacionForSubmit,
          hasDatosLaborales,
          processCapacitacionesForSubmit,
          processIncidentesForSubmit,
        });
        const result = await savePersonal(personalData, personal?._id);
        showSuccessNotification(!!personal);
        onSubmit(result);
      } catch (error: any) {
        showErrorNotification(error);
      }
    },
    [personal, onSubmit]
  );
};

export const PersonalForm: React.FC<PersonalFormProps> = ({
  personal,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { empresas, loadingEmpresas } = useEmpresasData();

  const form = useForm({
    initialValues: createFormInitialValues(personal),
    validate: createFormValidationRules(),
  });

  const { validatingDNI, validatingCUIL, handleDNIValidation, handleCUILValidation } =
    useValidation(form, personal?._id);

  const handleSubmit = usePersonalSubmit(personal, onSubmit);

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={isLoading} />

      <Title order={3} mb="lg">
        {personal ? 'Editar Personal' : 'Nuevo Personal'}
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <BasicDataSection
            form={form}
            empresas={empresas}
            loadingEmpresas={loadingEmpresas}
            validatingDNI={validatingDNI}
            validatingCUIL={validatingCUIL}
            onDNIBlur={handleDNIValidation}
            onCUILBlur={handleCUILValidation}
          />

          <AddressSection form={form} />

          <ContactSection form={form} />

          <DocumentationSection form={form} />

          {/* Períodos de Empleo */}
          <DynamicListField
            title="Períodos de Empleo"
            form={form}
            path="periodosEmpleo"
            initialItem={{
              fechaIngreso: new Date(),
              fechaEgreso: null,
              categoria: '',
              motivo: '',
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

          <LaboralDataSection form={form} />

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
              certificado: '',
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
              consecuencias: '',
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

          <ObservationsSection form={form} />

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
