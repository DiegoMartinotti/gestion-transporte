import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Title, Button, Stack, Group, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
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
} from './helpers/personalHelpers';
import {
  BasicDataSection,
  AddressSection,
  ContactSection,
  LaboralDataSection,
  ObservationsSection,
} from './PersonalFormBasicSections';
import { DocumentationSection } from './PersonalFormDocumentationSections';
import {
  EmploymentPeriodsSection,
  TrainingSection,
  IncidentsSection,
} from './PersonalFormDynamicSections';
import { PersonalFormData, PersonalFormType } from './PersonalFormTypes';

interface PersonalFormProps {
  personal?: Personal;
  onSubmit: (personal: Personal) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

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

const useValidation = (form: PersonalFormType, personalId?: string) => {
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

const usePersonalSubmit = (
  personal: Personal | undefined,
  onSubmit: (result: Personal) => void
) => {
  return useCallback(
    async (values: PersonalFormData) => {
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
      } catch (error: unknown) {
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

          <EmploymentPeriodsSection form={form} />

          <LaboralDataSection form={form} />

          <TrainingSection form={form} />

          <IncidentsSection form={form} />

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
