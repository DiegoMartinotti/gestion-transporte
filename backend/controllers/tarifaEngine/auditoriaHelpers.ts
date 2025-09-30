/**
 * Funciones auxiliares para procesamiento de auditor

ías
 */
import { IAuditoriaCalculo } from '../../services/tarifaEngine/types';

/**
 * Agrupa auditorías según el criterio especificado
 */
export function agruparAuditorias(
  auditorias: IAuditoriaCalculo[],
  criterio: string
): Record<string, unknown> | null {
  switch (criterio) {
    case 'cliente':
      return agruparPorCliente(auditorias);
    case 'metodo':
      return agruparPorMetodo(auditorias);
    case 'fecha':
      return agruparPorFecha(auditorias);
    case 'hora':
      return agruparPorHora(auditorias);
    default:
      return null;
  }
}

function agruparPorCliente(
  auditorias: IAuditoriaCalculo[]
): Record<string, Record<string, unknown>> {
  return auditorias.reduce((acc: Record<string, Record<string, unknown>>, auditoria) => {
    const cliente = auditoria.contexto.clienteId.toString();
    if (!acc[cliente]) {
      acc[cliente] = {
        cantidad: 0,
        tiempoPromedio: 0,
        errores: 0,
        totalCalculado: 0,
        metodosUtilizados: new Set(),
      };
    }

    acc[cliente].cantidad = (acc[cliente].cantidad as number) + 1;
    acc[cliente].tiempoPromedio =
      ((acc[cliente].tiempoPromedio as number) * ((acc[cliente].cantidad as number) - 1) +
        auditoria.tiempoEjecucionMs) /
      (acc[cliente].cantidad as number);

    if (auditoria.errores?.length > 0) {
      acc[cliente].errores = (acc[cliente].errores as number) + 1;
    }

    acc[cliente].totalCalculado =
      (acc[cliente].totalCalculado as number) + (auditoria.resultado.total || 0);
    (acc[cliente].metodosUtilizados as Set<string>).add(auditoria.resultado.metodoUtilizado);

    return acc;
  }, {});
}

function agruparPorMetodo(
  auditorias: IAuditoriaCalculo[]
): Record<string, Record<string, unknown>> {
  return auditorias.reduce((acc: Record<string, Record<string, unknown>>, auditoria) => {
    const metodo = auditoria.resultado.metodoUtilizado;
    if (!acc[metodo]) {
      acc[metodo] = {
        cantidad: 0,
        tiempoPromedio: 0,
        errores: 0,
        totalPromedio: 0,
        clientesUnicos: new Set(),
      };
    }

    acc[metodo].cantidad = (acc[metodo].cantidad as number) + 1;
    acc[metodo].tiempoPromedio =
      ((acc[metodo].tiempoPromedio as number) * ((acc[metodo].cantidad as number) - 1) +
        auditoria.tiempoEjecucionMs) /
      (acc[metodo].cantidad as number);

    if (auditoria.errores?.length > 0) {
      acc[metodo].errores = (acc[metodo].errores as number) + 1;
    }

    acc[metodo].totalPromedio =
      ((acc[metodo].totalPromedio as number) * ((acc[metodo].cantidad as number) - 1) +
        (auditoria.resultado.total || 0)) /
      (acc[metodo].cantidad as number);

    (acc[metodo].clientesUnicos as Set<string>).add(auditoria.contexto.clienteId.toString());

    return acc;
  }, {});
}

function agruparPorFecha(auditorias: IAuditoriaCalculo[]): Record<string, Record<string, unknown>> {
  return auditorias.reduce((acc: Record<string, Record<string, unknown>>, auditoria) => {
    const fecha = auditoria.timestamp.toISOString().split('T')[0];
    if (!acc[fecha]) {
      acc[fecha] = {
        cantidad: 0,
        errores: 0,
        tiempoTotal: 0,
        montoTotal: 0,
      };
    }

    acc[fecha].cantidad = (acc[fecha].cantidad as number) + 1;
    acc[fecha].tiempoTotal = (acc[fecha].tiempoTotal as number) + auditoria.tiempoEjecucionMs;
    acc[fecha].montoTotal = (acc[fecha].montoTotal as number) + (auditoria.resultado.total || 0);

    if (auditoria.errores?.length > 0) {
      acc[fecha].errores = (acc[fecha].errores as number) + 1;
    }

    return acc;
  }, {});
}

