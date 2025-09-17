/**
 * Script de migración para el sistema de tarifas flexibles
 * Migra los datos existentes al nuevo sistema manteniendo compatibilidad
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tramo, { ITramo } from '../models/Tramo';
import Cliente from '../models/Cliente';
import TarifaMetodo, { ITarifaMetodo } from '../models/TarifaMetodo';
import FormulasPersonalizadasCliente from '../models/FormulasPersonalizadasCliente';
import ReglaTarifa from '../models/ReglaTarifa';
import logger from '../utils/logger';
import { promises as fs } from 'fs';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface MigrationStats {
  metodosCreados: number;
  formulasMigradas: number;
  reglasMigradas: number;
  errores: Array<{ tipo: string; mensaje: string; datos?: unknown }>;
  advertencias: Array<{ tipo: string; mensaje: string; datos?: unknown }>;
}

class TarifaMigrationService {
  private stats: MigrationStats = {
    metodosCreados: 0,
    formulasMigradas: 0,
    reglasMigradas: 0,
    errores: [],
    advertencias: []
  };

  private rollbackData: {
    metodos: string[];
    formulas: string[];
    reglas: string[];
  } = {
    metodos: [],
    formulas: [],
    reglas: []
  };

  /**
   * Ejecuta la migración completa
   */
  async ejecutarMigracion(opciones: {
    dryRun?: boolean;
    backup?: boolean;
    verbose?: boolean;
  } = {}): Promise<MigrationStats> {
    const { dryRun = false, backup = true, verbose = false } = opciones;

    try {
      logger.info('====================================');
      logger.info('INICIANDO MIGRACIÓN DE TARIFAS FLEXIBLES');
      logger.info(`Modo: ${dryRun ? 'SIMULACIÓN' : 'EJECUCIÓN REAL'}`);
      logger.info('====================================');

      // Conectar a la base de datos
      await this.conectarDB();

      // Crear backup si es necesario
      if (backup && !dryRun) {
        await this.crearBackup();
      }

      // Paso 1: Crear métodos de cálculo base
      logger.info('\n[PASO 1] Creando métodos de cálculo base...');
      await this.crearMetodosBase(dryRun, verbose);

      // Paso 2: Migrar fórmulas personalizadas existentes
      logger.info('\n[PASO 2] Migrando fórmulas personalizadas de clientes...');
      await this.migrarFormulasClientes(dryRun, verbose);

      // Paso 3: Crear reglas base desde configuraciones existentes
      logger.info('\n[PASO 3] Creando reglas de negocio base...');
      await this.crearReglasBase(dryRun, verbose);

      // Paso 4: Verificar integridad
      logger.info('\n[PASO 4] Verificando integridad de datos...');
      await this.verificarIntegridad(verbose);

      // Paso 5: Actualizar índices
      if (!dryRun) {
        logger.info('\n[PASO 5] Actualizando índices de base de datos...');
        await this.actualizarIndices();
      }

      // Mostrar resumen
      this.mostrarResumen();

      return this.stats;

    } catch (error: unknown) {
      logger.error('Error durante la migración:', error);
      
      if (!dryRun) {
        logger.info('Iniciando rollback...');
        await this.rollback();
      }
      
      throw error;
    } finally {
      await mongoose.disconnect();
    }
  }

  /**
   * Conecta a la base de datos
   */
  private async conectarDB(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/transporte';
    
    await mongoose.connect(mongoUri);
    logger.info('✅ Conectado a MongoDB');
  }

  /**
   * Crea un backup de las colecciones afectadas
   */
  private async crearBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, `../../backups/migration-${timestamp}`);
    
    await fs.mkdir(backupDir, { recursive: true });

    // Backup de tramos
    const tramos = await Tramo.find({}).lean();
    await fs.writeFile(
      path.join(backupDir, 'tramos.json'),
      JSON.stringify(tramos, null, 2)
    );

    // Backup de clientes
    const clientes = await Cliente.find({}).lean();
    await fs.writeFile(
      path.join(backupDir, 'clientes.json'),
      JSON.stringify(clientes, null, 2)
    );

    // Backup de fórmulas existentes
    const formulas = await FormulasPersonalizadasCliente.find({}).lean();
    await fs.writeFile(
      path.join(backupDir, 'formulas.json'),
      JSON.stringify(formulas, null, 2)
    );

    logger.info(`✅ Backup creado en: ${backupDir}`);
  }

  /**
   * Crea los métodos de cálculo base
   */
  private async crearMetodosBase(dryRun: boolean, verbose: boolean): Promise<void> {
    const metodosBase = [
      {
        codigo: 'KILOMETRO',
        nombre: 'Por Kilómetro',
        descripcion: 'Cálculo basado en la distancia recorrida',
        formulaBase: 'Valor * Distancia + Peaje',
        variables: [
          {
            nombre: 'Distancia',
            descripcion: 'Distancia del tramo en kilómetros',
            tipo: 'number',
            origen: 'tramo',
            campo: 'distancia',
            requerido: true
          }
        ],
        requiereDistancia: true,
        requierePalets: false,
        prioridad: 100
      },
      {
        codigo: 'PALET',
        nombre: 'Por Palet',
        descripcion: 'Cálculo basado en cantidad de palets',
        formulaBase: 'Valor * Palets + Peaje',
        variables: [
          {
            nombre: 'Palets',
            descripcion: 'Cantidad de palets',
            tipo: 'number',
            origen: 'viaje',
            campo: 'paletas',
            requerido: true
          }
        ],
        requiereDistancia: false,
        requierePalets: true,
        prioridad: 100
      },
      {
        codigo: 'FIJO',
        nombre: 'Tarifa Fija',
        descripcion: 'Tarifa fija independiente de variables',
        formulaBase: 'Valor + Peaje',
        variables: [],
        requiereDistancia: false,
        requierePalets: false,
        prioridad: 100
      },
      {
        codigo: 'PESO',
        nombre: 'Por Peso',
        descripcion: 'Cálculo basado en el peso de la carga',
        formulaBase: 'Valor * (Peso / 1000) + Peaje',
        variables: [
          {
            nombre: 'Peso',
            descripcion: 'Peso de la carga en kg',
            tipo: 'number',
            origen: 'viaje',
            campo: 'peso',
            requerido: true
          }
        ],
        requiereDistancia: false,
        requierePalets: false,
        prioridad: 90
      },
      {
        codigo: 'MIXTO',
        nombre: 'Mixto (Distancia + Palets)',
        descripcion: 'Combina distancia y palets',
        formulaBase: '(Valor * Distancia * 0.7) + (Valor * Palets * 0.3) + Peaje',
        variables: [
          {
            nombre: 'Distancia',
            descripcion: 'Distancia del tramo',
            tipo: 'number',
            origen: 'tramo',
            campo: 'distancia',
            requerido: true
          },
          {
            nombre: 'Palets',
            descripcion: 'Cantidad de palets',
            tipo: 'number',
            origen: 'viaje',
            campo: 'paletas',
            requerido: true
          }
        ],
        requiereDistancia: true,
        requierePalets: true,
        prioridad: 80
      }
    ];

    for (const metodoData of metodosBase) {
      try {
        if (!dryRun) {
          const existente = await TarifaMetodo.findOne({ codigo: metodoData.codigo });
          
          if (!existente) {
            const metodo = new TarifaMetodo(metodoData);
            await metodo.save();
            this.rollbackData.metodos.push(metodo._id.toString());
            this.stats.metodosCreados++;
            
            if (verbose) {
              logger.info(`  ✅ Método creado: ${metodoData.codigo}`);
            }
          } else {
            if (verbose) {
              logger.info(`  ⏭️  Método ya existe: ${metodoData.codigo}`);
            }
          }
        } else {
          this.stats.metodosCreados++;
          if (verbose) {
            logger.info(`  [SIMULACIÓN] Método a crear: ${metodoData.codigo}`);
          }
        }
      } catch (error: unknown) {
        this.stats.errores.push({
          tipo: 'METODO',
          mensaje: `Error creando método ${metodoData.codigo}`,
          datos: (error instanceof Error ? error.message : String(error))
        });
      }
    }

    logger.info(`  Total métodos creados: ${this.stats.metodosCreados}`);
  }

  /**
   * Migra las fórmulas personalizadas existentes
   */
  private async migrarFormulasClientes(dryRun: boolean, verbose: boolean): Promise<void> {
    try {
      // Obtener todos los clientes con fórmulas personalizadas
      const clientes = await Cliente.find({
        $or: [
          { formulaPaletSider: { $exists: true, $ne: null } },
          { formulaPaletBitren: { $exists: true, $ne: null } }
        ]
      });

      for (const cliente of clientes) {
        // Migrar fórmula Sider
        if ((cliente as unknown).formulaPaletSider) {
          await this.migrarFormula(
            cliente._id,
            'Sider',
            (cliente as unknown).formulaPaletSider,
            dryRun,
            verbose
          );
        }

        // Migrar fórmula Bitren
        if ((cliente as unknown).formulaPaletBitren) {
          await this.migrarFormula(
            cliente._id,
            'Bitren',
            (cliente as unknown).formulaPaletBitren,
            dryRun,
            verbose
          );
        }
      }

      // Migrar fórmulas de la colección FormulasPersonalizadasCliente existentes
      const formulasExistentes = await FormulasPersonalizadasCliente.find({
        metodoCalculo: { $exists: false }
      });

      for (const formula of formulasExistentes) {
        if (!dryRun) {
          formula.metodoCalculo = 'PALET'; // Por defecto las antiguas son PALET
          formula.activa = true;
          formula.prioridad = 100;
          await formula.save();
          this.stats.formulasMigradas++;
          
          if (verbose) {
            logger.info(`  ✅ Fórmula actualizada: ${formula._id}`);
          }
        } else {
          this.stats.formulasMigradas++;
          if (verbose) {
            logger.info(`  [SIMULACIÓN] Fórmula a actualizar: ${formula._id}`);
          }
        }
      }

      logger.info(`  Total fórmulas migradas: ${this.stats.formulasMigradas}`);

    } catch (error: unknown) {
      this.stats.errores.push({
        tipo: 'FORMULA',
        mensaje: 'Error migrando fórmulas',
        datos: (error instanceof Error ? error.message : String(error))
      });
    }
  }

  /**
   * Migra una fórmula individual
   */
  private async migrarFormula(
    clienteId: mongoose.Types.ObjectId,
    tipoUnidad: string,
    formula: string,
    dryRun: boolean,
    verbose: boolean
  ): Promise<void> {
    try {
      if (!dryRun) {
        // Verificar si ya existe
        const existente = await FormulasPersonalizadasCliente.findOne({
          clienteId,
          tipoUnidad,
          metodoCalculo: 'PALET',
          formula
        });

        if (!existente) {
          const nuevaFormula = new FormulasPersonalizadasCliente({
            clienteId,
            tipoUnidad,
            metodoCalculo: 'PALET',
            formula,
            nombre: `Fórmula ${tipoUnidad} Migrada`,
            descripcion: 'Fórmula migrada del sistema anterior',
            prioridad: 100,
            vigenciaDesde: new Date('2020-01-01'),
            activa: true,
            estadisticas: {
              vecesUtilizada: 0,
              montoTotalCalculado: 0
            }
          });

          await nuevaFormula.save();
          this.rollbackData.formulas.push(nuevaFormula._id.toString());
          this.stats.formulasMigradas++;

          if (verbose) {
            logger.info(`  ✅ Fórmula migrada: Cliente ${clienteId} - ${tipoUnidad}`);
          }
        }
      } else {
        this.stats.formulasMigradas++;
        if (verbose) {
          logger.info(`  [SIMULACIÓN] Fórmula a migrar: Cliente ${clienteId} - ${tipoUnidad}`);
        }
      }
    } catch (error: unknown) {
      this.stats.advertencias.push({
        tipo: 'FORMULA',
        mensaje: `Error migrando fórmula para cliente ${clienteId}`,
        datos: (error instanceof Error ? error.message : String(error))
      });
    }
  }

  /**
   * Crea reglas de negocio base
   */
  private async crearReglasBase(dryRun: boolean, verbose: boolean): Promise<void> {
    const reglasBase = [
      {
        codigo: 'DESC_VOLUMEN',
        nombre: 'Descuento por Volumen',
        descripcion: 'Descuento aplicado cuando se superan 20 palets',
        condiciones: [
          {
            campo: 'Palets',
            operador: 'mayor',
            valor: 20
          }
        ],
        modificadores: [
          {
            tipo: 'porcentaje',
            valor: -5,
            aplicarA: 'tarifa',
            descripcion: '5% de descuento'
          }
        ],
        prioridad: 100,
        fechaInicioVigencia: new Date(),
        activa: false // Desactivada por defecto para no afectar cálculos actuales
      },
      {
        codigo: 'RECARGO_URGENTE',
        nombre: 'Recargo por Urgencia',
        descripcion: 'Recargo aplicado a envíos urgentes',
        condiciones: [
          {
            campo: 'Urgencia',
            operador: 'igual',
            valor: 'Urgente'
          }
        ],
        modificadores: [
          {
            tipo: 'porcentaje',
            valor: 15,
            aplicarA: 'total',
            descripcion: '15% de recargo'
          }
        ],
        prioridad: 90,
        fechaInicioVigencia: new Date(),
        activa: false
      },
      {
        codigo: 'DESC_FIN_SEMANA',
        nombre: 'Descuento Fin de Semana',
        descripcion: 'Descuento para viajes en fin de semana',
        diasSemana: [0, 6], // Domingo y Sábado
        modificadores: [
          {
            tipo: 'porcentaje',
            valor: -10,
            aplicarA: 'tarifa',
            descripcion: '10% de descuento'
          }
        ],
        prioridad: 80,
        fechaInicioVigencia: new Date(),
        activa: false
      }
    ];

    for (const reglaData of reglasBase) {
      try {
        if (!dryRun) {
          const existente = await ReglaTarifa.findOne({ codigo: reglaData.codigo });
          
          if (!existente) {
            const regla = new ReglaTarifa(reglaData);
            await regla.save();
            this.rollbackData.reglas.push(regla._id.toString());
            this.stats.reglasMigradas++;
            
            if (verbose) {
              logger.info(`  ✅ Regla creada: ${reglaData.codigo} (INACTIVA)`);
            }
          } else {
            if (verbose) {
              logger.info(`  ⏭️  Regla ya existe: ${reglaData.codigo}`);
            }
          }
        } else {
          this.stats.reglasMigradas++;
          if (verbose) {
            logger.info(`  [SIMULACIÓN] Regla a crear: ${reglaData.codigo}`);
          }
        }
      } catch (error: unknown) {
        this.stats.errores.push({
          tipo: 'REGLA',
          mensaje: `Error creando regla ${reglaData.codigo}`,
          datos: (error instanceof Error ? error.message : String(error))
        });
      }
    }

    logger.info(`  Total reglas creadas: ${this.stats.reglasMigradas}`);
  }

  /**
   * Verifica la integridad de los datos migrados
   */
  private async verificarIntegridad(verbose: boolean): Promise<void> {
    const verificaciones = {
      metodos: 0,
      formulas: 0,
      reglas: 0,
      tramosCompatibles: 0
    };

    // Verificar métodos
    verificaciones.metodos = await TarifaMetodo.countDocuments({ activo: true });
    
    // Verificar fórmulas
    verificaciones.formulas = await FormulasPersonalizadasCliente.countDocuments({ 
      metodoCalculo: { $exists: true } 
    });
    
    // Verificar reglas
    verificaciones.reglas = await ReglaTarifa.countDocuments({});
    
    // Verificar compatibilidad con tramos existentes
    const tramosConTarifas = await Tramo.countDocuments({
      'tarifasHistoricas.0': { $exists: true }
    });
    
    const metodosLegacy = ['Kilometro', 'Palet', 'Fijo'];
    const tramosCompatibles = await Tramo.countDocuments({
      'tarifasHistoricas.metodoCalculo': { $in: metodosLegacy }
    });
    
    verificaciones.tramosCompatibles = tramosCompatibles;

    if (verbose) {
      logger.info('  Verificaciones de integridad:');
      logger.info(`    - Métodos activos: ${verificaciones.metodos}`);
      logger.info(`    - Fórmulas con método: ${verificaciones.formulas}`);
      logger.info(`    - Reglas creadas: ${verificaciones.reglas}`);
      logger.info(`    - Tramos compatibles: ${verificaciones.tramosCompatibles}/${tramosConTarifas}`);
    }

    // Advertencias
    if (verificaciones.metodos < 3) {
      this.stats.advertencias.push({
        tipo: 'INTEGRIDAD',
        mensaje: 'Menos de 3 métodos base encontrados'
      });
    }

    if (tramosCompatibles < tramosConTarifas) {
      this.stats.advertencias.push({
        tipo: 'COMPATIBILIDAD',
        mensaje: `${tramosConTarifas - tramosCompatibles} tramos pueden requerir actualización manual`
      });
    }
  }

  /**
   * Actualiza los índices de la base de datos
   */
  private async actualizarIndices(): Promise<void> {
    try {
      // Índices para TarifaMetodo
      await TarifaMetodo.collection.createIndex({ codigo: 1, activo: 1 });
      await TarifaMetodo.collection.createIndex({ prioridad: -1, activo: 1 });
      
      // Índices para ReglaTarifa
      await ReglaTarifa.collection.createIndex({ cliente: 1, activa: 1, prioridad: -1 });
      await ReglaTarifa.collection.createIndex({ fechaInicioVigencia: 1, fechaFinVigencia: 1 });
      
      // Índices para FormulasPersonalizadasCliente
      await FormulasPersonalizadasCliente.collection.createIndex({ 
        clienteId: 1, 
        tipoUnidad: 1, 
        metodoCalculo: 1, 
        vigenciaDesde: 1 
      });
      
      logger.info('  ✅ Índices actualizados correctamente');
    } catch (error: unknown) {
      this.stats.advertencias.push({
        tipo: 'INDICES',
        mensaje: 'Error actualizando índices',
        datos: (error instanceof Error ? error.message : String(error))
      });
    }
  }

  /**
   * Realiza rollback de los cambios
   */
  private async rollback(): Promise<void> {
    try {
      // Eliminar métodos creados
      if (this.rollbackData.metodos.length > 0) {
        await TarifaMetodo.deleteMany({ _id: { $in: this.rollbackData.metodos } });
        logger.info(`  Eliminados ${this.rollbackData.metodos.length} métodos`);
      }

      // Eliminar fórmulas creadas
      if (this.rollbackData.formulas.length > 0) {
        await FormulasPersonalizadasCliente.deleteMany({ 
          _id: { $in: this.rollbackData.formulas } 
        });
        logger.info(`  Eliminadas ${this.rollbackData.formulas.length} fórmulas`);
      }

      // Eliminar reglas creadas
      if (this.rollbackData.reglas.length > 0) {
        await ReglaTarifa.deleteMany({ _id: { $in: this.rollbackData.reglas } });
        logger.info(`  Eliminadas ${this.rollbackData.reglas.length} reglas`);
      }

      logger.info('✅ Rollback completado');
    } catch (error: unknown) {
      logger.error('Error durante rollback:', error);
    }
  }

  /**
   * Muestra el resumen de la migración
   */
  private mostrarResumen(): void {
    logger.info('\n====================================');
    logger.info('RESUMEN DE MIGRACIÓN');
    logger.info('====================================');
    logger.info(`✅ Métodos creados: ${this.stats.metodosCreados}`);
    logger.info(`✅ Fórmulas migradas: ${this.stats.formulasMigradas}`);
    logger.info(`✅ Reglas creadas: ${this.stats.reglasMigradas}`);
    
    if (this.stats.advertencias.length > 0) {
      logger.warn(`\n⚠️  Advertencias (${this.stats.advertencias.length}):`);
      this.stats.advertencias.forEach(adv => {
        logger.warn(`  - [${adv.tipo}] ${adv.mensaje}`);
      });
    }
    
    if (this.stats.errores.length > 0) {
      logger.error(`\n❌ Errores (${this.stats.errores.length}):`);
      this.stats.errores.forEach(err => {
        logger.error(`  - [${err.tipo}] ${err.mensaje}`);
      });
    }
    
    logger.info('\n====================================');
    logger.info('MIGRACIÓN COMPLETADA');
    logger.info('====================================');
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const opciones = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npm run migrate:tarifas [opciones]

Opciones:
  --dry-run       Simula la migración sin hacer cambios
  --no-backup     No crear backup antes de migrar
  --verbose, -v   Mostrar información detallada
  --help, -h      Mostrar esta ayuda

Ejemplos:
  npm run migrate:tarifas                    # Migración completa con backup
  npm run migrate:tarifas --dry-run          # Simular migración
  npm run migrate:tarifas --verbose          # Migración con detalles
    `);
    process.exit(0);
  }

  const service = new TarifaMigrationService();
  
  service.ejecutarMigracion(opciones)
    .then(stats => {
      process.exit(stats.errores.length > 0 ? 1 : 0);
    })
    .catch(error => {
      logger.error('Error fatal:', error);
      process.exit(1);
    });
}

export default TarifaMigrationService;