import { Request, Response } from 'express';
import Tramo from '../../models/Tramo';
import Cliente from '../../models/Cliente';
import logger from '../../utils/logger';
import * as tarifaService from '../../services/tarifaService';
import * as formulaClienteService from '../../services/formulaClienteService';

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Interface for tarifa calculation request
 */
interface TarifaCalculationRequest {
  cliente: string;
  origen: string;
  destino: string;
  fecha: string;
  palets: number;
  tipoUnidad?: string;
  tipoTramo: string;
  metodoCalculo?: string;
  permitirTramoNoVigente?: boolean;
  tramoId?: string;
  tarifaHistoricaId?: string;
}

/**
 * Interface for tarifa calculation result
 */
interface TarifaCalculationResult {
  tarifaBase: number;
  peaje: number;
  total: number;
  detalles: {
    origen: string;
    destino: string;
    distancia?: number;
    metodoCalculo: string;
    tipo: string;
    tipoUnidad: string;
    valor: number;
    valorPeaje: number;
    vigenciaDesde?: Date;
    vigenciaHasta?: Date;
  };
  formula: string;
  tarifaHistoricaId?: string;
}

const getSiteLabel = (siteValue: unknown): string => {
  if (!siteValue) {
    return '';
  }
  if (typeof siteValue === 'string') {
    return siteValue;
  }
  if (typeof siteValue === 'object') {
    const record = siteValue as Record<string, unknown>;
    const nombre = record.nombre;
    if (typeof nombre === 'string' && nombre.trim().length > 0) {
      return nombre;
    }
    const siteName = record.Site;
    if (typeof siteName === 'string' && siteName.trim().length > 0) {
      return siteName;
    }
  }
  return String(siteValue);
};

/**
 * Calcula la tarifa para un tramo específico con lógica compleja de selección de tarifas
 * @param req Request con datos de cálculo de tarifa
 * @param res Response con resultado del cálculo
 */