function agruparPorHora(auditorias: IAuditoriaCalculo[]): Record<string, Record<string, unknown>> {
  return auditorias.reduce((acc: Record<string, Record<string, unknown>>, auditoria) => {
    const hora = auditoria.timestamp.getHours();
    if (!acc[hora]) {
      acc[hora] = {
        cantidad: 0,
        errores: 0,
        tiempoPromedio: 0,
      };
    }

    acc[hora].cantidad = (acc[hora].cantidad as number) + 1;
    acc[hora].tiempoPromedio =
      ((acc[hora].tiempoPromedio as number) * ((acc[hora].cantidad as number) - 1) +
        auditoria.tiempoEjecucionMs) /
      (acc[hora].cantidad as number);

    if (auditoria.errores?.length > 0) {
      acc[hora].errores = (acc[hora].errores as number) + 1;
    }

    return acc;
  }, {});
}

/**
 * Genera estadísticas de las auditorías
 */
export function generarEstadisticasAuditoria(
  auditorias: IAuditoriaCalculo[]
): Record<string, unknown> {
  if (auditorias.length === 0) {
    return {
      total: 0,
      errores: 0,
      exitos: 0,
      tasaExito: 0,
      tiempoPromedio: 0,
      rendimiento: 'Sin datos',
    };
  }

  const conErrores = auditorias.filter((a) => a.errores && a.errores.length > 0).length;
  const exitos = auditorias.length - conErrores;
  const tiempos = auditorias.map((a) => a.tiempoEjecucionMs);

  return {
    resumen: generarResumen(auditorias.length, conErrores, exitos),
    rendimiento: generarRendimiento(tiempos),
    metodos: generarEstadisticasMetodos(auditorias),
    cache: generarEstadisticasCache(auditorias),
    patrones: generarPatrones(auditorias),
  };
}

function generarResumen(total: number, errores: number, exitos: number): Record<string, unknown> {
  return {
    total,
    errores,
    exitos,
    tasaExito: Math.round((exitos / total) * 100),
  };
}

function generarRendimiento(tiempos: number[]): Record<string, unknown> {
  const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  let categoria: string;
  if (tiempoPromedio < 50) categoria = 'Excelente';
  else if (tiempoPromedio < 100) categoria = 'Bueno';
  else if (tiempoPromedio < 200) categoria = 'Regular';
  else categoria = 'Necesita optimización';

  return {
    tiempoPromedio: Math.round(tiempoPromedio),
    tiempoMinimo: Math.min(...tiempos),
    tiempoMaximo: Math.max(...tiempos),
    categoria,
  };
}

function generarEstadisticasMetodos(auditorias: IAuditoriaCalculo[]): Record<string, unknown> {
  const metodos = auditorias.map((a) => a.resultado.metodoUtilizado);
  const frecuenciaMetodos = metodos.reduce(
    (acc: Record<string, number>, metodo: string) => {
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    frecuencia: frecuenciaMetodos,
    masUtilizado: Object.entries(frecuenciaMetodos).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0]?.[0],
  };
}

function generarEstadisticasCache(auditorias: IAuditoriaCalculo[]): Record<string, unknown> {
  const conCache = auditorias.filter((a) => a.resultado.cacheUtilizado).length;
  const tasaCache = (conCache / auditorias.length) * 100;

  return {
    utilizaciones: conCache,
    tasaUso: Math.round(tasaCache),
    ahorro: conCache > 0 ? 'Activo' : 'Sin uso',
  };
}

function generarPatrones(auditorias: IAuditoriaCalculo[]): Record<string, unknown> {
  return {
    horasPico: calcularHorasPico(auditorias),
    clientesActivos: [...new Set(auditorias.map((a) => a.contexto.clienteId.toString()))].length,
  };
}

/**
 * Calcula las horas pico de uso
 */
function calcularHorasPico(auditorias: IAuditoriaCalculo[]): number[] {
  const usosPorHora = auditorias.reduce(
    (acc: Record<number, number>, auditoria) => {
      const hora = auditoria.timestamp.getHours();
      acc[hora] = (acc[hora] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  // Encontrar las 3 horas con más actividad
  return Object.entries(usosPorHora)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([hora]) => parseInt(hora));
}
