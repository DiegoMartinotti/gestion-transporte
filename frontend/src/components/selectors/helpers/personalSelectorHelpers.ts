// Constants for mock data
const TRANSPORTES_SA = 'Transportes SA';
const PROFESIONAL_CATEGORIA = 'Profesional';
const CONDUCTOR_TIPO = 'Conductor';
const AYUDANTE_TIPO = 'Ayudante';

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

/**
 * Verifica si una licencia está vigente
 */
export const isLicenseValid = (persona: Personal): boolean => {
  const vencimiento = persona.documentacion?.licenciaConducir?.vencimiento;
  if (!vencimiento) return false;
  return new Date(vencimiento) > new Date();
};

/**
 * Verifica si la persona tiene la categoría de licencia requerida
 */
export const hasRequiredCategory = (persona: Personal, requiredCategory: string): boolean => {
  const categoria = persona.documentacion?.licenciaConducir?.categoria;
  return categoria === requiredCategory;
};

/**
 * Verifica si la persona tiene licencia (número presente)
 */
export const hasLicense = (persona: Personal): boolean => {
  return !!(persona.licenciaNumero || persona.documentacion?.licenciaConducir?.numero);
};

/**
 * Verifica si la persona cumple con el filtro de tipo
 */
export const matchesTipoFilter = (persona: Personal, tipo?: string | string[]): boolean => {
  if (!tipo) return true;

  if (Array.isArray(tipo)) {
    return tipo.includes(persona.tipo);
  }

  return persona.tipo === tipo;
};

/**
 * Verifica si la persona es un chofer válido
 */
export const isValidChofer = (persona: Personal): boolean => {
  return persona.tipo === CONDUCTOR_TIPO && hasLicense(persona);
};

/**
 * Verifica si la persona pasa los filtros básicos
 */
const passesBasicFilters = (
  persona: Personal,
  filters: {
    soloActivos: boolean;
    excludeIds: string[];
    empresaId?: string;
  }
): boolean => {
  const { soloActivos, excludeIds, empresaId } = filters;

  const passesActivation = !soloActivos || persona.activo;
  const notExcluded = !excludeIds.includes(persona._id);
  const matchesCompany = !empresaId || persona.empresa?._id === empresaId;

  return passesActivation && notExcluded && matchesCompany;
};

/**
 * Verifica si la persona pasa los filtros avanzados
 */
const passesAdvancedFilters = (
  persona: Personal,
  filters: {
    tipo?: string | string[];
    soloChoferes: boolean;
    requireValidLicense: boolean;
    requireSpecificCategory?: string;
  }
): boolean => {
  const { tipo, soloChoferes, requireValidLicense, requireSpecificCategory } = filters;

  const matchesTipo = matchesTipoFilter(persona, tipo);
  const validChofer = !soloChoferes || isValidChofer(persona);
  const validLicense = !requireValidLicense || isLicenseValid(persona);
  const validCategory =
    !requireSpecificCategory || hasRequiredCategory(persona, requireSpecificCategory);

  return matchesTipo && validChofer && validLicense && validCategory;
};

/**
 * Filtra el personal según los criterios dados
 */
export const filterPersonal = (
  personal: Personal[],
  filters: {
    soloActivos?: boolean;
    excludeIds?: string[];
    empresaId?: string;
    tipo?: string | string[];
    soloChoferes?: boolean;
    requireValidLicense?: boolean;
    requireSpecificCategory?: string;
  }
): Personal[] => {
  const {
    soloActivos = true,
    excludeIds = [],
    empresaId,
    tipo,
    soloChoferes = false,
    requireValidLicense = false,
    requireSpecificCategory,
  } = filters;

  return personal.filter((persona) => {
    return (
      passesBasicFilters(persona, { soloActivos, excludeIds, empresaId }) &&
      passesAdvancedFilters(persona, {
        tipo,
        soloChoferes,
        requireValidLicense,
        requireSpecificCategory,
      })
    );
  });
};

