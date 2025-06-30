import React, { useState, useEffect, useMemo } from 'react';
import {
  Select,
  Group,
  Text,
  Badge,
  Stack,
  Tooltip,
  ActionIcon,
  Loader
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconMapPin, IconBuilding, IconExternalLink } from '@tabler/icons-react';
import { Site, Cliente } from '../../types';
import { siteService } from '../../services/siteService';

interface SiteSelectorProps {
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  clienteId?: string; // Filtrar sites por cliente
  clearable?: boolean;
  searchable?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  width?: string | number;
  showCoordinates?: boolean;
  showDistance?: boolean;
  fromLocation?: { lat: number; lng: number }; // Para calcular distancia
}

interface SiteWithDistance extends Site {
  distance?: number;
}

export default function SiteSelector({
  value,
  onChange,
  placeholder = 'Seleccionar site...',
  label,
  required = false,
  disabled = false,
  error,
  clienteId,
  clearable = true,
  searchable = true,
  size = 'sm',
  width,
  showCoordinates = false,
  showDistance = false,
  fromLocation
}: SiteSelectorProps) {
  const [sites, setSites] = useState<SiteWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadSites = async () => {
    try {
      setLoading(true);
      const filters: any = {
        activo: true,
        limit: 1000
      };

      if (clienteId) {
        filters.cliente = clienteId;
      }

      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }

      const response = await siteService.getAll(filters);
      let sitesData = response.data;

      // Calcular distancias si se proporciona fromLocation
      if (showDistance && fromLocation) {
        const sitesWithDistance: SiteWithDistance[] = sitesData
          .filter(site => site.coordenadas) // Solo sites con coordenadas
          .map(site => ({
            ...site,
            distance: calculateDistance(
              fromLocation.lat,
              fromLocation.lng,
              site.coordenadas!.lat,
              site.coordenadas!.lng
            )
          }));

        // Ordenar por distancia
        sitesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setSites(sitesWithDistance);
      } else {
        setSites(sitesData);
      }
    } catch (error) {
      console.error('Error cargando sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, [debouncedSearch, clienteId]);

  const getClienteNombre = (cliente: string | Cliente): string => {
    if (typeof cliente === 'string') {
      return 'Cliente';
    }
    return cliente.nombre;
  };

  const openGoogleMaps = (site: Site, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!site.coordenadas) return;
    const url = `https://maps.google.com/?q=${site.coordenadas.lat},${site.coordenadas.lng}`;
    window.open(url, '_blank');
  };

  const selectData = useMemo(() => {
    return sites.map(site => ({
      value: site._id,
      label: site.nombre,
      site: site
    }));
  }, [sites]);

  const renderSelectOption = ({ option }: { option: any }) => {
    const site = option.site as SiteWithDistance;
    
    return (
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2} style={{ flex: 1 }}>
          <Group gap={8} wrap="nowrap">
            <IconMapPin size={14} style={{ color: 'var(--mantine-color-gray-6)', flexShrink: 0 }} />
            <Text size="sm" fw={500} truncate>
              {site.nombre}
            </Text>
          </Group>
          
          <Group gap={8} wrap="nowrap">
            <IconBuilding size={12} style={{ color: 'var(--mantine-color-gray-5)', flexShrink: 0 }} />
            <Text size="xs" c="dimmed" truncate>
              {getClienteNombre(site.cliente)}
            </Text>
          </Group>

          <Text size="xs" c="dimmed" truncate>
            {site.localidad}, {site.provincia}
          </Text>

          {showCoordinates && site.coordenadas && (
            <Text size="xs" c="dimmed">
              {site.coordenadas.lat.toFixed(4)}, {site.coordenadas.lng.toFixed(4)}
            </Text>
          )}

          {showDistance && site.distance !== undefined && (
            <Badge size="xs" variant="light" color="blue">
              {site.distance.toFixed(1)} km
            </Badge>
          )}
        </Stack>

        <Tooltip label="Ver en Google Maps">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="blue"
            onClick={(e) => openGoogleMaps(site, e)}
          >
            <IconExternalLink size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  };

  const selectedSite = sites.find(site => site._id === value);

  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value || null}
      onChange={onChange}
      data={selectData}
      required={required}
      disabled={disabled}
      error={error}
      clearable={clearable}
      searchable={searchable}
      size={size}
      style={{ width }}
      nothingFoundMessage={loading ? <Loader size="xs" /> : "No se encontraron sites"}
      searchValue={search}
      onSearchChange={setSearch}
      renderOption={renderSelectOption}
      rightSection={loading ? <Loader size="xs" /> : undefined}
      comboboxProps={{
        withinPortal: true,
        shadow: 'md',
        transitionProps: { duration: 200, transition: 'fade' }
      }}
      leftSection={selectedSite && (
        <Group gap={4}>
          <IconMapPin size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
          {showDistance && selectedSite.distance !== undefined && (
            <Badge size="xs" variant="light" color="blue">
              {selectedSite.distance.toFixed(1)} km
            </Badge>
          )}
        </Group>
      )}
    />
  );
}