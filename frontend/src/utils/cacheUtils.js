/**
 * @module utils/cacheUtils
 * @description Utilidades para la gestión de caché en el cliente
 */

// Almacenamiento de la caché en memoria
const cache = {};

// Configuración global
const CONFIG = {
  tiempoExpiracion: 5 * 60 * 1000, // 5 minutos por defecto
  maxItems: 100                    // Máximo número de items en caché
};

/**
 * Servicio para gestionar caché en memoria
 */
const cacheService = {
  /**
   * Obtiene un valor de la caché
   * @param {string} clave - Clave para identificar el item
   * @returns {any|null} Valor almacenado o null si no existe o expiró
   */
  obtener: (clave) => {
    const item = cache[clave];
    
    // Si no existe o expiró, retornamos null
    if (!item || (item.expiracion && Date.now() > item.expiracion)) {
      // Eliminamos el item expirado
      if (item) {
        delete cache[clave];
        console.log(`[CACHÉ] Ítem expirado eliminado: ${clave}`);
      }
      return null;
    }
    
    // Registramos el hit para debugging
    console.log(`[CACHÉ] Hit: ${clave}`);
    
    // Actualizamos la última vez que se accedió
    item.ultimoAcceso = Date.now();
    
    return item.valor;
  },
  
  /**
   * Almacena un valor en la caché
   * @param {string} clave - Clave para identificar el item
   * @param {any} valor - Valor a almacenar
   * @param {Object} opciones - Opciones de almacenamiento
   * @param {number} opciones.tiempoExpiracion - Tiempo en ms hasta que expire (0 para no expirar)
   */
  almacenar: (clave, valor, opciones = {}) => {
    // Si alcanzamos el límite, eliminamos el ítem con el acceso más antiguo
    const totalItems = Object.keys(cache).length;
    if (totalItems >= CONFIG.maxItems) {
      cacheService.limpiarMasAntiguos(1);
    }
    
    // Calculamos la expiración
    const tiempoExpiracion = opciones.tiempoExpiracion !== undefined 
      ? opciones.tiempoExpiracion 
      : CONFIG.tiempoExpiracion;
    
    const expiracion = tiempoExpiracion > 0 
      ? Date.now() + tiempoExpiracion 
      : null;
    
    // Almacenamos el valor
    cache[clave] = {
      valor,
      creacion: Date.now(),
      ultimoAcceso: Date.now(),
      expiracion
    };
    
    console.log(`[CACHÉ] Almacenado: ${clave}${expiracion ? ` (expira en ${tiempoExpiracion/1000}s)` : ''}`);
    
    return valor;
  },
  
  /**
   * Elimina un valor de la caché
   * @param {string} clave - Clave del ítem a eliminar
   * @returns {boolean} true si se eliminó, false si no existía
   */
  eliminar: (clave) => {
    if (cache[clave]) {
      delete cache[clave];
      console.log(`[CACHÉ] Eliminado: ${clave}`);
      return true;
    }
    return false;
  },
  
  /**
   * Elimina todos los ítems que coincidan con un patrón
   * @param {RegExp|string} patron - Patrón para filtrar claves a eliminar
   * @returns {number} Número de ítems eliminados
   */
  eliminarPorPatron: (patron) => {
    const eRegex = patron instanceof RegExp;
    let contador = 0;
    
    Object.keys(cache).forEach(clave => {
      if (eRegex ? patron.test(clave) : clave.includes(patron)) {
        delete cache[clave];
        contador++;
      }
    });
    
    if (contador > 0) {
      console.log(`[CACHÉ] Eliminados ${contador} ítems por patrón: ${patron}`);
    }
    
    return contador;
  },
  
  /**
   * Limpia los ítems más antiguos de la caché
   * @param {number} cantidad - Cantidad de ítems a eliminar
   * @returns {number} Número de ítems eliminados
   */
  limpiarMasAntiguos: (cantidad = 1) => {
    // Ordenamos por último acceso (más antiguo primero)
    const claves = Object.keys(cache).sort((a, b) => 
      cache[a].ultimoAcceso - cache[b].ultimoAcceso
    );
    
    // Eliminamos la cantidad solicitada
    const aEliminar = Math.min(cantidad, claves.length);
    for (let i = 0; i < aEliminar; i++) {
      delete cache[claves[i]];
    }
    
    if (aEliminar > 0) {
      console.log(`[CACHÉ] Limpieza: eliminados ${aEliminar} ítems más antiguos`);
    }
    
    return aEliminar;
  },
  
  /**
   * Limpia todos los ítems expirados
   * @returns {number} Número de ítems eliminados
   */
  limpiarExpirados: () => {
    const ahora = Date.now();
    let contador = 0;
    
    Object.keys(cache).forEach(clave => {
      const item = cache[clave];
      if (item.expiracion && ahora > item.expiracion) {
        delete cache[clave];
        contador++;
      }
    });
    
    if (contador > 0) {
      console.log(`[CACHÉ] Limpieza: eliminados ${contador} ítems expirados`);
    }
    
    return contador;
  },
  
  /**
   * Limpia toda la caché
   * @returns {number} Número de ítems eliminados
   */
  limpiarTodo: () => {
    const cantidad = Object.keys(cache).length;
    
    // Reiniciamos el objeto caché
    Object.keys(cache).forEach(key => delete cache[key]);
    
    if (cantidad > 0) {
      console.log(`[CACHÉ] Limpieza total: eliminados ${cantidad} ítems`);
    }
    
    return cantidad;
  },
  
  /**
   * Obtiene estadísticas de la caché
   * @returns {Object} Estadísticas de uso de la caché
   */
  estadisticas: () => {
    const totalItems = Object.keys(cache).length;
    const ahora = Date.now();
    let itemsExpirados = 0;
    let edadPromedio = 0;
    
    if (totalItems > 0) {
      // Calculamos edad promedio e ítems expirados
      let sumaEdad = 0;
      
      Object.values(cache).forEach(item => {
        if (item.expiracion && ahora > item.expiracion) {
          itemsExpirados++;
        }
        sumaEdad += (ahora - item.creacion);
      });
      
      edadPromedio = sumaEdad / totalItems;
    }
    
    return {
      totalItems,
      itemsExpirados,
      edadPromedio: Math.round(edadPromedio / 1000), // en segundos
      limiteItems: CONFIG.maxItems,
      tiempoExpiracionPredeterminado: CONFIG.tiempoExpiracion / 1000 // en segundos
    };
  },
  
  /**
   * Obtiene un valor de la caché o lo carga con una función
   * @param {string} clave - Clave para identificar el item
   * @param {Function} fnCargar - Función para cargar el valor si no está en caché
   * @param {Object} opciones - Opciones de almacenamiento
   * @returns {Promise<any>} Valor obtenido
   */
  obtenerOCargar: async (clave, fnCargar, opciones = {}) => {
    // Intentamos obtener de la caché
    const valorCached = cacheService.obtener(clave);
    
    if (valorCached !== null) {
      return valorCached;
    }
    
    // Si no está en caché, lo cargamos
    console.log(`[CACHÉ] Miss: ${clave}`);
    
    try {
      const valor = await fnCargar();
      
      // Solo almacenamos valores no nulos/undefined
      if (valor !== null && valor !== undefined) {
        return cacheService.almacenar(clave, valor, opciones);
      }
      
      return valor;
    } catch (error) {
      console.error(`[CACHÉ] Error cargando ${clave}:`, error);
      throw error;
    }
  }
};

// Configuramos un limpiador automático de ítems expirados cada minuto
setInterval(() => {
  cacheService.limpiarExpirados();
}, 60 * 1000);

export default cacheService; 