/**
 * Transforma el personal a formato de datos para el Select
 */
export const transformPersonalToSelectData = (
  personalFiltrado: Personal[],
  options: {
    showLicencia?: boolean;
    showEmpresa?: boolean;
    showDni?: boolean;
    withAvatar?: boolean;
    compact?: boolean;
  }
) => {
  const { showLicencia, showEmpresa, showDni, withAvatar, compact } = options;

  return personalFiltrado.map((persona) => {
    const licencia = persona.documentacion?.licenciaConducir?.numero || persona.licenciaNumero;
    const categoria = persona.documentacion?.licenciaConducir?.categoria;
    const licenciaLabel = licencia ? ` (Lic: ${licencia})` : '';

    return {
      value: persona._id,
      label: `${persona.nombre} ${persona.apellido}${licenciaLabel}`,
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
      compact,
    };
  });
};

/**
 * Obtiene el color del avatar según el tipo de personal
 */
export const getAvatarColor = (tipo: string): string => {
  return tipo === CONDUCTOR_TIPO ? 'blue' : 'green';
};

/**
 * Obtiene el color del badge según el tipo de personal
 */
export const getBadgeColor = (tipo: string): string => {
  return tipo === CONDUCTOR_TIPO ? 'blue' : 'green';
};

/**
 * Datos de prueba para el selector
 */
export const getMockPersonalData = (): Personal[] => [
  {
    _id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo: CONDUCTOR_TIPO,
    dni: '12345678',
    licenciaNumero: 'B123456789',
    empresa: { _id: 'emp1', nombre: TRANSPORTES_SA },
    documentacion: {
      licenciaConducir: {
        numero: 'B123456789',
        categoria: PROFESIONAL_CATEGORIA,
        vencimiento: '2025-12-31',
      },
    },
    activo: true,
  },
  {
    _id: '2',
    nombre: 'Carlos',
    apellido: 'González',
    tipo: CONDUCTOR_TIPO,
    dni: '87654321',
    licenciaNumero: 'B987654321',
    empresa: { _id: 'emp1', nombre: TRANSPORTES_SA },
    documentacion: {
      licenciaConducir: {
        numero: 'B987654321',
        categoria: PROFESIONAL_CATEGORIA,
        vencimiento: '2024-06-15',
      },
    },
    activo: true,
  },
  {
    _id: '3',
    nombre: 'Roberto',
    apellido: 'Martínez',
    tipo: CONDUCTOR_TIPO,
    dni: '11223344',
    licenciaNumero: 'B456789123',
    empresa: { _id: 'emp2', nombre: 'Logística Plus' },
    documentacion: {
      licenciaConducir: {
        numero: 'B456789123',
        categoria: 'Particular',
        vencimiento: '2025-03-20',
      },
    },
    activo: true,
  },
  {
    _id: '4',
    nombre: 'Miguel',
    apellido: 'López',
    tipo: AYUDANTE_TIPO,
    dni: '55667788',
    empresa: { _id: 'emp1', nombre: TRANSPORTES_SA },
    activo: true,
  },
  {
    _id: '5',
    nombre: 'Luis',
    apellido: 'Fernández',
    tipo: AYUDANTE_TIPO,
    dni: '99887766',
    empresa: { _id: 'emp2', nombre: 'Logística Plus' },
    activo: false,
  },
  {
    _id: '6',
    nombre: 'Ana',
    apellido: 'Rodríguez',
    tipo: CONDUCTOR_TIPO,
    dni: '44556677',
    licenciaNumero: 'B334455667',
    empresa: { _id: 'emp1', nombre: TRANSPORTES_SA },
    documentacion: {
      licenciaConducir: {
        numero: 'B334455667',
        categoria: PROFESIONAL_CATEGORIA,
        vencimiento: '2023-01-15', // Vencida
      },
    },
    activo: true,
  },
];
