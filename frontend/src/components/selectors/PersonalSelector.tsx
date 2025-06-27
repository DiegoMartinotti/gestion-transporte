import React, { useState, useEffect } from 'react';
import {
  Select,
  Group,
  Text,
  Avatar,
  Badge,
  Stack,
  Loader,
  Alert,
  Tooltip,
  ThemeIcon,
} from '@mantine/core';
import { IconUser, IconAlertTriangle, IconLicense, IconCheck, IconX } from '@tabler/icons-react';
import type { Personal, Empresa } from '../../types';
import { personalService } from '../../services/personalService';

interface PersonalItemProps extends React.ComponentPropsWithoutRef<'div'> {
  image?: string;
  label: string;
  description: string;
  dni: string;
  tipo: string;
  activo: boolean;
  documentStatus?: 'valid' | 'expiring' | 'expired' | 'missing';
}

const PersonalItem = React.forwardRef<HTMLDivElement, PersonalItemProps>(
  ({ image, label, description, dni, tipo, activo, documentStatus, ...others }, ref) => (
    <div ref={ref} {...others}>
      <Group wrap="nowrap">
        <Avatar src={image} radius="xl" size="sm">
          <IconUser size={16} />
        </Avatar>
        <div style={{ flex: 1 }}>
          <Group justify="space-between" gap="xs">
            <Text size="sm" fw={500}>
              {label}
            </Text>
            <Group gap={4}>
              {!activo && (
                <Tooltip label="Inactivo">
                  <ThemeIcon size="xs" color="gray" variant="light">
                    <IconX size={10} />
                  </ThemeIcon>
                </Tooltip>
              )}
              {documentStatus === 'expired' && (
                <Tooltip label="Documentos vencidos">
                  <ThemeIcon size="xs" color="red" variant="light">
                    <IconAlertTriangle size={10} />
                  </ThemeIcon>
                </Tooltip>
              )}
              {documentStatus === 'expiring' && (
                <Tooltip label="Documentos por vencer">
                  <ThemeIcon size="xs" color="yellow" variant="light">
                    <IconAlertTriangle size={10} />
                  </ThemeIcon>
                </Tooltip>
              )}
              {documentStatus === 'valid' && (
                <Tooltip label="Documentos vigentes">
                  <ThemeIcon size="xs" color="green" variant="light">
                    <IconCheck size={10} />
                  </ThemeIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
          <Group gap="xs" mt={2}>
            <Text size="xs" color="dimmed">
              DNI: {dni}
            </Text>
            <Badge size="xs" variant="light" color={getTipoColor(tipo)}>
              {tipo}
            </Badge>
          </Group>
          <Text size="xs" color="dimmed">
            {description}
          </Text>
        </div>
      </Group>
    </div>
  )
);

PersonalItem.displayName = 'PersonalItem';

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'Conductor': return 'blue';
    case 'Administrativo': return 'green';
    case 'Mecánico': return 'orange';
    case 'Supervisor': return 'purple';
    default: return 'gray';
  }
};

interface PersonalSelectorProps {
  value?: string;
  onChange: (value: string | null) => void;
  empresa?: string;
  tipo?: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  onlyConductores?: boolean;
  onlyActive?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  withDocumentStatus?: boolean;
}

