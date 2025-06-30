import { 
  Select, 
  Group, 
  Text, 
  Badge, 
  Avatar, 
  Stack, 
  Button, 
  Modal,
  TextInput,
  MultiSelect,
  Card,
  Grid,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { 
  IconTruck, 
  IconSearch, 
  IconFilter, 
  IconCheck, 
  IconX, 
  IconAlertTriangle,
  IconPlus
} from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Vehiculo } from '../../types/vehiculo';
import { vehiculoService } from '../../services/vehiculoService';
import { differenceInDays, parseISO, isValid } from 'date-fns';

interface VehiculoSelectorProps {
  value?: string | string[]; // string para single, string[] para multiple
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  // Filtros específicos
  empresaId?: string;
  tipoVehiculo?: string;
  soloActivos?: boolean;
  soloConDocumentacionVigente?: boolean;
  excluirIds?: string[];
  // Configuración avanzada
  withNewVehicleOption?: boolean;
  onCreateNew?: () => void;
  // Vista detallada
  showDetails?: boolean;
  compact?: boolean;
}

interface VehiculoOption {
  value: string;
  label: string;
  vehiculo: Vehiculo;
  documentacionEstado: 'vigente' | 'proximo' | 'vencido' | 'incompleta';
  disabled?: boolean;
}

const getDocumentacionEstado = (vehiculo: Vehiculo): 'vigente' | 'proximo' | 'vencido' | 'incompleta' => {
  const hoy = new Date();
  const docs = vehiculo.documentacion;
  
  if (!docs) return 'incompleta';
  
  const documentos = [
    docs.vtv?.vencimiento,
    docs.seguro?.vencimiento,
    docs.ruta?.vencimiento,
    docs.senasa?.vencimiento
  ].filter(Boolean);
  
  if (documentos.length === 0) return 'incompleta';
  
  let hayVencidos = false;
  let hayProximos = false;
  
  for (const fechaStr of documentos) {
    if (!fechaStr) continue;
    
    try {
      const fecha = parseISO(fechaStr);
      if (!isValid(fecha)) continue;
      
      const diasRestantes = differenceInDays(fecha, hoy);
      
      if (diasRestantes < 0) {
        hayVencidos = true;
      } else if (diasRestantes <= 30) {
        hayProximos = true;
      }
    } catch {
      // Ignorar fechas inválidas
    }
  }
  
  if (hayVencidos) return 'vencido';
  if (hayProximos) return 'proximo';
  return 'vigente';
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'vigente': return 'green';
    case 'proximo': return 'yellow';
    case 'vencido': return 'red';
    case 'incompleta': return 'gray';
    default: return 'gray';
  }
};

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case 'vigente': return <IconCheck size={14} />;
    case 'proximo': return <IconAlertTriangle size={14} />;
    case 'vencido': return <IconX size={14} />;
    case 'incompleta': return <IconAlertTriangle size={14} />;
    default: return <IconAlertTriangle size={14} />;
  }
};

