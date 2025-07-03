import { Select, MultiSelect, Group, Text, Badge, Avatar, Box } from '@mantine/core';
import { IconUser, IconTruck, IconLicense } from '@tabler/icons-react';
import { useState, forwardRef } from 'react';

interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  tipo: string;
  licenciaNumero?: string;
  dni?: string;
  empresa?: {
    _id: string;
    nombre: string;
  };
  documentacion?: {
    licenciaConducir?: {
      numero?: string;
      categoria?: string;
      vencimiento?: string;
    };
  };
  activo?: boolean;
}

interface PersonalSelectorProps {
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
  multiple?: boolean;
  // Filtros específicos
  tipo?: string | string[]; // Filtrar por tipo específico
  soloChoferes?: boolean; // Filtro específico para choferes (con licencia válida)
  soloActivos?: boolean; // Filtrar solo personal activo
  empresaId?: string; // Filtrar por empresa específica
  excludeIds?: string[];
  // Configuración visual
  disabled?: boolean;
  withAvatar?: boolean;
  showLicencia?: boolean;
  showEmpresa?: boolean;
  showDni?: boolean;
  compact?: boolean;
  // Validaciones adicionales
  requireValidLicense?: boolean; // Requiere licencia válida (no vencida)
  requireSpecificCategory?: string; // Requiere categoría específica de licencia
}

// Interface para las props del SelectItem
interface SelectItemProps {
  label: string; 
  nombre: string; 
  apellido: string; 
  tipo: string; 
  licencia?: string; 
  categoria?: string;
  dni?: string; 
  empresa?: string;
  showLicencia?: boolean;
  showEmpresa?: boolean;
  showDni?: boolean;
  withAvatar?: boolean;
  compact?: boolean;
  [key: string]: any;
}

// Componente para renderizar items del selector
const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(({ 
  label, 
  nombre, 
  apellido, 
  tipo, 
  licencia, 
  categoria,
  dni, 
  empresa,
  showLicencia,
  showEmpresa,
  showDni,
  withAvatar,
  compact,
  ...others 
}, ref) => (
  <div ref={ref} {...others}>
    <Group gap="sm" wrap="nowrap">
      {withAvatar && (
        <Avatar size="sm" color={tipo === 'Conductor' ? 'blue' : 'green'}>
          {tipo === 'Conductor' ? <IconTruck size={16} /> : <IconUser size={16} />}
        </Avatar>
      )}
      
      <Box style={{ flex: 1 }}>
        <Group gap="xs" align="center">
          <Text size="sm" fw={500}>
            {nombre} {apellido}
          </Text>
          <Badge size="xs" variant="light" color={tipo === 'Conductor' ? 'blue' : 'green'}>
            {tipo}
          </Badge>
        </Group>
        
        {!compact && (
          <Group gap="md" mt={2}>
            {showDni && dni && (
              <Text size="xs" c="dimmed">DNI: {dni}</Text>
            )}
            {showLicencia && licencia && (
              <Group gap={4}>
                <IconLicense size={12} />
                <Text size="xs" c="dimmed">
                  {licencia}
                  {categoria && ` (${categoria})`}
                </Text>
              </Group>
            )}
            {showEmpresa && empresa && (
              <Text size="xs" c="dimmed">Empresa: {empresa}</Text>
            )}
          </Group>
        )}
      </Box>
    </Group>
  </div>
));