export const PersonalSelector: React.FC<PersonalSelectorProps> = ({
  value,
  onChange,
  empresa,
  tipo,
  onlyConductores = false,
  onlyActive = true,
  placeholder = 'Seleccione personal',
  label = 'Personal',
  required = false,
  error,
  disabled = false,
  clearable = true,
  withDocumentStatus = false,
}) => {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const loadPersonal = async () => {
      setLoading(true);
      try {
        let filters: any = {};
        
        if (empresa) filters.empresa = empresa;
        if (tipo || onlyConductores) filters.tipo = tipo || 'Conductor';
        if (onlyActive) filters.activo = true;
        
        const response = await personalService.getAll(filters);
        setPersonal(response.data);
      } catch (error) {
        console.error('Error loading personal:', error);
        setPersonal([]);
      } finally {
        setLoading(false);
      }
    };

    loadPersonal();
  }, [empresa, tipo, onlyConductores, onlyActive]);

  // Calculate document status for conductores
  const getDocumentStatus = (person: Personal): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (person.tipo !== 'Conductor' || !withDocumentStatus) return 'missing';
    
    const now = new Date();
    const docs = person.documentacion;
    
    if (!docs) return 'missing';
    
    const checkDocument = (vencimiento: Date | string | undefined) => {
      if (!vencimiento) return null;
      const expiry = new Date(vencimiento);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return 'expired';
      if (daysUntilExpiry <= 30) return 'expiring';
      return 'valid';
    };
    
    const statuses = [
      docs.licenciaConducir?.vencimiento ? checkDocument(docs.licenciaConducir.vencimiento) : null,
      docs.carnetProfesional?.vencimiento ? checkDocument(docs.carnetProfesional.vencimiento) : null,
      docs.evaluacionMedica?.vencimiento ? checkDocument(docs.evaluacionMedica.vencimiento) : null,
      docs.psicofisico?.vencimiento ? checkDocument(docs.psicofisico.vencimiento) : null,
    ].filter(Boolean);
    
    if (statuses.length === 0) return 'missing';
    if (statuses.includes('expired')) return 'expired';
    if (statuses.includes('expiring')) return 'expiring';
    return 'valid';
  };

  // Filter personal based on search
  const filteredPersonal = personal.filter(person => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      person.nombre.toLowerCase().includes(searchLower) ||
      person.apellido.toLowerCase().includes(searchLower) ||
      person.dni.includes(searchLower) ||
      (person.numeroLegajo && person.numeroLegajo.includes(searchLower))
    );
  });

  // Prepare data for Select component
  const selectData = filteredPersonal.map(person => ({
    value: person._id,
    label: `${person.nombre} ${person.apellido}`,
  }));

  if (loading) {
    return (
      <Group gap="xs" mb="sm">
        <Loader size="sm" />
        <Text size="sm" color="dimmed">Cargando personal...</Text>
      </Group>
    );
  }

  if (personal.length === 0) {
    return (
      <Alert color="yellow" icon={<IconAlertTriangle size={16} />} mb="sm">
        <Text size="sm">
          {empresa ? 
            'No hay personal disponible para la empresa seleccionada.' :
            'No hay personal disponible con los filtros especificados.'
          }
        </Text>
      </Alert>
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data={selectData}
      renderOption={({ option, ...others }) => {
        const person = filteredPersonal.find(p => p._id === option.value);
        if (!person) return null;
        const empresaInfo = typeof person.empresa === 'object' ? person.empresa : null;
        const documentStatus = getDocumentStatus(person);
        return (
          <PersonalItem 
            {...others}
            label={`${person.nombre} ${person.apellido}`}
            description={empresaInfo ? empresaInfo.nombre : 'Sin empresa'}
            dni={person.dni}
            tipo={person.tipo}
            activo={person.activo}
            documentStatus={documentStatus}
          />
        );
      }}
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      nothingFoundMessage="No se encontró personal"
      maxDropdownHeight={400}
      required={required}
      error={error}
      disabled={disabled}
      clearable={clearable}
      leftSection={<IconUser size={16} />}
    />
  );
};

// Specialized selector for drivers only
export const ConductorSelector: React.FC<Omit<PersonalSelectorProps, 'onlyConductores'>> = (props) => (
  <PersonalSelector
    {...props}
    onlyConductores={true}
    withDocumentStatus={true}
    label={props.label || 'Conductor'}
    placeholder={props.placeholder || 'Seleccione conductor'}
  />
);

// Specialized selector for active employees only
export const PersonalActivoSelector: React.FC<Omit<PersonalSelectorProps, 'onlyActive'>> = (props) => (
  <PersonalSelector
    {...props}
    onlyActive={true}
    label={props.label || 'Personal Activo'}
    placeholder={props.placeholder || 'Seleccione personal activo'}
  />
);