/* eslint-disable max-lines-per-function, complexity, sonarjs/cognitive-complexity, max-depth, max-lines, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
const calcularTarifa = async (
  req: Request<
    Record<string, unknown>,
    ApiResponse<TarifaCalculationResult>,
    TarifaCalculationRequest
  >,
  res: Response<ApiResponse<TarifaCalculationResult>>
): Promise<void> => {
  try {
    const {
      cliente: clienteNombre,
      origen,
      destino,
      fecha,
      palets,
      tipoUnidad,
      tipoTramo,
      metodoCalculo,
      permitirTramoNoVigente,
      tramoId,
      tarifaHistoricaId,
    } = req.body;

    if (!clienteNombre || !origen || !destino || !fecha || !tipoTramo) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
      return;
    }

    let tramo: ITramo | null = null;
    const fechaConsulta = new Date(fecha);

    if (tramoId && permitirTramoNoVigente === true) {
      logger.debug(
        'Buscando tramo específico por ID:',
        tramoId,
        'con permitirTramoNoVigente:',
        permitirTramoNoVigente
      );
      tramo = await Tramo.findOne({
        _id: tramoId,
        cliente: clienteNombre,
        origen,
        destino,
      }).populate('origen destino');
    } else {
      logger.debug('Buscando tramo base para fecha:', fecha);
      tramo = await Tramo.findOne({
        cliente: clienteNombre,
        origen,
        destino,
      }).populate('origen destino');
    }

    if (!tramo) {
      res.status(404).json({
        success: false,
        message: 'No se encontró un tramo para la ruta especificada',
      });
      return;
    }

    let tarifaSeleccionada;

    if (tarifaHistoricaId && tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
      logger.debug(`Buscando tarifa histórica específica por ID: ${tarifaHistoricaId}`);
      tarifaSeleccionada = tramo.tarifasHistoricas.find(
        (t) => t._id?.toString() === tarifaHistoricaId.toString()
      );

      if (tarifaSeleccionada) {
        logger.debug(`Usando tarifa histórica específica con ID ${tarifaHistoricaId}:`, {
          tipo: tarifaSeleccionada.tipo,
          metodo: tarifaSeleccionada.metodoCalculo,
          valor: tarifaSeleccionada.valor,
          peaje: tarifaSeleccionada.valorPeaje,
          vigencia: `${new Date(tarifaSeleccionada.vigenciaDesde).toISOString()} - ${new Date(tarifaSeleccionada.vigenciaHasta).toISOString()}`,
        });
      } else {
        logger.warn(`No se encontró la tarifa histórica con ID ${tarifaHistoricaId}`);
      }
    }

    if (!tarifaSeleccionada) {
      const tarifaVigente = tramo.getTarifaVigente(fechaConsulta, tipoTramo);

      if (!tarifaVigente) {
        // Si no hay tarifa vigente, buscar la más reciente del tipo solicitado
        logger.debug(
          `No se encontró tarifa vigente de tipo ${tipoTramo}, buscando la más reciente`
        );

        if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
          const tarifasDelTipo = tramo.tarifasHistoricas.filter((t) => t.tipo === tipoTramo);

          if (tarifasDelTipo.length > 0) {
            // Ordenar por fecha de vigencia hasta (más reciente primero)
            tarifasDelTipo.sort(
              (a, b) => new Date(b.vigenciaHasta).getTime() - new Date(a.vigenciaHasta).getTime()
            );
            tarifaSeleccionada = tarifasDelTipo[0];

            logger.debug(`Usando tarifa más reciente de tipo ${tipoTramo}:`, {
              id: tarifaSeleccionada._id,
              valor: tarifaSeleccionada.valor,
              vigenciaHasta: tarifaSeleccionada.vigenciaHasta,
            });
          }
        }

        if (!tarifaSeleccionada && !permitirTramoNoVigente) {
          res.status(404).json({
            success: false,
            message: `No se encontró una tarifa vigente ni histórica de tipo ${tipoTramo} para la fecha ${fecha}`,
          });
          return;
        }
      } else {
        tarifaSeleccionada = tarifaVigente;
      }

      if (metodoCalculo && tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
        logger.debug(
          `Buscando tarifa con método de cálculo: ${metodoCalculo} y tipo: ${tipoTramo}`
        );

        const tarifaEspecifica = tramo.tarifasHistoricas.find(
          (t) =>
            t.tipo === tipoTramo &&
            t.metodoCalculo === metodoCalculo &&
            new Date(t.vigenciaDesde) <= fechaConsulta &&
            new Date(t.vigenciaHasta) >= fechaConsulta
        );

        if (!tarifaEspecifica && permitirTramoNoVigente) {
          const tarifaNoVigente = tramo.tarifasHistoricas.find(
            (t) => t.tipo === tipoTramo && t.metodoCalculo === metodoCalculo
          );

          if (tarifaNoVigente) {
            tarifaSeleccionada = tarifaNoVigente;
            logger.debug(`Usando tarifa no vigente con método: ${metodoCalculo}`);
          }
        } else if (tarifaEspecifica) {
          tarifaSeleccionada = tarifaEspecifica;
          logger.debug(`Usando tarifa vigente con método: ${metodoCalculo}`);
        }
      }
    }

    const cliente = await Cliente.findOne({ Cliente: clienteNombre });
    const numPalets = Number(palets) || 1;
    const tipoDeUnidad = tipoUnidad || 'Sider';

    const tramoConTarifa = {
      ...tramo.toObject(),
      valor: tarifaSeleccionada ? tarifaSeleccionada.valor : 0,
      valorPeaje: tarifaSeleccionada ? tarifaSeleccionada.valorPeaje : 0,
      metodoCalculo:
        metodoCalculo || (tarifaSeleccionada ? tarifaSeleccionada.metodoCalculo : 'No disponible'),
      tipo: tarifaSeleccionada ? tarifaSeleccionada.tipo : tipoTramo,
    };

    if (tarifaSeleccionada) {
      logger.debug(
        `Aplicando valores exactos de la tarifa seleccionada (ID: ${tarifaSeleccionada._id}): valor=${tarifaSeleccionada.valor}, peaje=${tarifaSeleccionada.valorPeaje}`
      );
      tramoConTarifa.valor = tarifaSeleccionada.valor;
      tramoConTarifa.valorPeaje = tarifaSeleccionada.valorPeaje;
      tramoConTarifa.metodoCalculo =
        tarifaSeleccionada.metodoCalculo || tramoConTarifa.metodoCalculo;
    }

    logger.debug(
      `Datos de cálculo: método=${tramoConTarifa.metodoCalculo}, valor=${tramoConTarifa.valor}, peaje=${tramoConTarifa.valorPeaje}`
    );

    const clienteId = cliente ? cliente._id?.toString() : null;
    if (clienteId && tramoConTarifa.metodoCalculo === 'Palet') {
      try {
        let fechaDeCalculo;

        if (tarifaSeleccionada && tarifaSeleccionada.vigenciaDesde) {
          fechaDeCalculo = new Date(tarifaSeleccionada.vigenciaDesde);
          logger.debug(`Usando fecha de vigencia de tarifa: ${fechaDeCalculo.toISOString()}`);
        } else if (fechaConsulta) {
          fechaDeCalculo = fechaConsulta;
          logger.debug(`Usando fecha de consulta: ${fechaDeCalculo.toISOString()}`);
        } else {
          fechaDeCalculo = new Date();
          logger.debug(`Usando fecha actual: ${fechaDeCalculo.toISOString()}`);
        }

        logger.debug(`Información de tarifa seleccionada:
                    ID: ${tarifaSeleccionada?._id}
                    Tipo: ${tarifaSeleccionada?.tipo}
                    Método: ${tarifaSeleccionada?.metodoCalculo}
                    Valor: ${tarifaSeleccionada?.valor}
                    Vigencia: ${new Date(tarifaSeleccionada?.vigenciaDesde || 0).toISOString()} - ${new Date(tarifaSeleccionada?.vigenciaHasta || 0).toISOString()}`);

        try {
          const formulaAplicable = clienteId
            ? await formulaClienteService.getFormulaAplicable(
                clienteId,
                tipoDeUnidad,
                fechaDeCalculo
              )
            : null;

          logger.debug(
            `Fórmula aplicable para cliente ${clienteNombre}, unidad ${tipoDeUnidad}, fecha ${fechaDeCalculo.toISOString()}: ${formulaAplicable}`
          );

          let formulaAplicableCorregida = formulaAplicable;
          if (!formulaAplicableCorregida) {
            logger.warn(
              `No se encontró una fórmula personalizada específica, usando fórmula estándar`
            );
            formulaAplicableCorregida = formulaClienteService.FORMULA_ESTANDAR;
          }

          if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
            if (tarifaSeleccionada && tarifaSeleccionada.valor) {
              tramoConTarifa.valor = tarifaSeleccionada.valor;
              logger.debug(`Actualizando valor de tarifa a: ${tramoConTarifa.valor}`);
            }
          }

          const tramoParaCalculo = {
            _id: tramo._id?.toString(),
            valor: tramoConTarifa.valor,
            valorPeaje: tramoConTarifa.valorPeaje,
            metodoCalculo: tramoConTarifa.metodoCalculo,
            distancia: tramo.distancia,
            tarifasHistoricas: tramo.tarifasHistoricas,
          };
          const resultado = tarifaService.calcularTarifaTramo(
            tramoParaCalculo,
            numPalets,
            tipoTramo,
            formulaAplicableCorregida
          );

          logger.debug(`Resultado del cálculo:
                        tarifaBase: ${resultado.tarifaBase}
                        peaje: ${resultado.peaje}
                        total: ${resultado.total}`);

          if (isNaN(resultado.total)) {
            logger.warn('El cálculo resultó en NaN, corrigiendo...');
            resultado.total = resultado.tarifaBase + resultado.peaje;
            logger.debug(`Total corregido: ${resultado.total}`);
          }

          if (resultado.total === 0) {
            logger.warn(`El cálculo con fórmula resultó en 0, intentando con método estándar`);
            const tramoEstandar = {
              _id: tramo._id?.toString(),
              valor: tramoConTarifa.valor,
              valorPeaje: tramoConTarifa.valorPeaje,
              metodoCalculo: 'Palet',
              distancia: tramo.distancia,
              tarifasHistoricas: tramo.tarifasHistoricas,
            };
            const resultadoEstandar = tarifaService.calcularTarifaTramo(
              tramoEstandar,
              numPalets,
              tipoTramo
            );

            if (resultadoEstandar.total > 0) {
              logger.debug(`Usando resultado de cálculo estándar: ${resultadoEstandar.total}`);
              resultado.tarifaBase = resultadoEstandar.tarifaBase;
              resultado.peaje = resultadoEstandar.peaje;
              resultado.total = resultadoEstandar.total;
            }
          }

          if (isNaN(resultado.total)) {
            logger.warn('El total sigue siendo NaN, usando cálculo básico');
            resultado.tarifaBase = tramoConTarifa.valor * numPalets;
            resultado.total = resultado.tarifaBase + resultado.peaje;
          }

          const resultadoFinal: TarifaCalculationResult = {
            tarifaBase: resultado.tarifaBase,
            peaje: resultado.peaje,
            total: resultado.total,
            detalles: {
              origen: getSiteLabel(tramo.origen),
              destino: getSiteLabel(tramo.destino),
              distancia: tramo.distancia,
              metodoCalculo: tramoConTarifa.metodoCalculo,
              tipo: tramoConTarifa.tipo,
              tipoUnidad: tipoDeUnidad,
              valor: tramoConTarifa.valor,
              valorPeaje: tramoConTarifa.valorPeaje,
              vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
              vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined,
            },
            formula: formulaAplicableCorregida,
            tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined,
          };

          res.json({
            success: true,
            data: resultadoFinal,
          });
          return;
        } catch (error: unknown) {
          logger.error(
            `Error al calcular tarifa con fórmula personalizada: ${error instanceof Error ? error.message : String(error)}`,
            error
          );

          if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
            if (tarifaSeleccionada && tarifaSeleccionada.valor) {
              tramoConTarifa.valor = tarifaSeleccionada.valor;
              logger.debug(`Usando valor de tarifa seleccionada: ${tramoConTarifa.valor}`);
            }
          }

          logger.debug(`Realizando cálculo estándar con método: ${tramoConTarifa.metodoCalculo}`);
          const tramoParaCalculo = {
            _id: tramo._id?.toString(),
            valor: tramoConTarifa.valor,
            valorPeaje: tramoConTarifa.valorPeaje,
            metodoCalculo: tramoConTarifa.metodoCalculo,
            distancia: tramo.distancia,
            tarifasHistoricas: tramo.tarifasHistoricas,
          };
          const resultado = tarifaService.calcularTarifaTramo(
            tramoParaCalculo,
            numPalets,
            tipoTramo
          );

          logger.debug(`Resultado del cálculo estándar:
                        tarifaBase: ${resultado.tarifaBase}
                        peaje: ${resultado.peaje}
                        total: ${resultado.total}`);

          const resultadoFinal: TarifaCalculationResult = {
            tarifaBase: resultado.tarifaBase,
            peaje: resultado.peaje,
            total: resultado.total,
            detalles: {
              origen: getSiteLabel(tramo.origen),
              destino: getSiteLabel(tramo.destino),
              distancia: tramo.distancia,
              metodoCalculo: tramoConTarifa.metodoCalculo,
              tipo: tramoConTarifa.tipo,
              tipoUnidad: tipoDeUnidad,
              valor: tramoConTarifa.valor,
              valorPeaje: tramoConTarifa.valorPeaje,
              vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
              vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined,
            },
            formula: 'Estándar',
            tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined,
          };

          res.json({
            success: true,
            data: resultadoFinal,
          });
        }
      } catch (error: unknown) {
        logger.error(
          `Error al calcular tarifa con fórmula personalizada: ${error instanceof Error ? error.message : String(error)}`,
          error
        );

        if (!tramoConTarifa.valor || tramoConTarifa.valor === 0) {
          if (tarifaSeleccionada && tarifaSeleccionada.valor) {
            tramoConTarifa.valor = tarifaSeleccionada.valor;
            logger.debug(`Usando valor de tarifa seleccionada: ${tramoConTarifa.valor}`);
          }
        }

        logger.debug(`Realizando cálculo estándar con método: ${tramoConTarifa.metodoCalculo}`);
        const tramoParaCalculo = {
          _id: tramo._id?.toString(),
          valor: tramoConTarifa.valor,
          valorPeaje: tramoConTarifa.valorPeaje,
          metodoCalculo: tramoConTarifa.metodoCalculo,
          distancia: tramo.distancia,
          tarifasHistoricas: tramo.tarifasHistoricas,
        };
        const resultado = tarifaService.calcularTarifaTramo(tramoParaCalculo, numPalets, tipoTramo);

        logger.debug(`Resultado del cálculo estándar:
                    tarifaBase: ${resultado.tarifaBase}
                    peaje: ${resultado.peaje}
                    total: ${resultado.total}`);

        const resultadoFinal: TarifaCalculationResult = {
          tarifaBase: resultado.tarifaBase,
          peaje: resultado.peaje,
          total: resultado.total,
          detalles: {
            origen: getSiteLabel(tramo.origen),
            destino: getSiteLabel(tramo.destino),
            distancia: tramo.distancia,
            metodoCalculo: tramoConTarifa.metodoCalculo,
            tipo: tramoConTarifa.tipo,
            tipoUnidad: tipoDeUnidad,
            valor: tramoConTarifa.valor,
            valorPeaje: tramoConTarifa.valorPeaje,
            vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
            vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined,
          },
          formula: 'Estándar',
          tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined,
        };

        res.json({
          success: true,
          data: resultadoFinal,
        });
      }
    }

    logger.debug(
      `Realizando cálculo estándar final con valores directos de tarifa: valor=${tramoConTarifa.valor}, peaje=${tramoConTarifa.valorPeaje}, método=${tramoConTarifa.metodoCalculo}`
    );
    const tramoParaCalculo = {
      _id: tramo._id?.toString(),
      valor: tramoConTarifa.valor,
      valorPeaje: tramoConTarifa.valorPeaje,
      metodoCalculo: tramoConTarifa.metodoCalculo,
      distancia: tramo.distancia,
      tarifasHistoricas: tramo.tarifasHistoricas,
    };
    const resultado = tarifaService.calcularTarifaTramo(tramoParaCalculo, numPalets, tipoTramo);

    const resultadoFinal: TarifaCalculationResult = {
      tarifaBase: resultado.tarifaBase,
      peaje: resultado.peaje,
      total: resultado.total,
      detalles: {
        origen: getSiteLabel(tramo.origen),
        destino: getSiteLabel(tramo.destino),
        distancia: tramo.distancia,
        metodoCalculo: tramoConTarifa.metodoCalculo,
        tipo: tramoConTarifa.tipo,
        tipoUnidad: tipoDeUnidad,
        valor: tramoConTarifa.valor,
        valorPeaje: tramoConTarifa.valorPeaje,
        vigenciaDesde: tarifaSeleccionada ? tarifaSeleccionada.vigenciaDesde : undefined,
        vigenciaHasta: tarifaSeleccionada ? tarifaSeleccionada.vigenciaHasta : undefined,
      },
      formula: 'Estándar',
      tarifaHistoricaId: tarifaSeleccionada ? tarifaSeleccionada._id?.toString() : undefined,
    };

    res.json({
      success: true,
      data: resultadoFinal,
    });
  } catch (error: unknown) {
    logger.error('Error al calcular tarifa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular la tarifa',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
/* eslint-enable max-lines-per-function, complexity, sonarjs/cognitive-complexity, max-depth, max-lines, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */

export default calcularTarifa;
