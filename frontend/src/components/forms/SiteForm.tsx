import React, { useEffect, useState } from 'react';
import { Box, Button, Group, Stack, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Site, Cliente } from '../../types';
import { CreateSiteData } from '../../services/siteService';
import {
  siteValidationRules,
  getInitialValues,
  hasValidCoordinates,
} from './validation/siteValidation';
import { loadClientes, geocodeAddress, submitSite } from './helpers/siteHelpers';
import { InformacionBasicaSection, UbicacionSection } from './components/SiteFormSections';

interface SiteFormProps {
  site?: Site;
  onSubmit: (site: Site) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SiteForm({ site, onSubmit, onCancel, loading = false }: SiteFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  const form = useForm<CreateSiteData>({
    initialValues: getInitialValues(site || null),
    validate: siteValidationRules,
  });

  useEffect(() => {
    loadClientes(setClientes, setLoadingClientes);
  }, []);

  const handleGeocodeAddress = async () => {
    setGeocoding(true);
    const coords = await geocodeAddress(
      form.values.direccion,
      form.values.ciudad,
      form.values.provincia,
      form.values.pais
    );
    if (coords) {
      form.setFieldValue('coordenadas', coords);
    }
    setGeocoding(false);
  };

  const handleSubmit = (values: CreateSiteData) => {
    submitSite(values, site, onSubmit);
  };

  const validCoordinates = hasValidCoordinates(form.values.coordenadas);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <InformacionBasicaSection
            form={form}
            clientes={clientes}
            loadingClientes={loadingClientes}
          />

          <UbicacionSection
            form={form}
            geocoding={geocoding}
            onGeocode={handleGeocodeAddress}
            validCoordinates={validCoordinates}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={!validCoordinates}>
              {site ? 'Actualizar' : 'Crear'} Site
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
