/**
 * @module services/tarifaEngine
 * @description Motor avanzado para cálculo de tarifas con pipeline de procesamiento
 */

import { Types } from 'mongoose';
import TarifaMetodo, { ITarifaMetodo } from '../models/TarifaMetodo';
import FormulasPersonalizadasCliente from '../models/FormulasPersonalizadasCliente';
import ReglaTarifa from '../models/ReglaTarifa';
import Tramo from '../models/Tramo';
import Cliente from '../models/Cliente';
import Site from '../models/Site';
import Vehiculo from '../models/Vehiculo';
import { calcularTarifaConContexto, FormulaContext, TarifaResult } from '../utils/formulaParser';
import logger from '../utils/logger';
import NodeCache from 'node-cache';

// Cache para resultados de cálculo (TTL: 5 minutos)
const calculoCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Interface para el contexto de cálculo de tarifa
 */
export interface IContextoCalculo {
  // Identificadores principales
  clienteId: Types.ObjectId | string;
  origenId: Types.ObjectId | string;
  destinoId: Types.ObjectId | string;

  // Parámetros de cálculo
  fecha: Date;
  tipoTramo: 'TRMC' | 'TRMI';
  tipoUnidad: string;
  metodoCalculo?: string;

  // Cantidades
  palets?: number;
  peso?: number;
  volumen?: number;
  cantidadBultos?: number;

  // Información adicional
  vehiculos?: Array<{ tipo: string; cantidad: number }>;
  urgencia?: 'Normal' | 'Urgente' | 'Critico';
  extras?: Array<{ id: string; cantidad: number }>;

  // Opciones de cálculo
  aplicarReglas?: boolean;
  usarCache?: boolean;
  incluirDesgloseCalculo?: boolean;
}

/**
 * Interface para el resultado detallado del cálculo
 */
export interface IResultadoCalculo extends TarifaResult {
  metodoUtilizado: string;
  formulaAplicada: string;
  reglasAplicadas?: Array<{
    codigo: string;
    nombre: string;
    modificacion: number;
  }>;
  contextoUtilizado?: Partial<FormulaContext>;
  desgloseCalculo?: Array<{
    etapa: string;
    valor: number;
    descripcion: string;
  }>;
  advertencias?: string[];
  cacheUtilizado: boolean;
}

/**
 * Interface para auditoría de cálculo
 */
