/**
 * Utilidad para precargar rutas de forma estratégica
 * Mejora la experiencia del usuario precargando páginas que probablemente visitará
 */

type PreloadableRoute = 
  | 'dashboard'
  | 'clientes' 
  | 'empresas'
  | 'personal'
  | 'sites'
  | 'tramos'
  | 'vehiculos'
  | 'viajes'
  | 'extras'
  | 'ordenes-compra'
  | 'calculadora'
  | 'import'
  | 'reports';

interface RoutePreloader {
  [key: string]: () => Promise<any>;
}

// Mapa de rutas y sus imports lazy
const routePreloaders: RoutePreloader = {
  dashboard: () => import('../pages/Dashboard'),
  clientes: () => import('../pages/clientes/ClientesPage'),
  'cliente-detail': () => import('../pages/clientes/ClienteDetailPage'),
  'cliente-form': () => import('../pages/clientes/ClienteFormPage'),
  empresas: () => import('../pages/empresas/EmpresasPage'),
  'empresa-detail': () => import('../pages/empresas/EmpresaDetailPage'),
  personal: () => import('../pages/personal/PersonalPage').then(module => ({ default: module.PersonalPage })),
  sites: () => import('../pages/sites').then(module => ({ default: module.SitesPage })),
  tramos: () => import('../pages/tramos/TramosPage'),
  vehiculos: () => import('../pages/vehiculos/VehiculosPage'),
  viajes: () => import('../pages/viajes/ViajesPage').then(module => ({ default: module.ViajesPage })),
  extras: () => import('../pages/extras/ExtrasPage').then(module => ({ default: module.ExtrasPage })),
  'ordenes-compra': () => import('../pages/ordenes-compra/OrdenesCompraPage').then(module => ({ default: module.OrdenesCompraPage })),
  calculadora: () => import('../pages/calculadora/CalculadoraPage'),
  import: () => import('../pages/import/ImportPage').then(module => ({ default: module.ImportPage })),
  reports: () => import('../pages/reports/ReportsPage').then(module => ({ default: module.ReportsPage }))
};

// Cache de rutas ya precargadas
const preloadedRoutes = new Set<string>();

/**
 * Precarga una ruta específica
 */
export const preloadRoute = async (route: PreloadableRoute): Promise<void> => {
  if (preloadedRoutes.has(route)) {
    return; // Ya está precargada
  }

  const preloader = routePreloaders[route];
  if (!preloader) {
    console.warn(`Route preloader not found for: ${route}`);
    return;
  }

  try {
    await preloader();
    preloadedRoutes.add(route);
    console.debug(`Route preloaded: ${route}`);
  } catch (error) {
    console.error(`Failed to preload route ${route}:`, error);
  }
};

/**
 * Precarga múltiples rutas en paralelo
 */
export const preloadRoutes = async (routes: PreloadableRoute[]): Promise<void> => {
  const promises = routes
    .filter(route => !preloadedRoutes.has(route))
    .map(route => preloadRoute(route));
  
  await Promise.allSettled(promises);
};

/**
 * Estrategias de precarga predefinidas
 */
export const preloadStrategies = {
  /**
   * Precarga rutas principales después del login
   */
  afterLogin: () => preloadRoutes(['dashboard', 'clientes', 'viajes']),
  
  /**
   * Precarga rutas de gestión cuando se visita cualquier página de gestión
   */
  managementContext: () => preloadRoutes(['clientes', 'empresas', 'personal']),
  
  /**
   * Precarga rutas operacionales cuando se visita viajes o tramos
   */
  operationalContext: () => preloadRoutes(['viajes', 'tramos', 'vehiculos', 'ordenes-compra']),
  
  /**
   * Precarga herramientas de análisis
   */
  analyticsContext: () => preloadRoutes(['reports', 'calculadora']),
  
  /**
   * Precarga todo (usar con cuidado - solo en conexiones rápidas)
   */
  preloadAll: () => preloadRoutes([
    'dashboard', 'clientes', 'empresas', 'personal', 
    'sites', 'tramos', 'vehiculos', 'viajes', 'extras',
    'ordenes-compra', 'calculadora', 'import', 'reports'
  ])
};

/**
 * Hook para precargar rutas basado en el hover del menú
 */
export const setupMenuPreloading = () => {
  // Detectar hover en elementos del menú y precargar la ruta correspondiente
  const menuItems = document.querySelectorAll('[data-route-preload]');
  
  menuItems.forEach(item => {
    let hoverTimer: NodeJS.Timeout;
    
    item.addEventListener('mouseenter', () => {
      const route = item.getAttribute('data-route-preload') as PreloadableRoute;
      if (route) {
        // Retrasar precarga para evitar precargas innecesarias
        hoverTimer = setTimeout(() => preloadRoute(route), 200);
      }
    });
    
    item.addEventListener('mouseleave', () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    });
  });
};

/**
 * Precarga inteligente basada en patrones de navegación
 */
export const intelligentPreload = {
  /**
   * Analiza la ruta actual y precarga rutas relacionadas
   */
  fromCurrentRoute: (currentPath: string) => {
    const path = currentPath.toLowerCase();
    
    if (path.includes('/clientes')) {
      preloadStrategies.managementContext();
      preloadRoute('sites'); // Sites suelen visitarse después de clientes
    } else if (path.includes('/viajes')) {
      preloadStrategies.operationalContext();
    } else if (path.includes('/reports')) {
      preloadStrategies.analyticsContext();
    } else if (path === '/' || path === '/dashboard') {
      preloadStrategies.afterLogin();
    }
  },
  
  /**
   * Precarga basada en la hora del día (patrones de uso)
   */
  timeBasedPreload: () => {
    const hour = new Date().getHours();
    
    // Horario comercial - precargar operaciones
    if (hour >= 8 && hour <= 18) {
      preloadStrategies.operationalContext();
    }
    // Fuera de horario - precargar reportes y gestión
    else {
      preloadStrategies.analyticsContext();
      preloadStrategies.managementContext();
    }
  }
};

/**
 * Inicializa el sistema de precarga
 */
export const initializeRoutePreloader = () => {
  // Configurar precarga en hover del menú
  document.addEventListener('DOMContentLoaded', setupMenuPreloading);
  
  // Precarga inteligente después de 2 segundos de inactividad
  let inactivityTimer: NodeJS.Timeout;
  
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      intelligentPreload.fromCurrentRoute(window.location.pathname);
    }, 2000);
  };
  
  // Monitorear actividad del usuario
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  
  // Iniciar timer
  resetInactivityTimer();
};

export default {
  preloadRoute,
  preloadRoutes,
  preloadStrategies,
  intelligentPreload,
  initializeRoutePreloader
};