export function PersonalSelector({
  value,
  onChange,
  label,
  placeholder = "Selecciona personal",
  required = false,
  clearable = false,
  error,
  multiple = false,
  tipo,
  soloChoferes = false,
  soloActivos = true,
  empresaId,
  excludeIds = [],
  disabled = false,
  withAvatar = false,
  showLicencia = false,
  showEmpresa = false,
  showDni = false,
  compact = false,
  requireValidLicense = false,
  requireSpecificCategory
}: PersonalSelectorProps) {
  const [personal, setPersonal] = useState<Personal[]>([
    {
      _id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      tipo: 'Conductor',
      dni: '12345678',
      licenciaNumero: 'B123456789',
      empresa: { _id: 'emp1', nombre: 'Transportes SA' },
      documentacion: {
        licenciaConducir: {
          numero: 'B123456789',
          categoria: 'Profesional',
          vencimiento: '2025-12-31'
        }
      },
      activo: true
    },
    {
      _id: '2',
      nombre: 'Carlos',
      apellido: 'González',
      tipo: 'Conductor',
      dni: '87654321',
      licenciaNumero: 'B987654321',
      empresa: { _id: 'emp1', nombre: 'Transportes SA' },
      documentacion: {
        licenciaConducir: {
          numero: 'B987654321',
          categoria: 'Profesional',
          vencimiento: '2024-06-15'
        }
      },
      activo: true
    },
    {
      _id: '3',
      nombre: 'Roberto',
      apellido: 'Martínez',
      tipo: 'Conductor',
      dni: '11223344',
      licenciaNumero: 'B456789123',
      empresa: { _id: 'emp2', nombre: 'Logística Plus' },
      documentacion: {
        licenciaConducir: {
          numero: 'B456789123',
          categoria: 'Particular',
          vencimiento: '2025-03-20'
        }
      },
      activo: true
    },
    {
      _id: '4',
      nombre: 'Miguel',
      apellido: 'López',
      tipo: 'Ayudante',
      dni: '55667788',
      empresa: { _id: 'emp1', nombre: 'Transportes SA' },
      activo: true
    },
    {
      _id: '5',
      nombre: 'Luis',
      apellido: 'Fernández',
      tipo: 'Ayudante',
      dni: '99887766',
      empresa: { _id: 'emp2', nombre: 'Logística Plus' },
      activo: false
    },
    {
      _id: '6',
      nombre: 'Ana',
      apellido: 'Rodríguez',
      tipo: 'Conductor',
      dni: '44556677',
      licenciaNumero: 'B334455667',
      empresa: { _id: 'emp1', nombre: 'Transportes SA' },
      documentacion: {
        licenciaConducir: {
          numero: 'B334455667',
          categoria: 'Profesional',
          vencimiento: '2023-01-15' // Vencida
        }
      },
      activo: true
    }
  ]);
  const [loading] = useState(false);

  // Función para verificar si una licencia está vigente
  const isLicenseValid = (persona: Personal): boolean => {
    const vencimiento = persona.documentacion?.licenciaConducir?.vencimiento;
    if (!vencimiento) return false;
    return new Date(vencimiento) > new Date();
  };

  // Función para verificar categoría específica
  const hasRequiredCategory = (persona: Personal, requiredCategory: string): boolean => {
    const categoria = persona.documentacion?.licenciaConducir?.categoria;
    return categoria === requiredCategory;
  };

  // Aplicar filtros
  const personalFiltrado = personal.filter(persona => {
    // Filtro por activos
    if (soloActivos && !persona.activo) return false;
    
    // Filtro por IDs excluidos
    if (excludeIds.includes(persona._id)) return false;
    
    // Filtro por empresa
    if (empresaId && persona.empresa?._id !== empresaId) return false;
    
    // Filtro por tipo
    if (tipo) {
      if (Array.isArray(tipo)) {
        if (!tipo.includes(persona.tipo)) return false;
      } else {
        if (persona.tipo !== tipo) return false;
      }
    }
    
    // Filtro específico para choferes
    if (soloChoferes) {
      if (persona.tipo !== 'Conductor') return false;
      if (!persona.licenciaNumero && !persona.documentacion?.licenciaConducir?.numero) return false;
    }
    
    // Filtro por licencia válida
    if (requireValidLicense && !isLicenseValid(persona)) return false;
    
    // Filtro por categoría específica
    if (requireSpecificCategory && !hasRequiredCategory(persona, requireSpecificCategory)) return false;
    
    return true;
  });

  // Preparar datos para el selector
  const data = personalFiltrado.map(persona => {
    const licencia = persona.documentacion?.licenciaConducir?.numero || persona.licenciaNumero;
    const categoria = persona.documentacion?.licenciaConducir?.categoria;
    
    return {
      value: persona._id,
      label: `${persona.nombre} ${persona.apellido}${licencia ? ` (Lic: ${licencia})` : ''}`,
      // Props adicionales para el componente personalizado
      nombre: persona.nombre,
      apellido: persona.apellido,
      tipo: persona.tipo,
      licencia,
      categoria,
      dni: persona.dni,
      empresa: persona.empresa?.nombre,
      showLicencia,
      showEmpresa,
      showDni,
      withAvatar,
      compact
    };
  });

  const commonProps = {
    label,
    placeholder,
    required,
    clearable,
    error,
    disabled: disabled || loading,
    searchable: true,
    itemComponent: SelectItem
  };

  if (multiple) {
    return (
      <MultiSelect
        {...commonProps}
        data={data}
        value={Array.isArray(value) ? value : value ? [value] : []}
        onChange={onChange}
      />
    );
  }

  return (
    <Select
      {...commonProps}
      data={data}
      value={Array.isArray(value) ? value[0] : value}
      onChange={onChange}
    />
  );
}

// Componente específico para choferes (usando PersonalSelector con configuración predefinida)
export function ChoferSelector(props: Omit<PersonalSelectorProps, 'soloChoferes' | 'showLicencia' | 'requireValidLicense'> & {
  requireValidLicense?: boolean;
}) {
  return (
    <PersonalSelector
      {...props}
      soloChoferes={true}
      showLicencia={true}
      requireValidLicense={props.requireValidLicense}
      label={props.label || "Seleccionar Chofer"}
      placeholder={props.placeholder || "Selecciona un chofer"}
    />
  );
}

export default PersonalSelector;