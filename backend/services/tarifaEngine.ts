/**
 * @module services/tarifaEngine
 * @description Motor avanzado para cálculo de tarifas con pipeline de procesamiento
 */

import { FormulaContext } from '../utils/formulaParser';
import logger from '../utils/logger';
import NodeCache from 'node-cache';

// Importaciones de módulos auxiliares
import { IContextoCalculo, IResultadoCalculo, IAuditoriaCalculo } from './tarifaEngine/types';
import { generarCacheKey } from './tarifaEngine/utils';
import { prepararContextoCompleto } from './tarifaEngine/contextHelpers';
import { aplicarReglas } from './tarifaEngine/reglasProcessor';
import { obtenerMetodoCalculo, obtenerFormula } from './tarifaEngine/metodoHelpers';
import {
  calcularTarifaBase,
  generarDesgloseCalculo,
  generarResultadoError,
} from './tarifaEngine/calculoHelpers';

// Cache para resultados de cálculo (TTL: 5 minutos)
const calculoCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Re-exportar tipos principales para compatibilidad
export { IContextoCalculo, IResultadoCalculo, IAuditoriaCalculo } from './tarifaEngine/types';

/**
 * Clase principal del motor de cálculo de tarifas
 */
export class TarifaEngine {
  private auditoriaActiva = true;
  private auditorias: IAuditoriaCalculo[] = [];

  /**
   * Calcula la tarifa según el contexto proporcionado
   */
  async calcular(contexto: IContextoCalculo): Promise<IResultadoCalculo> {
    const startTime = Date.now();

    try {
      // Verificar cache si está habilitado
      const cachedResult = this.verificarCache(contexto);
      if (cachedResult) {
        return cachedResult;
      }

      // Ejecutar pipeline de cálculo
      let resultado = await this.ejecutarPipelineCalculo(contexto);

      // Post-procesamiento
      resultado = this.procesarResultadoFinal(contexto, resultado, startTime);

      return resultado;
    } catch (error: unknown) {
      return this.manejarErrorCalculo(error, contexto, startTime);
    }
  }

  /**
   * Verifica y retorna resultado desde cache si está disponible
   */
  private verificarCache(contexto: IContextoCalculo): IResultadoCalculo | null {
    if (!contexto.usarCache) {
      return null;
    }

    const cacheKey = generarCacheKey(contexto);
    const cachedResult = calculoCache.get<IResultadoCalculo>(cacheKey);

    if (cachedResult) {
      logger.debug(`[TarifaEngine] Resultado obtenido de cache: ${cacheKey}`);
      cachedResult.cacheUtilizado = true;
      return cachedResult;
    }

    return null;
  }

  /**
   * Ejecuta el pipeline principal de cálculo
   */
  private async ejecutarPipelineCalculo(contexto: IContextoCalculo): Promise<IResultadoCalculo> {
    // 1. Preparar contexto completo
    const contextoCompleto = await prepararContextoCompleto(contexto);

    // 2. Obtener método de cálculo
    const metodo = await obtenerMetodoCalculo(contexto, contextoCompleto);

    // 3. Obtener fórmula aplicable
    const formula = await obtenerFormula(contexto, metodo);

    // 4. Calcular tarifa base
    let resultado = await calcularTarifaBase(contextoCompleto, formula, metodo);

    // 5. Aplicar reglas si está habilitado
    if (contexto.aplicarReglas !== false) {
      resultado = await aplicarReglas(contexto, contextoCompleto, resultado);
    }

    return resultado;
  }

  /**
   * Procesa el resultado final con desglose y cache
   */
  private procesarResultadoFinal(
    contexto: IContextoCalculo,
    resultado: IResultadoCalculo,
    startTime: number
  ): IResultadoCalculo {
    // Incluir desglose si se solicita
    if (contexto.incluirDesgloseCalculo) {
      const contextoCompleto = resultado.contextoUtilizado as FormulaContext;
      resultado.desgloseCalculo = generarDesgloseCalculo(contextoCompleto, resultado);
    }

    // Guardar en cache si está habilitado
    if (contexto.usarCache) {
      const cacheKey = generarCacheKey(contexto);
      calculoCache.set(cacheKey, resultado);
    }

    // Registrar auditoría
    if (this.auditoriaActiva) {
      this.registrarAuditoria({
        timestamp: new Date(),
        contexto,
        resultado,
        tiempoEjecucionMs: Date.now() - startTime,
      });
    }

    return resultado;
  }

  /**
   * Maneja errores durante el cálculo
   */
  private manejarErrorCalculo(
    error: unknown,
    contexto: IContextoCalculo,
    startTime: number
  ): never {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[TarifaEngine] Error en cálculo de tarifa:', errorMessage);
    logger.error('[TarifaEngine] Error en cálculo de tarifa:', error);

    // Registrar error en auditoría
    if (this.auditoriaActiva) {
      this.registrarAuditoria({
        timestamp: new Date(),
        contexto,
        resultado: generarResultadoError(errorMessage),
        tiempoEjecucionMs: Date.now() - startTime,
        errores: [errorMessage],
      });
    }

    throw error;
  }

  /**
   * Registra una auditoría de cálculo
   */
  private registrarAuditoria(auditoria: IAuditoriaCalculo): void {
    this.auditorias.push(auditoria);

    // Mantener solo las últimas 1000 auditorías en memoria
    if (this.auditorias.length > 1000) {
      this.auditorias = this.auditorias.slice(-1000);
    }

    // Log si el cálculo tardó mucho
    if (auditoria.tiempoEjecucionMs > 1000) {
      logger.warn(`[TarifaEngine] Cálculo tardó ${auditoria.tiempoEjecucionMs}ms`, {
        contexto: auditoria.contexto,
        errores: auditoria.errores,
      });
    }
  }

  /**
   * Obtiene las auditorías registradas
   */
  public obtenerAuditorias(filtros?: {
    desde?: Date;
    hasta?: Date;
    clienteId?: string;
    conErrores?: boolean;
  }): IAuditoriaCalculo[] {
    let auditorias = [...this.auditorias];

    if (filtros) {
      if (filtros.desde) {
        auditorias = auditorias.filter((a) => a.timestamp >= filtros.desde!);
      }
      if (filtros.hasta) {
        auditorias = auditorias.filter((a) => a.timestamp <= filtros.hasta!);
      }
      if (filtros.clienteId) {
        auditorias = auditorias.filter(
          (a) => a.contexto.clienteId.toString() === filtros.clienteId
        );
      }
      if (filtros.conErrores) {
        auditorias = auditorias.filter((a) => a.errores && a.errores.length > 0);
      }
    }

    return auditorias;
  }

  /**
   * Limpia la cache de cálculos
   */
  public limpiarCache(): void {
    calculoCache.flushAll();
    logger.info('[TarifaEngine] Cache limpiada');
  }

  /**
   * Obtiene estadísticas de la cache
   */
  public obtenerEstadisticasCache(): Record<string, unknown> {
    return calculoCache.getStats();
  }
}

// Exportar instancia singleton
const tarifaEngine = new TarifaEngine();

export default tarifaEngine;