export const VehiculoSelector: React.FC<VehiculoSelectorProps> = ({
  value,
  onChange,
  multiple = false,
  required = false,
  label = "Vehículo",
  placeholder = "Seleccionar vehículo...",
  description,
  error,
  disabled = false,
  clearable = true,
  searchable = true,
  empresaId,
  tipoVehiculo,
  soloActivos = true,
  soloConDocumentacionVigente = false,
  excluirIds = [],
  withNewVehicleOption = false,
  onCreateNew,
  showDetails = false,
  compact = false
}) => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [filterModalOpened, setFilterModalOpened] = useState(false);
  const [filtros, setFiltros] = useState({
    empresaId: empresaId || '',
    tipo: tipoVehiculo || '',
    activo: soloActivos,
    documentacionVigente: soloConDocumentacionVigente
  });

  useEffect(() => {
    loadVehiculos();
  }, [debouncedSearch, filtros]);

  const loadVehiculos = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      if (filtros.empresaId) {
        params.empresa = filtros.empresaId;
      }
      
      if (filtros.tipo) {
        params.tipo = filtros.tipo;
      }
      
      if (filtros.activo) {
        params.activo = true;
      }

      const response = await vehiculoService.getAll(params);
      let vehiculosData = (response.data as any)?.data || response.data;
      
      // Filtrar por documentación vigente si se requiere
      if (filtros.documentacionVigente) {
        vehiculosData = vehiculosData.filter((vehiculo: Vehiculo) => {
          const estado = getDocumentacionEstado(vehiculo);
          return estado === 'vigente';
        });
      }
      
      // Excluir IDs específicos
      if (excluirIds.length > 0) {
        vehiculosData = vehiculosData.filter((vehiculo: Vehiculo) => 
          !excluirIds.includes(vehiculo._id!)
        );
      }
      
      setVehiculos(vehiculosData);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const vehiculoOptions: VehiculoOption[] = useMemo(() => {
    return vehiculos.map(vehiculo => {
      const documentacionEstado = getDocumentacionEstado(vehiculo);
      
      return {
        value: vehiculo._id!,
        label: `${vehiculo.dominio} - ${vehiculo.tipo}${vehiculo.modelo ? ` ${vehiculo.modelo}` : ''}`,
        vehiculo,
        documentacionEstado,
        disabled: !vehiculo.activo || (soloConDocumentacionVigente && documentacionEstado !== 'vigente')
      };
    });
  }, [vehiculos, soloConDocumentacionVigente]);

  const renderSelectOption = (option: VehiculoOption) => {
    if (compact) {
      return (
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <IconTruck size={16} />
            <Text size="sm">{option.vehiculo.dominio}</Text>
            <Text size="xs" c="dimmed">{option.vehiculo.tipo}</Text>
          </Group>
          <Group gap="xs">
            <Badge 
              color={option.vehiculo.activo ? 'green' : 'red'} 
              variant="light" 
              size="xs"
            >
              {option.vehiculo.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            <Badge 
              color={getEstadoColor(option.documentacionEstado)} 
              variant="light" 
              size="xs"
            >
              {getEstadoIcon(option.documentacionEstado)}
            </Badge>
          </Group>
        </Group>
      );
    }

    return (
      <Group justify="space-between" wrap="nowrap" p="xs">
        <Group gap="sm">
          <Avatar color="blue" radius="sm">
            <IconTruck size={20} />
          </Avatar>
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={500} size="sm">{option.vehiculo.dominio}</Text>
              <Badge 
                color={option.vehiculo.activo ? 'green' : 'red'} 
                variant="light" 
                size="xs"
              >
                {option.vehiculo.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed">{option.vehiculo.tipo}</Text>
              {option.vehiculo.modelo && (
                <Text size="xs" c="dimmed">• {option.vehiculo.modelo}</Text>
              )}
              {typeof option.vehiculo.empresa === 'object' && option.vehiculo.empresa && 'nombre' in option.vehiculo.empresa && (
                <Text size="xs" c="dimmed">• {option.vehiculo.empresa.nombre}</Text>
              )}
            </Group>
          </Stack>
        </Group>
        <Group gap="xs">
          <Tooltip label={`Documentación: ${option.documentacionEstado}`}>
            <Badge 
              color={getEstadoColor(option.documentacionEstado)} 
              variant="light" 
              size="sm"
              leftSection={getEstadoIcon(option.documentacionEstado)}
            >
              {option.documentacionEstado === 'vigente' ? 'OK' :
               option.documentacionEstado === 'proximo' ? 'Próx.' :
               option.documentacionEstado === 'vencido' ? 'Venc.' : 'Inc.'}
            </Badge>
          </Tooltip>
        </Group>
      </Group>
    );
  };

  const selectData = vehiculoOptions.map(option => ({
    value: option.value,
    label: option.label,
    disabled: option.disabled
  }));

  // Agregar opción de crear nuevo vehículo
  if (withNewVehicleOption && onCreateNew) {
    selectData.unshift({
      value: '__new__',
      label: '+ Agregar nuevo vehículo',
      disabled: false
    });
  }

  const handleChange = (newValue: string | string[] | null) => {
    if (newValue === '__new__') {
      onCreateNew?.();
      return;
    }
    onChange(newValue);
  };

  if (showDetails) {
    const selectedVehiculos = vehiculoOptions.filter(option => 
      multiple 
        ? Array.isArray(value) && value.includes(option.value)
        : value === option.value
    );

    return (
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>{label}</Text>
          <Group gap="xs">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => setFilterModalOpened(true)}
            >
              <IconFilter size={16} />
            </ActionIcon>
            {withNewVehicleOption && onCreateNew && (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={onCreateNew}
              >
                Nuevo
              </Button>
            )}
          </Group>
        </Group>

        {multiple ? (
          <MultiSelect
            data={selectData}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
            placeholder={placeholder}
            searchable={searchable}
            clearable={clearable}
            disabled={disabled}
            error={error}
            description={description}
            required={required}
            onSearchChange={setSearchValue}
            renderOption={({ option }) => {
              const vehiculoOption = vehiculoOptions.find(v => v.value === option.value);
              return vehiculoOption ? renderSelectOption(vehiculoOption) : option.label;
            }}
          />
        ) : (
          <Select
            data={selectData}
            value={typeof value === 'string' ? value : ''}
            onChange={handleChange}
            placeholder={placeholder}
            searchable={searchable}
            clearable={clearable}
            disabled={disabled}
            error={error}
            description={description}
            required={required}
            onSearchChange={setSearchValue}
            renderOption={({ option }) => {
              const vehiculoOption = vehiculoOptions.find(v => v.value === option.value);
              return vehiculoOption ? renderSelectOption(vehiculoOption) : option.label;
            }}
          />
        )}

        {/* Mostrar vehículos seleccionados */}
        {selectedVehiculos.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>Vehículos Seleccionados:</Text>
            <Grid>
              {selectedVehiculos.map(option => (
                <Grid.Col key={option.value} span={6}>
                  <Card withBorder p="sm">
                    {renderSelectOption(option)}
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        )}

        {/* Modal de filtros */}
        <Modal
          opened={filterModalOpened}
          onClose={() => setFilterModalOpened(false)}
          title="Filtrar Vehículos"
          size="md"
        >
          <Stack gap="md">
            <TextInput
              label="Buscar"
              placeholder="Dominio, marca, modelo..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              leftSection={<IconSearch size={16} />}
            />
            
            <Select
              label="Empresa"
              placeholder="Todas las empresas"
              value={filtros.empresaId}
              onChange={(value) => setFiltros(prev => ({ ...prev, empresaId: value || '' }))}
              data={[
                { value: '', label: 'Todas las empresas' },
                // Aquí se cargarían las empresas disponibles
              ]}
              clearable
            />
            
            <Select
              label="Tipo de Vehículo"
              placeholder="Todos los tipos"
              value={filtros.tipo}
              onChange={(value) => setFiltros(prev => ({ ...prev, tipo: value || '' }))}
              data={[
                { value: '', label: 'Todos los tipos' },
                { value: 'Camión', label: 'Camión' },
                { value: 'Camioneta', label: 'Camioneta' },
                { value: 'Acoplado', label: 'Acoplado' },
                { value: 'Semirremolque', label: 'Semirremolque' }
              ]}
              clearable
            />
            
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setFiltros({
                    empresaId: '',
                    tipo: '',
                    activo: true,
                    documentacionVigente: false
                  });
                  setSearchValue('');
                }}
              >
                Limpiar
              </Button>
              <Button onClick={() => setFilterModalOpened(false)}>
                Aplicar
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    );
  }

  // Vista simple
  return multiple ? (
    <MultiSelect
      label={label}
      data={selectData}
      value={Array.isArray(value) ? value : []}
      onChange={handleChange}
      placeholder={placeholder}
      searchable={searchable}
      clearable={clearable}
      disabled={disabled}
      error={error}
      description={description}
      required={required}
      onSearchChange={setSearchValue}
      renderOption={({ option }) => {
        const vehiculoOption = vehiculoOptions.find(v => v.value === option.value);
        return vehiculoOption ? renderSelectOption(vehiculoOption) : option.label;
      }}
    />
  ) : (
    <Select
      label={label}
      data={selectData}
      value={typeof value === 'string' ? value : ''}
      onChange={handleChange}
      placeholder={placeholder}
      searchable={searchable}
      clearable={clearable}
      disabled={disabled}
      error={error}
      description={description}
      required={required}
      onSearchChange={setSearchValue}
      renderOption={({ option }) => {
        const vehiculoOption = vehiculoOptions.find(v => v.value === option.value);
        return vehiculoOption ? renderSelectOption(vehiculoOption) : option.label;
      }}
    />
  );
};