interface IAuditoriaCalculo {
  timestamp: Date;
  contexto: IContextoCalculo;
  resultado: IResultadoCalculo;
  tiempoEjecucionMs: number;
  errores?: string[];
}

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
    let resultado: IResultadoCalculo;

    try {
      // Verificar cache si está habilitado
      if (contexto.usarCache) {
        const cacheKey = this.generarCacheKey(contexto);
        const cachedResult = calculoCache.get<IResultadoCalculo>(cacheKey);
        if (cachedResult) {
          logger.debug(`[TarifaEngine] Resultado obtenido de cache: ${cacheKey}`);
          cachedResult.cacheUtilizado = true;
          return cachedResult;
        }
      }

      // 1. Preparar contexto completo
      const contextoCompleto = await this.prepararContexto(contexto);

      // 2. Obtener método de cálculo
      const metodo = await this.obtenerMetodoCalculo(contexto, contextoCompleto);

      // 3. Obtener fórmula aplicable
      const formula = await this.obtenerFormula(contexto, metodo);

      // 4. Calcular tarifa base
      resultado = await this.calcularTarifaBase(contextoCompleto, formula, metodo);

      // 5. Aplicar reglas si está habilitado
      if (contexto.aplicarReglas !== false) {
        resultado = await this.aplicarReglas(contexto, contextoCompleto, resultado);
      }

      // 6. Incluir desglose si se solicita
      if (contexto.incluirDesgloseCalculo) {
        resultado.desgloseCalculo = this.generarDesgloseCalculo(contextoCompleto, resultado);
      }

      // 7. Guardar en cache si está habilitado
      if (contexto.usarCache) {
        const cacheKey = this.generarCacheKey(contexto);
        calculoCache.set(cacheKey, resultado);
      }

      // 8. Registrar auditoría
      if (this.auditoriaActiva) {
        this.registrarAuditoria({
          timestamp: new Date(),
          contexto,
          resultado,
          tiempoEjecucionMs: Date.now() - startTime,
        });
      }

      return resultado;
    } catch (error: any) {
      logger.error('[TarifaEngine] Error en cálculo de tarifa:', error);

      // Registrar error en auditoría
      if (this.auditoriaActiva) {
        this.registrarAuditoria({
          timestamp: new Date(),
          contexto,
          resultado: this.generarResultadoError(error.message),
          tiempoEjecucionMs: Date.now() - startTime,
          errores: [error.message],
        });
      }

      throw error;
    }
  }

  /**
   * Prepara el contexto completo con toda la información necesaria
   */
  private async prepararContexto(contexto: IContextoCalculo): Promise<FormulaContext> {
    logger.debug('[TarifaEngine] Preparando contexto completo');

    // Cargar datos relacionados
    const [cliente, origen, destino] = await Promise.all([
      Cliente.findById(contexto.clienteId),
      Site.findById(contexto.origenId),
      Site.findById(contexto.destinoId),
    ]);

    if (!cliente || !origen || !destino) {
      throw new Error('Datos principales no encontrados (cliente, origen o destino)');
    }

    // Obtener tramo y distancia
    const tramo = await Tramo.findOne({
      cliente: contexto.clienteId,
      origen: contexto.origenId,
      destino: contexto.destinoId,
    });

    // Preparar fecha y componentes temporales
    const fecha = contexto.fecha || new Date();
    const diaSemana = fecha.getDay();
    const mes = fecha.getMonth() + 1;
    const trimestre = Math.ceil(mes / 3);
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    const horaDelDia = fecha.getHours();

    // Construir contexto completo
    const contextoCompleto: FormulaContext = {
      // Valores básicos
      Valor: 0, // Se establecerá con la tarifa del tramo
      Peaje: 0, // Se establecerá con la tarifa del tramo
      Cantidad: contexto.palets || 0,
      Palets: contexto.palets || 0,

      // Distancia
      Distancia: tramo?.distancia || 0,
      DistanciaReal: tramo?.distancia || 0,
      DistanciaAerea: this.calcularDistanciaAerea(origen, destino),

      // Tiempo
      Fecha: fecha,
      DiaSemana: diaSemana,
      Mes: mes,
      Trimestre: trimestre,
      EsFinDeSemana: esFinDeSemana,
      EsFeriado: await this.esFeriado(fecha),
      HoraDelDia: horaDelDia,

      // Vehículo
      TipoUnidad: contexto.tipoUnidad,
      CapacidadMaxima: await this.obtenerCapacidadMaxima(contexto.tipoUnidad),
      PesoMaximo: await this.obtenerPesoMaximo(contexto.tipoUnidad),
      CantidadVehiculos: contexto.vehiculos?.reduce((sum, v) => sum + v.cantidad, 0) || 1,

      // Cliente
      TipoCliente: (cliente as any).tipo || 'Regular',
      CategoriaCliente: (cliente as any).categoria || 'Normal',
      DescuentoCliente: (cliente as any).descuento || 0,

      // Adicionales
      Peso: contexto.peso || 0,
      Volumen: contexto.volumen || 0,
      CantidadBultos: contexto.cantidadBultos || 0,
      TipoCarga: 'General', // Por defecto
      Urgencia: contexto.urgencia || 'Normal',
    };

    return contextoCompleto;
  }

  /**
   * Obtiene el método de cálculo apropiado
   */
  private async obtenerMetodoCalculo(
    contexto: IContextoCalculo,
    _contextoCompleto: FormulaContext
  ): Promise<ITarifaMetodo> {
    logger.debug('[TarifaEngine] Obteniendo método de cálculo');

    // Si se especifica un método, intentar usarlo
    if (contexto.metodoCalculo) {
      const metodo = await TarifaMetodo.findByCodigoActivo(contexto.metodoCalculo);
      if (metodo) {
        return metodo;
      }
      logger.warn(`Método ${contexto.metodoCalculo} no encontrado, buscando alternativas`);
    }

    // Buscar en el tramo
    const tramo = await Tramo.findOne({
      cliente: contexto.clienteId,
      origen: contexto.origenId,
      destino: contexto.destinoId,
    });

    if (tramo) {
      const tarifaVigente = tramo.getTarifaVigente(contexto.fecha, contexto.tipoTramo);
      if (tarifaVigente?.metodoCalculo) {
        // Buscar método por el código del tramo
        const metodo = await TarifaMetodo.findByCodigoActivo(
          tarifaVigente.metodoCalculo.toUpperCase()
        );
        if (metodo) {
          return metodo;
        }

        // Si no existe como método dinámico, crear uno temporal con los valores legacy
        return this.crearMetodoLegacy(tarifaVigente.metodoCalculo);
      }
    }

    // Método por defecto
    const metodoPorDefecto = await TarifaMetodo.findByCodigoActivo('PALET');
    if (metodoPorDefecto) {
      return metodoPorDefecto;
    }

    // Crear método legacy por defecto
    return this.crearMetodoLegacy('Palet');
  }

  /**
   * Obtiene la fórmula aplicable según el contexto
   */
  private async obtenerFormula(contexto: IContextoCalculo, metodo: ITarifaMetodo): Promise<string> {
    logger.debug('[TarifaEngine] Obteniendo fórmula aplicable');

    // Buscar fórmula personalizada del cliente
    if (metodo.permiteFormulasPersonalizadas) {
      const formulaPersonalizada = await FormulasPersonalizadasCliente.findOne({
        clienteId: contexto.clienteId,
        activa: true,
        metodoCalculo: metodo.codigo,
        vigenciaDesde: { $lte: contexto.fecha },
        $or: [{ vigenciaHasta: { $gte: contexto.fecha } }, { vigenciaHasta: { $exists: false } }],
        $and: [{ $or: [{ tipoUnidad: contexto.tipoUnidad }, { tipoUnidad: 'Todos' }] }],
      }).sort({ prioridad: -1 });

      if (formulaPersonalizada) {
        logger.info(
          `[TarifaEngine] Usando fórmula personalizada: ${formulaPersonalizada.nombre || formulaPersonalizada._id}`
        );
        await formulaPersonalizada.registrarUso(0); // Se actualizará con el monto real después
        return formulaPersonalizada.formula;
      }
    }

    // Usar fórmula base del método
    return metodo.formulaBase;
  }

  /**
   * Calcula la tarifa base usando la fórmula
   */
  private async calcularTarifaBase(
    contexto: FormulaContext,
    formula: string,
    metodo: ITarifaMetodo
  ): Promise<IResultadoCalculo> {
    logger.debug('[TarifaEngine] Calculando tarifa base con fórmula:', formula);

    // Obtener valores de tarifa del tramo si es necesario
    if (!contexto.Valor) {
      const tramo = await Tramo.findOne({
        cliente: contexto.TipoCliente,
        origen: contexto.Fecha,
        destino: contexto.DiaSemana,
      });

      if (tramo) {
        const tarifaVigente = tramo.getTarifaVigente(contexto.Fecha as Date);
        if (tarifaVigente) {
          contexto.Valor = tarifaVigente.valor;
          contexto.Peaje = tarifaVigente.valorPeaje;
        }
      }
    }

    // Calcular usando la fórmula
    const resultado = calcularTarifaConContexto(contexto, formula);

    // Construir resultado completo
    const resultadoCompleto: IResultadoCalculo = {
      ...resultado,
      metodoUtilizado: metodo.codigo,
      formulaAplicada: formula,
      contextoUtilizado: contexto,
      advertencias: [],
      cacheUtilizado: false,
    };

    // Agregar advertencias si hay valores inusuales
    if (resultado.total === 0) {
      resultadoCompleto.advertencias?.push('El cálculo resultó en un total de 0');
    }

    if (!contexto.Valor || contexto.Valor === 0) {
      resultadoCompleto.advertencias?.push('No se encontró valor de tarifa en el tramo');
    }

    return resultadoCompleto;
  }

  /**
   * Aplica las reglas de negocio al cálculo
   */
  private async aplicarReglas(
    contexto: IContextoCalculo,
    contextoCompleto: FormulaContext,
    resultado: IResultadoCalculo
  ): Promise<IResultadoCalculo> {
    logger.debug('[TarifaEngine] Aplicando reglas de negocio');

    const contextoReglas = {
      ...contextoCompleto,
      cliente: contexto.clienteId,
      metodoCalculo: resultado.metodoUtilizado,
      tarifa: resultado.tarifaBase,
      peaje: resultado.peaje,
      total: resultado.total,
    };

    const reglas = await ReglaTarifa.findReglasAplicables(contextoReglas, contexto.fecha);

    if (reglas.length === 0) {
      logger.debug('[TarifaEngine] No se encontraron reglas aplicables');
      return resultado;
    }

    logger.info(`[TarifaEngine] Aplicando ${reglas.length} reglas`);

    let valores = {
      tarifa: resultado.tarifaBase,
      peaje: resultado.peaje,
      extras: 0,
      total: resultado.total,
    };

    const reglasAplicadas: any[] = [];

    for (const regla of reglas) {
      const valoresAnteriores = { ...valores };
      valores = regla.aplicarModificadores(valores);

      const modificacion = valores.total - valoresAnteriores.total;

      reglasAplicadas.push({
        codigo: regla.codigo,
        nombre: regla.nombre,
        modificacion: Math.round(modificacion * 100) / 100,
      });

      logger.debug(`[TarifaEngine] Regla ${regla.codigo} aplicada: modificación = ${modificacion}`);

      if (regla.excluirOtrasReglas) {
        logger.debug('[TarifaEngine] Regla excluye otras, deteniendo aplicación');
        break;
      }
    }

    return {
      ...resultado,
      tarifaBase: Math.round(valores.tarifa * 100) / 100,
      peaje: Math.round(valores.peaje * 100) / 100,
      total: Math.round(valores.total * 100) / 100,
      reglasAplicadas,
    };
  }

  /**
   * Genera el desglose detallado del cálculo
   */
  private generarDesgloseCalculo(
    contexto: FormulaContext,
    resultado: IResultadoCalculo
  ): Array<{ etapa: string; valor: number; descripcion: string }> {
    const desglose = [];

    // Tarifa base
    desglose.push({
      etapa: 'Tarifa Base',
      valor: resultado.tarifaBase,
      descripcion: `Calculado con método ${resultado.metodoUtilizado}`,
    });

    // Peaje
    if (resultado.peaje > 0) {
      desglose.push({
        etapa: 'Peaje',
        valor: resultado.peaje,
        descripcion: 'Costo de peaje incluido',
      });
    }

    // Reglas aplicadas
    if (resultado.reglasAplicadas && resultado.reglasAplicadas.length > 0) {
      for (const regla of resultado.reglasAplicadas) {
        desglose.push({
          etapa: `Regla: ${regla.nombre}`,
          valor: regla.modificacion,
          descripcion: `Modificación aplicada por regla ${regla.codigo}`,
        });
      }
    }

    // Total
    desglose.push({
      etapa: 'Total Final',
      valor: resultado.total,
      descripcion: 'Suma de todos los componentes',
    });

    return desglose;
  }

  /**
   * Genera una clave de cache única para el contexto
   */
  private generarCacheKey(contexto: IContextoCalculo): string {
    const elementos = [
      contexto.clienteId.toString(),
      contexto.origenId.toString(),
      contexto.destinoId.toString(),
      contexto.fecha.toISOString().split('T')[0],
      contexto.tipoTramo,
      contexto.tipoUnidad,
      contexto.metodoCalculo || 'auto',
      contexto.palets?.toString() || '0',
      contexto.peso?.toString() || '0',
    ];

    return `tarifa:${elementos.join(':')}`;
  }

  /**
   * Crea un método legacy temporal para compatibilidad
   */
  private crearMetodoLegacy(nombre: string): ITarifaMetodo {
    const formulasLegacy: Record<string, string> = {
      Kilometro: 'Valor * Distancia + Peaje',
      Palet: 'Valor * Palets + Peaje',
      Fijo: 'Valor + Peaje',
    };

    return {
      codigo: nombre.toUpperCase(),
      nombre: nombre,
      descripcion: `Método legacy: ${nombre}`,
      formulaBase: formulasLegacy[nombre] || 'Valor * Cantidad + Peaje',
      variables: [],
      activo: true,
      prioridad: 50,
      requiereDistancia: nombre === 'Kilometro',
      requierePalets: nombre === 'Palet',
      permiteFormulasPersonalizadas: true,
      configuracion: {},
      validarFormula: () => true,
      obtenerVariablesDisponibles: () => [],
    } as any;
  }

  /**
   * Calcula la distancia aérea entre dos sites
   */
  private calcularDistanciaAerea(origen: any, destino: any): number {
    if (!origen.location?.coordinates || !destino.location?.coordinates) {
      return 0;
    }

    const [lon1, lat1] = origen.location.coordinates;
    const [lon2, lat2] = destino.location.coordinates;

    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Verifica si una fecha es feriado
   */
  private async esFeriado(_fecha: Date): Promise<boolean> {
    // TODO: Implementar verificación contra tabla de feriados
    // Por ahora retornamos false
    return false;
  }

  /**
   * Obtiene la capacidad máxima según el tipo de unidad
   */
  private async obtenerCapacidadMaxima(tipoUnidad: string): Promise<number> {
    const vehiculo = await Vehiculo.findOne({ tipo: tipoUnidad });
    return vehiculo ? (vehiculo as any).capacidadMaxima || 0 : 0;
  }

  /**
   * Obtiene el peso máximo según el tipo de unidad
   */
  private async obtenerPesoMaximo(tipoUnidad: string): Promise<number> {
    const vehiculo = await Vehiculo.findOne({ tipo: tipoUnidad });
    return vehiculo ? (vehiculo as any).pesoMaximo || 0 : 0;
  }

  /**
   * Genera un resultado de error
   */
  private generarResultadoError(mensaje: string): IResultadoCalculo {
    return {
      tarifaBase: 0,
      peaje: 0,
      total: 0,
      metodoUtilizado: 'ERROR',
      formulaAplicada: '',
      advertencias: [mensaje],
      cacheUtilizado: false,
    };
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
  public obtenerEstadisticasCache(): any {
    return calculoCache.getStats();
  }
}

// Exportar instancia singleton
const tarifaEngine = new TarifaEngine();

export default tarifaEngine;
