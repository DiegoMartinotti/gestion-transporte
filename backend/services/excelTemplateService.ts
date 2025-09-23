/* eslint-disable max-lines, max-lines-per-function, sonarjs/no-duplicate-string */
import ExcelJS from 'exceljs';
import { Response } from 'express';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import Empresa from '../models/Empresa';
import Cliente from '../models/Cliente';
import Site from '../models/Site';
import Personal from '../models/Personal';
import Vehiculo from '../models/Vehiculo';
import { IImportacionTemporal } from '../models/ImportacionTemporal';
import * as siteController from '../controllers/site/index';
import * as personalController from '../controllers/personal/index';
import { createVehiculosBulk } from '../controllers/vehiculo/index';
import * as tramoController from '../controllers/tramo/index';

// Constantes para evitar duplicación
const EXCEL_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const HEADER_FILL_STYLE = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFE0E0E0' },
};
const HEADER_FONT_STYLE = { bold: true };
const INSTRUCTIONS_SHEET_NAME = 'Instrucciones';
const INSTRUCTION_HEADER_FONT = { bold: true, size: 14 };
const INSTRUCTION_COLUMN_WIDTH = 60;

// Constantes para strings duplicados
const EMPRESA_EJEMPLO_NOMBRE = 'Empresa Ejemplo S.A.C.';
const CUIT_EJEMPLO = '20123456789';
const COMPLETE_CAMPOS_OBLIGATORIOS = '1. Complete todos los campos obligatorios marcados con *';
const DIRECCION_EJEMPLO = 'Av. Corrientes 1234, Buenos Aires';
const TELEFONO_EJEMPLO = '011-4567-8900';
const MAIL_EJEMPLO = 'info@transportesejemplo.com.ar';
const CONTACTO_EJEMPLO = 'Juan Pérez';
const TRANSPORTES_EJEMPLO = 'Transportes Ejemplo S.R.L.';

/**
 * Servicio para generar plantillas Excel para importación de datos
 */
export class ExcelTemplateService {
  /**
   * Genera una plantilla Excel para clientes
   */
  static async generateClienteTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      // Configurar columnas
      worksheet.columns = [
        { header: 'CUIT *', key: 'cuit', width: 15 },
        { header: 'Nombre *', key: 'nombre', width: 30 },
      ];

      // Estilo para el header
      this.applyHeaderStyle(worksheet);

      // Agregar datos de ejemplo
      worksheet.addRow({
        cuit: CUIT_EJEMPLO,
        nombre: EMPRESA_EJEMPLO_NOMBRE,
      });

      // Agregar hoja de instrucciones
      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR CLIENTES']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow(['2. CUIT: Debe tener 11 dígitos y ser válido (formato argentino)']);
      instructionsSheet.addRow(['3. Nombre: Mínimo 3 caracteres, debe ser único']);
      instructionsSheet.addRow(['4. Los campos createdAt y updatedAt se generan automáticamente']);
      instructionsSheet.addRow(['5. El campo activo se marca como true automáticamente']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'IMPORTANTE: No elimine ni modifique los encabezados de las columnas',
      ]);

      // Estilo para las instrucciones
      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getColumn(1).width = 60;

      // Configurar respuesta
      this.setExcelResponseHeaders(res, 'plantilla_clientes.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de clientes generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de clientes:', error);
      throw error;
    }
  }

  /**
   * Genera una plantilla Excel para empresas
   */
  static async generateEmpresaTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      this.createEmpresaWorksheet(workbook);
      this.createEmpresaInstructions(workbook);

      this.setExcelResponseHeaders(res, 'plantilla_empresas.xlsx');
      await workbook.xlsx.write(res);
      logger.info('Plantilla de empresas generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de empresas:', error);
      throw error;
    }
  }

  /**
   * Crea la hoja de datos de empresas
   */
  private static createEmpresaWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
    const worksheet = workbook.addWorksheet('Empresas');

    worksheet.columns = [
      { header: 'Nombre *', key: 'nombre', width: 30 },
      { header: 'Tipo *', key: 'tipo', width: 20 },
      { header: 'CUIT', key: 'cuit', width: 15 },
      { header: 'Razón Social', key: 'razonSocial', width: 35 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Mail', key: 'mail', width: 25 },
      { header: 'Contacto Principal', key: 'contactoPrincipal', width: 25 },
      { header: 'Observaciones', key: 'observaciones', width: 40 },
    ];

    this.applyHeaderStyle(worksheet);

    worksheet.addRow({
      nombre: TRANSPORTES_EJEMPLO,
      tipo: 'Subcontratada',
      cuit: '30-70123456-7',
      razonSocial: 'Transportes Ejemplo Sociedad de Responsabilidad Limitada',
      direccion: DIRECCION_EJEMPLO,
      telefono: TELEFONO_EJEMPLO,
      mail: MAIL_EJEMPLO,
      contactoPrincipal: CONTACTO_EJEMPLO,
      observaciones: 'Especializada en transporte refrigerado',
    });

    return worksheet;
  }

  /**
   * Crea las instrucciones para empresas
   */
  private static createEmpresaInstructions(workbook: ExcelJS.Workbook): void {
    const instructions = [
      'INSTRUCCIONES PARA IMPORTAR EMPRESAS',
      '',
      COMPLETE_CAMPOS_OBLIGATORIOS,
      '2. Nombre *: Mínimo 3 caracteres, debe ser único',
      '3. Tipo *: Debe ser "Propia" o "Subcontratada"',
      '4. CUIT: Formato argentino (11 dígitos, ej: 30-70123456-7)',
      '5. Razón Social: Denominación completa de la empresa',
      '6. Dirección: Dirección completa (opcional)',
      '7. Teléfono: Formato válido (opcional)',
      '8. Mail: Formato de email válido',
      '9. Contacto Principal: Nombre de la persona de contacto',
      '10. Observaciones: Información adicional sobre la empresa',
      '',
      'IMPORTANTE: El campo "activa" se marca como true automáticamente',
      'Los campos "flota" y "personal" se gestionan automáticamente por el sistema',
    ];

    this.createInstructionsSheet(workbook, instructions);
  }

  /**
   * Genera una plantilla Excel para personal
   */
  static async generatePersonalTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Personal');

      worksheet.columns = [
        { header: 'DNI *', key: 'dni', width: 12 },
        { header: 'Nombre *', key: 'nombre', width: 25 },
        { header: 'Apellido *', key: 'apellido', width: 25 },
        { header: 'CUIL', key: 'cuil', width: 15 },
        { header: 'Tipo *', key: 'tipo', width: 20 },
        { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 18 },
        { header: 'Empresa *', key: 'empresa', width: 30 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
      ];

      this.applyHeaderStyle(worksheet);

      worksheet.addRow({
        dni: '12345678',
        nombre: 'Juan Carlos',
        apellido: 'Pérez López',
        cuil: '20-12345678-9',
        tipo: 'Conductor',
        fechaNacimiento: '15/03/1985',
        empresa: 'Transportes Ejemplo S.R.L.',
        email: 'juan.perez@empresa.com',
        telefono: '987654321',
      });

      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR PERSONAL']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow(['2. DNI *: Debe tener 7-8 dígitos']);
      instructionsSheet.addRow(['3. Nombre *: Nombre completo']);
      instructionsSheet.addRow(['4. Apellido *: Apellidos completos']);
      instructionsSheet.addRow(['5. CUIL: Formato 11-11111111-1 (opcional)']);
      instructionsSheet.addRow(['6. Tipo *: Conductor/Administrativo/Mecánico/Supervisor/Otro']);
      instructionsSheet.addRow(['7. Fecha Nacimiento: Formato DD/MM/AAAA (opcional)']);
      instructionsSheet.addRow(['8. Empresa *: Nombre de la empresa (debe existir en el sistema)']);
      instructionsSheet.addRow(['9. Email: Formato de email válido (opcional)']);
      instructionsSheet.addRow(['10. Teléfono: Formato válido (opcional)']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow(['IMPORTANTE: El número de legajo se genera automáticamente']);
      instructionsSheet.addRow(['El campo "activo" se marca como true automáticamente']);

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getColumn(1).width = 60;

      // Agregar hoja con empresas disponibles
      const empresas = await Empresa.find({ activa: true }, 'nombre tipo').sort({ nombre: 1 });
      const empresasSheet = workbook.addWorksheet('Empresas Disponibles');
      empresasSheet.addRow(['Nombre', 'Tipo']);
      empresasSheet.getRow(1).font = { bold: true };
      empresasSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      empresasSheet.getColumn(1).width = 30;
      empresasSheet.getColumn(2).width = 20;

      empresas.forEach((empresa) => {
        empresasSheet.addRow([empresa.nombre, empresa.tipo]);
      });

      this.setExcelResponseHeaders(res, 'plantilla_personal.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de personal generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de personal:', error);
      throw error;
    }
  }

  /**
   * Genera una plantilla Excel para sites
   */
  static async generateSiteTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sites');

      worksheet.columns = [
        { header: 'Nombre *', key: 'nombre', width: 30 },
        { header: 'Cliente *', key: 'cliente', width: 30 },
        { header: 'Código', key: 'codigo', width: 15 },
        { header: 'Dirección', key: 'direccion', width: 40 },
        { header: 'Localidad', key: 'localidad', width: 25 },
        { header: 'Provincia', key: 'provincia', width: 20 },
        { header: 'Longitud', key: 'longitud', width: 15 },
        { header: 'Latitud', key: 'latitud', width: 15 },
      ];

      this.applyHeaderStyle(worksheet);

      worksheet.addRow({
        nombre: 'Almacén Central',
        cliente: EMPRESA_EJEMPLO_NOMBRE,
        codigo: 'ALM001',
        direccion: 'Av. Industrial 123, Buenos Aires',
        localidad: 'Capital Federal',
        provincia: 'Buenos Aires',
        longitud: -58.3816,
        latitud: -34.6037,
      });

      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR SITES']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow([
        '2. Nombre *: Nombre del sitio (debe ser único para cada cliente)',
      ]);
      instructionsSheet.addRow(['3. Cliente *: Nombre del cliente (debe existir en el sistema)']);
      instructionsSheet.addRow(['4. Código: Código identificador único por cliente (opcional)']);
      instructionsSheet.addRow(['5. Dirección: Dirección completa (opcional)']);
      instructionsSheet.addRow(['6. Localidad: Ciudad o localidad (opcional)']);
      instructionsSheet.addRow(['7. Provincia: Provincia o estado (opcional)']);
      instructionsSheet.addRow(['8. Longitud: Coordenada GPS (-180 a 180) (opcional)']);
      instructionsSheet.addRow(['9. Latitud: Coordenada GPS (-90 a 90) (opcional)']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'IMPORTANTE: Si proporciona coordenadas, debe incluir AMBAS (longitud y latitud)',
      ]);
      instructionsSheet.addRow(['Las coordenadas se almacenan en formato GeoJSON automáticamente']);

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getColumn(1).width = 60;

      // Agregar hoja con clientes disponibles
      const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
      logger.info(`Clientes encontrados para plantilla Sites: ${clientes.length}`);
      clientes.forEach((cliente) => {
        logger.info(`Cliente: ${cliente.nombre}, CUIT: ${cliente.cuit}, Activo: ${cliente.activo}`);
      });

      const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
      clientesSheet.addRow(['Nombre', 'CUIT']);
      clientesSheet.getRow(1).font = { bold: true };
      clientesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      clientesSheet.getColumn(1).width = 30;
      clientesSheet.getColumn(2).width = 15;

      clientes.forEach((cliente) => {
        clientesSheet.addRow([cliente.nombre || 'Sin nombre', cliente.cuit || 'Sin CUIT']);
      });

      this.setExcelResponseHeaders(res, 'plantilla_sites.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de sites generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de sites:', error);
      throw error;
    }
  }

  /**
   * Genera una plantilla Excel para vehículos
   */
  static async generateVehiculoTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Vehiculos');

      worksheet.columns = [
        { header: 'Dominio *', key: 'dominio', width: 12 },
        { header: 'Tipo *', key: 'tipo', width: 20 },
        { header: 'Marca', key: 'marca', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Año', key: 'año', width: 10 },
        { header: 'Número Chasis', key: 'numeroChasis', width: 18 },
        { header: 'Número Motor', key: 'numeroMotor', width: 18 },
        { header: 'Capacidad Carga', key: 'capacidadCarga', width: 15 },
        { header: 'Empresa *', key: 'empresa', width: 30 },
      ];

      this.applyHeaderStyle(worksheet);

      worksheet.addRow({
        dominio: 'ABC123',
        tipo: 'Camión',
        marca: 'Volvo',
        modelo: 'FH16',
        año: 2022,
        numeroChasis: 'VIN123456789',
        numeroMotor: 'MOT987654321',
        capacidadCarga: 25000,
        empresa: 'Transportes Ejemplo S.R.L.',
      });

      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR VEHÍCULOS']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow(['2. Dominio *: Formato patente argentina (ABC123 o AB123CD)']);
      instructionsSheet.addRow([
        '3. Tipo *: Camión/Acoplado/Semirremolque/Bitren/Furgón/Utilitario',
      ]);
      instructionsSheet.addRow(['4. Marca: Marca del vehículo (opcional)']);
      instructionsSheet.addRow(['5. Modelo: Modelo del vehículo (opcional)']);
      instructionsSheet.addRow(['6. Año: Año de fabricación (1950-2025, opcional)']);
      instructionsSheet.addRow(['7. Número Chasis: Número de chasis del vehículo (opcional)']);
      instructionsSheet.addRow(['8. Número Motor: Número de motor del vehículo (opcional)']);
      instructionsSheet.addRow(['9. Capacidad Carga: Capacidad en kilogramos (opcional)']);
      instructionsSheet.addRow(['10. Empresa *: Nombre de la empresa propietaria (debe existir)']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'IMPORTANTE: El campo "activo" se marca como true automáticamente al dar de alta',
      ]);

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getColumn(1).width = 60;

      // Agregar hoja con empresas disponibles
      const empresas = await Empresa.find({ activa: true }, 'nombre tipo').sort({ nombre: 1 });
      const empresasSheet = workbook.addWorksheet('Empresas Disponibles');
      empresasSheet.addRow(['Nombre', 'Tipo']);
      empresasSheet.getRow(1).font = { bold: true };
      empresasSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      empresasSheet.getColumn(1).width = 30;
      empresasSheet.getColumn(2).width = 20;

      empresas.forEach((empresa) => {
        empresasSheet.addRow([empresa.nombre, empresa.tipo]);
      });

      this.setExcelResponseHeaders(res, 'plantilla_vehiculos.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de vehículos generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de vehículos:', error);
      throw error;
    }
  }

  /**
   * Genera una plantilla Excel para tramos
   */
  static async generateTramoTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tramos');

      worksheet.columns = [
        { header: 'Cliente *', key: 'cliente', width: 30 },
        { header: 'Site Origen *', key: 'siteOrigen', width: 30 },
        { header: 'Site Destino *', key: 'siteDestino', width: 30 },
        { header: 'Valor', key: 'valor', width: 15 },
        { header: 'Valor Peaje', key: 'valorPeaje', width: 15 },
        { header: 'Vigencia Desde', key: 'vigenciaDesde', width: 18 },
        { header: 'Vigencia Hasta', key: 'vigenciaHasta', width: 18 },
        { header: 'Tipo', key: 'tipo', width: 15 },
        { header: 'Método Cálculo', key: 'metodoCalculo', width: 20 },
      ];

      this.applyHeaderStyle(worksheet);

      worksheet.addRow({
        cliente: EMPRESA_EJEMPLO_NOMBRE,
        siteOrigen: 'Almacén Central',
        siteDestino: 'Puerto Callao',
        valor: 150.0,
        valorPeaje: 25.0,
        vigenciaDesde: '01/01/2024',
        vigenciaHasta: '31/12/2024',
        tipo: 'TRMC',
        metodoCalculo: 'Kilometro',
      });

      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR TRAMOS']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow(['2. Cliente *: Nombre del cliente (debe existir en el sistema)']);
      instructionsSheet.addRow(['3. Site Origen *: Nombre del site de origen (debe existir)']);
      instructionsSheet.addRow(['4. Site Destino *: Nombre del site de destino (debe existir)']);
      instructionsSheet.addRow(['5. La distancia se calcula automáticamente entre los sites']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'CAMPOS DE TARIFA OPCIONALES (si completa uno, debe completar todos):',
      ]);
      instructionsSheet.addRow(['6. Valor: Precio base del tramo (número)']);
      instructionsSheet.addRow(['7. Valor Peaje: Costo de peaje (número, opcional)']);
      instructionsSheet.addRow(['8. Vigencia Desde: Fecha inicio (DD/MM/AAAA)']);
      instructionsSheet.addRow(['9. Vigencia Hasta: Fecha fin (DD/MM/AAAA)']);
      instructionsSheet.addRow(['10. Tipo: TRMC o TRMI']);
      instructionsSheet.addRow(['11. Método Cálculo: Kilometro, Palet o Fijo']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'IMPORTANTE: Si no completa los campos de tarifa, se creará el tramo sin tarifas',
      ]);
      instructionsSheet.addRow(['Los campos de tarifa son interdependientes: todos o ninguno']);

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getColumn(1).width = 70;

      // Agregar hoja con clientes disponibles
      const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
      const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
      clientesSheet.addRow(['Nombre', 'CUIT']);
      clientesSheet.getRow(1).font = { bold: true };
      clientesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      clientesSheet.getColumn(1).width = 30;
      clientesSheet.getColumn(2).width = 15;

      clientes.forEach((cliente) => {
        clientesSheet.addRow([cliente.nombre, cliente.cuit]);
      });

      // Agregar hoja con sites disponibles
      const sites = await Site.find({}, 'nombre cliente localidad provincia')
        .populate('cliente', 'nombre')
        .sort({ nombre: 1 });
      const sitesSheet = workbook.addWorksheet('Sites Disponibles');
      sitesSheet.addRow(['Nombre', 'Cliente', 'Localidad', 'Provincia']);
      sitesSheet.getRow(1).font = { bold: true };
      sitesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      sitesSheet.getColumn(1).width = 30;
      sitesSheet.getColumn(2).width = 30;
      sitesSheet.getColumn(3).width = 25;
      sitesSheet.getColumn(4).width = 20;

      sites.forEach((site) => {
        sitesSheet.addRow([
          site.nombre,
          (site.cliente as unknown)?.nombre || 'Sin cliente',
          site.localidad || '-',
          site.provincia || '-',
        ]);
      });

      this.setExcelResponseHeaders(res, 'plantilla_tramos.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de tramos generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de tramos:', error);
      throw error;
    }
  }

  /**
   * Genera una plantilla Excel para viajes
   */
  static async generateViajeTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Viajes');

      worksheet.columns = [
        { header: 'Cliente *', key: 'cliente', width: 30 },
        { header: 'Site Origen *', key: 'origen', width: 30 },
        { header: 'Site Destino *', key: 'destino', width: 30 },
        { header: 'Tipo Tramo', key: 'tipoTramo', width: 15 },
        { header: 'Fecha *', key: 'fecha', width: 15 },
        { header: 'Chofer *', key: 'chofer', width: 15 },
        { header: 'Vehículo Principal *', key: 'vehiculoPrincipal', width: 20 },
        { header: 'DT *', key: 'dt', width: 20 },
        { header: 'Paletas', key: 'paletas', width: 10 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Observaciones', key: 'observaciones', width: 40 },
      ];

      this.applyHeaderStyle(worksheet);

      worksheet.addRow({
        cliente: 'Empresa Ejemplo S.A.',
        origen: 'Depósito Central',
        destino: 'Sucursal Norte',
        tipoTramo: 'TRMC',
        fecha: '15/01/2024',
        chofer: '12345678',
        vehiculoPrincipal: 'ABC123',
        dt: 'DT001',
        paletas: 10,
        estado: 'Pendiente',
        observaciones: 'Carga frágil - manejar con cuidado',
      });

      // Agregar hoja con clientes disponibles
      const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
      const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
      clientesSheet.addRow(['Nombre', 'CUIT']);
      clientesSheet.getRow(1).font = { bold: true };
      clientesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      clientesSheet.getColumn(1).width = 30;
      clientesSheet.getColumn(2).width = 15;

      clientes.forEach((cliente) => {
        clientesSheet.addRow([cliente.nombre, cliente.cuit]);
      });

      // Agregar hoja con sites disponibles
      const sites = await Site.find({}, 'nombre cliente localidad provincia')
        .populate('cliente', 'nombre')
        .sort({ nombre: 1 });
      const sitesSheet = workbook.addWorksheet('Sites Disponibles');
      sitesSheet.addRow(['Nombre', 'Cliente', 'Localidad', 'Provincia']);
      sitesSheet.getRow(1).font = { bold: true };
      sitesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      sitesSheet.getColumn(1).width = 30;
      sitesSheet.getColumn(2).width = 30;
      sitesSheet.getColumn(3).width = 25;
      sitesSheet.getColumn(4).width = 20;

      sites.forEach((site) => {
        sitesSheet.addRow([
          site.nombre,
          (site.cliente as unknown)?.nombre || 'Sin cliente',
          site.localidad || '-',
          site.provincia || '-',
        ]);
      });

      // Agregar hoja con choferes disponibles
      const choferes = await Personal.find(
        {
          activo: true,
          tipo: 'Conductor',
        },
        'nombre apellido dni empresa'
      )
        .populate('empresa', 'nombre')
        .sort({ apellido: 1, nombre: 1 });
      const choferesSheet = workbook.addWorksheet('Choferes Disponibles');
      choferesSheet.addRow(['Nombre Completo', 'DNI', 'Empresa']);
      choferesSheet.getRow(1).font = { bold: true };
      choferesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      choferesSheet.getColumn(1).width = 35;
      choferesSheet.getColumn(2).width = 15;
      choferesSheet.getColumn(3).width = 30;

      choferes.forEach((chofer) => {
        choferesSheet.addRow([
          `${chofer.nombre} ${chofer.apellido}`,
          chofer.dni,
          (chofer.empresa as unknown)?.nombre || 'Sin empresa',
        ]);
      });

      // Agregar hoja con vehículos disponibles
      const vehiculos = await Vehiculo.find({ activo: true }, 'dominio marca modelo tipo empresa')
        .populate('empresa', 'nombre')
        .sort({ dominio: 1 });
      const vehiculosSheet = workbook.addWorksheet('Vehículos Disponibles');
      vehiculosSheet.addRow(['Dominio', 'Marca', 'Modelo', 'Tipo', 'Empresa']);
      vehiculosSheet.getRow(1).font = { bold: true };
      vehiculosSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      vehiculosSheet.getColumn(1).width = 15;
      vehiculosSheet.getColumn(2).width = 20;
      vehiculosSheet.getColumn(3).width = 20;
      vehiculosSheet.getColumn(4).width = 20;
      vehiculosSheet.getColumn(5).width = 30;

      vehiculos.forEach((vehiculo) => {
        vehiculosSheet.addRow([
          vehiculo.dominio,
          vehiculo.marca || '-',
          vehiculo.modelo || '-',
          vehiculo.tipo,
          (vehiculo.empresa as unknown)?.nombre || 'Sin empresa',
        ]);
      });

      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR VIAJES']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow([
        '2. Cliente *: Nombre del cliente (debe existir en "Clientes Disponibles")',
      ]);
      instructionsSheet.addRow([
        '3. Site Origen *: Nombre del site de origen (debe existir en "Sites Disponibles")',
      ]);
      instructionsSheet.addRow([
        '4. Site Destino *: Nombre del site de destino (debe existir en "Sites Disponibles")',
      ]);
      instructionsSheet.addRow([
        '5. Tipo Tramo: "TRMC" o "TRMI" (opcional - si no se especifica, el sistema seleccionará automáticamente el tipo con tarifa más alta)',
      ]);
      instructionsSheet.addRow(['6. Fecha *: Formato DD/MM/AAAA (ej: 15/01/2024)']);
      instructionsSheet.addRow([
        '7. Chofer *: DNI del chofer (debe existir en "Choferes Disponibles")',
      ]);
      instructionsSheet.addRow([
        '8. Vehículo Principal *: Dominio del vehículo (debe existir en "Vehículos Disponibles")',
      ]);
      instructionsSheet.addRow(['9. DT *: Código único del viaje (debe ser único por cliente)']);
      instructionsSheet.addRow(['10. Paletas: Número de paletas (opcional, por defecto 0)']);
      instructionsSheet.addRow([
        '11. Estado: Pendiente/En Curso/Completado/Cancelado (por defecto Pendiente)',
      ]);
      instructionsSheet.addRow(['12. Observaciones: Información adicional (opcional)']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow(['CAMPOS CALCULADOS AUTOMÁTICAMENTE:']);
      instructionsSheet.addRow([
        '- Tipo Tramo: Si no se especifica, se selecciona el tipo con la tarifa más alta vigente para la fecha',
      ]);
      instructionsSheet.addRow([
        '- Tipo Unidad: Se determina automáticamente según el vehículo principal',
      ]);
      instructionsSheet.addRow(['- Tarifa: Se calcula según el tramo y tarifas vigentes']);
      instructionsSheet.addRow(['- Peaje: Se obtiene de las tarifas vigentes del tramo']);
      instructionsSheet.addRow(['- Total: Suma de tarifa + extras aplicados']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'IMPORTANTE: Use las hojas de referencia para consultar los valores válidos',
      ]);

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getRow(14).font = { bold: true };
      instructionsSheet.getColumn(1).width = 80;

      this.setExcelResponseHeaders(res, 'plantilla_viajes.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de viajes generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de viajes:', error);
      throw error;
    }
  }

  /**
   * Genera una plantilla Excel para extras
   */
  static async generateExtraTemplate(res: Response): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extras');

      worksheet.columns = [
        { header: 'Tipo *', key: 'tipo', width: 30 },
        { header: 'Cliente *', key: 'cliente', width: 30 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Vigencia Desde *', key: 'vigenciaDesde', width: 18 },
        { header: 'Vigencia Hasta *', key: 'vigenciaHasta', width: 18 },
        { header: 'Valor *', key: 'valor', width: 15 },
      ];

      this.applyHeaderStyle(worksheet);

      worksheet.addRow({
        tipo: 'SEGURO_CARGA',
        cliente: 'Empresa Ejemplo S.A.',
        descripcion: 'Seguro adicional para carga valiosa',
        vigenciaDesde: '01/01/2024',
        vigenciaHasta: '31/12/2024',
        valor: 50.0,
      });

      // Agregar hoja con clientes disponibles
      const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
      const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
      clientesSheet.addRow(['Nombre', 'CUIT']);
      clientesSheet.getRow(1).font = { bold: true };
      clientesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      clientesSheet.getColumn(1).width = 30;
      clientesSheet.getColumn(2).width = 15;

      clientes.forEach((cliente) => {
        clientesSheet.addRow([cliente.nombre, cliente.cuit]);
      });

      const instructionsSheet = workbook.addWorksheet('Instrucciones');
      instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR EXTRAS']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([COMPLETE_CAMPOS_OBLIGATORIOS]);
      instructionsSheet.addRow([
        '2. Tipo *: Identificador del extra (se convierte automáticamente a MAYÚSCULAS)',
      ]);
      instructionsSheet.addRow([
        '3. Cliente *: Nombre del cliente (debe existir en "Clientes Disponibles")',
      ]);
      instructionsSheet.addRow(['4. Descripción: Descripción detallada del extra (opcional)']);
      instructionsSheet.addRow(['5. Vigencia Desde *: Fecha de inicio de vigencia (DD/MM/AAAA)']);
      instructionsSheet.addRow(['6. Vigencia Hasta *: Fecha de fin de vigencia (DD/MM/AAAA)']);
      instructionsSheet.addRow(['7. Valor *: Valor del extra (número, mínimo 0)']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow(['VALIDACIONES IMPORTANTES:']);
      instructionsSheet.addRow(['- La fecha de fin debe ser mayor o igual a la fecha de inicio']);
      instructionsSheet.addRow([
        '- No pueden existir extras del mismo tipo y cliente con fechas superpuestas',
      ]);
      instructionsSheet.addRow(['- El tipo se almacena en MAYÚSCULAS automáticamente']);
      instructionsSheet.addRow(['- El valor debe ser un número mayor o igual a 0']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'EJEMPLOS DE TIPOS: SEGURO_CARGA, COMBUSTIBLE_EXTRA, PEAJE_ADICIONAL',
      ]);
      instructionsSheet.addRow([
        'IMPORTANTE: Use la hoja "Clientes Disponibles" para consultar los clientes válidos',
      ]);

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getRow(9).font = { bold: true };
      instructionsSheet.getColumn(1).width = 80;

      this.setExcelResponseHeaders(res, 'plantilla_extras.xlsx');

      await workbook.xlsx.write(res);
      logger.info('Plantilla de extras generada exitosamente');
    } catch (error) {
      logger.error('Error al generar plantilla de extras:', error);
      throw error;
    }
  }

  /**
   * Genera un libro Excel con plantillas pre-rellenadas para corregir datos faltantes
   */
  static async generateMissingDataTemplates(
    res: Response,
    importacion: IImportacionTemporal
  ): Promise<void> {
    try {
      logger.info('Iniciando generación de plantillas de datos faltantes');
      const workbook = new ExcelJS.Workbook();
      let hasSheets = false;

      // Obtener el cliente para filtrar datos
      const cliente = await Cliente.findById(importacion.cliente).lean();
      if (!cliente) {
        logger.error('Cliente no encontrado para ID:', importacion.cliente);
        throw new Error('Cliente no encontrado');
      }

      logger.info(`Cliente encontrado: ${cliente.nombre}`);
      logger.info(`Failure details:`, importacion.failureDetails);

      // Generar hoja de Sites faltantes
      if (importacion.failureDetails.missingSites.count > 0) {
        logger.info(
          `Generando hoja de Sites faltantes: ${importacion.failureDetails.missingSites.count} sites`
        );
        await this.addMissingSitesSheet(
          workbook,
          importacion.failureDetails.missingSites.details,
          cliente.nombre
        );
        hasSheets = true;
      }

      // Generar hoja de Personal faltante
      if (importacion.failureDetails.missingPersonal.count > 0) {
        await this.addMissingPersonalSheet(
          workbook,
          importacion.failureDetails.missingPersonal.details
        );
        hasSheets = true;
      }

      // Generar hoja de Vehículos faltantes
      if (importacion.failureDetails.missingVehiculos.count > 0) {
        await this.addMissingVehiculosSheet(
          workbook,
          importacion.failureDetails.missingVehiculos.details
        );
        hasSheets = true;
      }

      // Generar hoja de Tramos faltantes
      if (importacion.failureDetails.missingTramos.count > 0) {
        await this.addMissingTramosSheet(
          workbook,
          importacion.failureDetails.missingTramos.details,
          cliente.nombre
        );
        hasSheets = true;
      }

      // Generar hoja de Viajes Fallidos (siempre incluir si hay viajes fallidos)
      if (importacion.failedTrips && importacion.failedTrips.length > 0) {
        logger.info(`Generando hoja de Viajes Fallidos: ${importacion.failedTrips.length} viajes`);
        await this.addFailedTripsSheet(workbook, importacion.failedTrips, cliente.nombre);
        hasSheets = true;
      }

      if (!hasSheets) {
        throw new Error('No hay datos faltantes para generar plantillas');
      }

      // Agregar hoja de instrucciones
      const instructionsSheet = workbook.addWorksheet('INSTRUCCIONES');
      instructionsSheet.addRow(['PLANTILLAS DE CORRECCIÓN DE DATOS']);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'Este archivo contiene plantillas pre-rellenadas con los datos que faltan en su importación.',
      ]);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow(['INSTRUCCIONES:']);
      instructionsSheet.addRow(['1. Complete TODOS los campos marcados con * en cada hoja']);
      instructionsSheet.addRow([
        '2. Use las hojas de referencia disponibles para verificar los valores válidos',
      ]);
      instructionsSheet.addRow([
        '3. Importe cada hoja por separado usando el sistema correspondiente:',
      ]);
      instructionsSheet.addRow(['   - Sites: Ir a Gestión de Sites > Importar']);
      instructionsSheet.addRow(['   - Personal: Ir a Gestión de Personal > Importar']);
      instructionsSheet.addRow(['   - Vehículos: Ir a Gestión de Vehículos > Importar']);
      instructionsSheet.addRow(['   - Tramos: Ir a Gestión de Tramos > Importar']);
      instructionsSheet.addRow([
        '4. Revise la hoja "Viajes Fallidos" para identificar errores específicos',
      ]);
      instructionsSheet.addRow([
        '5. Una vez importados todos los datos, reintente la importación de viajes',
      ]);
      instructionsSheet.addRow(['']);
      instructionsSheet.addRow([
        'IMPORTANTE: No modifique los nombres de las columnas ni elimine las hojas de referencia',
      ]);

      instructionsSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF0066CC' } };
      instructionsSheet.getRow(5).font = { bold: true, size: 12 };
      instructionsSheet.getColumn(1).width = 80;

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="datos_faltantes_${importacion._id}.xlsx"`
      );

      await workbook.xlsx.write(res);
      logger.info(`Plantillas de datos faltantes generadas para importación ${importacion._id}`);
    } catch (error) {
      logger.error('Error al generar plantillas de datos faltantes:', error);
      throw error;
    }
  }

  /**
   * Agrega hoja de Sites faltantes al workbook
   */
  private static async addMissingSitesSheet(
    workbook: ExcelJS.Workbook,
    sitesNames: string[],
    clienteName: string
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Sites Faltantes');

    worksheet.columns = [
      { header: 'Nombre *', key: 'nombre', width: 30 },
      { header: 'Cliente *', key: 'cliente', width: 30 },
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Localidad', key: 'localidad', width: 25 },
      { header: 'Provincia', key: 'provincia', width: 20 },
      { header: 'Longitud', key: 'longitud', width: 15 },
      { header: 'Latitud', key: 'latitud', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFCC' },
    };

    // Agregar los sites faltantes pre-rellenados
    sitesNames.forEach((siteName) => {
      worksheet.addRow({
        nombre: siteName,
        cliente: clienteName,
        codigo: '',
        direccion: '',
        localidad: '',
        provincia: '',
        longitud: '',
        latitud: '',
      });
    });
  }

  /**
   * Agrega hoja de Personal faltante al workbook
   */
  private static async addMissingPersonalSheet(
    workbook: ExcelJS.Workbook,
    personalDnis: string[]
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Personal Faltante');

    worksheet.columns = [
      { header: 'DNI *', key: 'dni', width: 12 },
      { header: 'Nombre *', key: 'nombre', width: 25 },
      { header: 'Apellido *', key: 'apellido', width: 25 },
      { header: 'CUIL', key: 'cuil', width: 15 },
      { header: 'Tipo *', key: 'tipo', width: 20 },
      { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 18 },
      { header: 'Empresa *', key: 'empresa', width: 30 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFCC' },
    };

    // Agregar el personal faltante pre-rellenado
    personalDnis.forEach((dni) => {
      worksheet.addRow({
        dni: dni,
        nombre: '',
        apellido: '',
        cuil: '',
        tipo: 'Conductor',
        fechaNacimiento: '',
        empresa: '',
        email: '',
        telefono: '',
      });
    });

    // Agregar hoja con empresas disponibles
    const empresas = await Empresa.find({ activa: true }, 'nombre tipo').sort({ nombre: 1 });
    const empresasSheet = workbook.addWorksheet('Empresas Disponibles (Personal)');
    empresasSheet.addRow(['Nombre', 'Tipo']);
    empresasSheet.getRow(1).font = { bold: true };
    empresasSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    empresasSheet.getColumn(1).width = 30;
    empresasSheet.getColumn(2).width = 20;

    empresas.forEach((empresa) => {
      empresasSheet.addRow([empresa.nombre, empresa.tipo]);
    });
  }

  /**
   * Agrega hoja de Vehículos faltantes al workbook
   */
  private static async addMissingVehiculosSheet(
    workbook: ExcelJS.Workbook,
    vehiculosDominios: string[]
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Vehiculos Faltantes');

    worksheet.columns = [
      { header: 'Dominio *', key: 'dominio', width: 12 },
      { header: 'Tipo *', key: 'tipo', width: 20 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Modelo', key: 'modelo', width: 20 },
      { header: 'Año', key: 'año', width: 10 },
      { header: 'Número Chasis', key: 'numeroChasis', width: 18 },
      { header: 'Número Motor', key: 'numeroMotor', width: 18 },
      { header: 'Capacidad Carga', key: 'capacidadCarga', width: 15 },
      { header: 'Empresa *', key: 'empresa', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFCC' },
    };

    // Agregar los vehículos faltantes pre-rellenados
    vehiculosDominios.forEach((dominio) => {
      worksheet.addRow({
        dominio: dominio,
        tipo: 'Camión',
        marca: '',
        modelo: '',
        año: '',
        numeroChasis: '',
        numeroMotor: '',
        capacidadCarga: '',
        empresa: '',
      });
    });

    // Agregar hoja con empresas disponibles
    const empresas = await Empresa.find({ activa: true }, 'nombre tipo').sort({ nombre: 1 });
    const empresasSheet = workbook.addWorksheet('Empresas Disponibles (Vehiculos)');
    empresasSheet.addRow(['Nombre', 'Tipo']);
    empresasSheet.getRow(1).font = { bold: true };
    empresasSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    empresasSheet.getColumn(1).width = 30;
    empresasSheet.getColumn(2).width = 20;

    empresas.forEach((empresa) => {
      empresasSheet.addRow([empresa.nombre, empresa.tipo]);
    });
  }

  /**
   * Agrega hoja de Tramos faltantes al workbook
   */
  private static async addMissingTramosSheet(
    workbook: ExcelJS.Workbook,
    tramosDetails: unknown[],
    clienteName: string
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Tramos Faltantes');

    worksheet.columns = [
      { header: 'Cliente *', key: 'cliente', width: 30 },
      { header: 'Site Origen *', key: 'siteOrigen', width: 30 },
      { header: 'Site Destino *', key: 'siteDestino', width: 30 },
      { header: 'Valor', key: 'valor', width: 15 },
      { header: 'Valor Peaje', key: 'valorPeaje', width: 15 },
      { header: 'Vigencia Desde', key: 'vigenciaDesde', width: 18 },
      { header: 'Vigencia Hasta', key: 'vigenciaHasta', width: 18 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Método Cálculo', key: 'metodoCalculo', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFCC' },
    };

    // Agregar los tramos faltantes pre-rellenados
    tramosDetails.forEach((tramo) => {
      worksheet.addRow({
        cliente: clienteName,
        siteOrigen: tramo.origen || '',
        siteDestino: tramo.destino || '',
        valor: '',
        valorPeaje: '',
        vigenciaDesde: tramo.fecha || '',
        vigenciaHasta: '',
        tipo: 'TRMC',
        metodoCalculo: 'Kilometro',
      });
    });
  }

  /**
   * Agrega hoja de Viajes Fallidos al workbook
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity, complexity, max-lines-per-function
  private static async addFailedTripsSheet(
    workbook: ExcelJS.Workbook,
    failedTrips: unknown[],
    _clienteName: string
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Viajes Fallidos');

    worksheet.columns = [
      { header: 'Fila Original', key: 'filaOriginal', width: 15 },
      { header: 'DT', key: 'dt', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Origen', key: 'origen', width: 25 },
      { header: 'Destino', key: 'destino', width: 25 },
      { header: 'Peso', key: 'peso', width: 12 },
      { header: 'Chofer', key: 'chofer', width: 20 },
      { header: 'Vehiculo', key: 'vehiculo', width: 15 },
      { header: 'Motivo del Error', key: 'motivoError', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE6E6' }, // Fondo rojo claro para errores
    };

    // Agregar los viajes fallidos con sus datos completos
    for (const trip of failedTrips) {
      const tripData = trip.data || {};

      // Determinar la categoría del error
      let categoria = 'Otro';
      if (trip.reason === 'MISSING_SITE') {
        categoria = 'Site Faltante';
      } else if (trip.message?.includes('tramo') || trip.message?.includes('tarifa')) {
        categoria = 'Tramo/Tarifa Faltante';
      } else if (trip.message?.includes('chofer') || trip.message?.includes('personal')) {
        categoria = 'Personal Faltante';
      } else if (trip.message?.includes('vehiculo')) {
        categoria = 'Vehículo Faltante';
      } else if (trip.message?.includes('duplicate') || trip.message?.includes('dt')) {
        categoria = 'DT Duplicado';
      } else if (trip.message?.includes('ObjectId') || trip.message?.includes('inválido')) {
        categoria = 'Datos Inválidos';
      }

      // Resolver IDs a nombres legibles
      let origenNombre = '';
      let destinoNombre = '';
      let choferNombre = '';
      let vehiculoNombre = '';

      try {
        // Obtener nombre del site origen
        if (tripData.origen && Types.ObjectId.isValid(tripData.origen)) {
          const origenSite = await Site.findById(tripData.origen).select('nombre').lean();
          origenNombre = origenSite?.nombre || `ID: ${tripData.origen}`;
        } else {
          origenNombre = tripData.origenNombre || tripData.origen || '';
        }

        // Obtener nombre del site destino
        if (tripData.destino && Types.ObjectId.isValid(tripData.destino)) {
          const destinoSite = await Site.findById(tripData.destino).select('nombre').lean();
          destinoNombre = destinoSite?.nombre || `ID: ${tripData.destino}`;
        } else {
          destinoNombre = tripData.destinoNombre || tripData.destino || '';
        }

        // Obtener nombre del chofer
        if (tripData.chofer && Types.ObjectId.isValid(tripData.chofer)) {
          const choferPersonal = await Personal.findById(tripData.chofer)
            .select('nombre apellido')
            .lean();
          choferNombre = choferPersonal
            ? `${choferPersonal.nombre} ${choferPersonal.apellido}`
            : `ID: ${tripData.chofer}`;
        } else {
          choferNombre = tripData.choferNombre || tripData.chofer || '';
        }

        // Obtener dominio del vehículo
        if (tripData.vehiculo && Types.ObjectId.isValid(tripData.vehiculo)) {
          const vehiculoData = await Vehiculo.findById(tripData.vehiculo).select('dominio').lean();
          vehiculoNombre = vehiculoData?.dominio || `ID: ${tripData.vehiculo}`;
        } else {
          vehiculoNombre = tripData.vehiculoPatente || tripData.vehiculo || '';
        }
      } catch (lookupError) {
        logger.warn('Error al resolver IDs en viajes fallidos:', lookupError);
        // Usar valores por defecto si hay error en los lookups
        origenNombre = tripData.origenNombre || `ID: ${tripData.origen}` || '';
        destinoNombre = tripData.destinoNombre || `ID: ${tripData.destino}` || '';
        choferNombre = tripData.choferNombre || `ID: ${tripData.chofer}` || '';
        vehiculoNombre = tripData.vehiculoPatente || `ID: ${tripData.vehiculo}` || '';
      }

      worksheet.addRow({
        filaOriginal: trip.originalIndex || '',
        dt: trip.dt || '',
        fecha: tripData.fecha ? new Date(tripData.fecha).toISOString().split('T')[0] : '',
        origen: origenNombre,
        destino: destinoNombre,
        peso: tripData.peso || '',
        chofer: choferNombre,
        vehiculo: vehiculoNombre,
        motivoError: trip.message || '',
        categoria: categoria,
      });
    }

    // Agregar filtros automáticos
    if (failedTrips.length > 0) {
      worksheet.autoFilter = {
        from: 'A1',
        to: `J${failedTrips.length + 1}`,
      };
    }
  }

  /**
   * Procesa un archivo Excel con plantillas de corrección completadas
   */
  static async processCorrectionTemplate(
    fileBuffer: Buffer,
    importacion: IImportacionTemporal
  ): Promise<unknown> {
    try {
      logger.info('Iniciando procesamiento de plantilla de corrección');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const resultados = {
        sites: { total: 0, exitosos: 0, errores: [] },
        personal: { total: 0, exitosos: 0, errores: [] },
        vehiculos: { total: 0, exitosos: 0, errores: [] },
        tramos: { total: 0, exitosos: 0, errores: [] },
      };

      // Procesar hoja de Sites Faltantes
      const sitesSheet = workbook.getWorksheet('Sites Faltantes');
      if (sitesSheet) {
        logger.info('Procesando hoja de Sites Faltantes');
        resultados.sites = await this.processSitesSheet(sitesSheet, importacion.cliente.toString());
      }

      // Procesar hoja de Personal Faltante
      const personalSheet = workbook.getWorksheet('Personal Faltante');
      if (personalSheet) {
        logger.info('Procesando hoja de Personal Faltante');
        resultados.personal = await this.processPersonalSheet(personalSheet);
      }

      // Procesar hoja de Vehiculos Faltantes
      const vehiculosSheet = workbook.getWorksheet('Vehiculos Faltantes');
      if (vehiculosSheet) {
        logger.info('Procesando hoja de Vehiculos Faltantes');
        resultados.vehiculos = await this.processVehiculosSheet(vehiculosSheet);
      }

      // Procesar hoja de Tramos Faltantes
      const tramosSheet = workbook.getWorksheet('Tramos Faltantes');
      if (tramosSheet) {
        logger.info('Procesando hoja de Tramos Faltantes');
        resultados.tramos = await this.processTramosSheet(
          tramosSheet,
          importacion.cliente.toString()
        );
      }

      logger.info('Plantilla de corrección procesada exitosamente', resultados);
      return resultados;
    } catch (error) {
      logger.error('Error al procesar plantilla de corrección:', error);
      throw error;
    }
  }

  /**
   * Procesa la hoja de Sites Faltantes
   */
  private static async processSitesSheet(
    worksheet: ExcelJS.Worksheet,
    clienteId: string
  ): Promise<unknown> {
    const sites: unknown[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const siteData = {
        site: row.getCell(1).value, // El controlador espera 'site' no 'nombre'
        cliente: clienteId,
        codigo: row.getCell(3).value,
        direccion: row.getCell(4).value,
        localidad: row.getCell(5).value,
        provincia: row.getCell(6).value,
        coordenadas:
          row.getCell(7).value && row.getCell(8).value
            ? {
                lng: parseFloat(row.getCell(7).value as string) || 0,
                lat: parseFloat(row.getCell(8).value as string) || 0,
              }
            : undefined,
      };

      if (siteData.site) {
        sites.push(siteData);
      }
    });

    if (sites.length === 0) {
      return { total: 0, exitosos: 0, errores: [] };
    }

    try {
      // Usar el controlador modular de sites para bulk import
      // siteController ya está importado al inicio del archivo
      const mockReq = { body: { sites } };

      let responseData: unknown;
      const mockRes = {
        json: (data: unknown) => {
          responseData = data;
          return data;
        },
        status: (_code: number) => ({
          json: (data: unknown) => {
            responseData = data;
            return data;
          },
        }),
      };

      await siteController.bulkCreateSites(mockReq, mockRes);

      // El controlador devuelve { success: true, mensaje: "...", resultados: { exitosos: ..., errores: [...] } }
      const resultados = responseData?.resultados || { exitosos: 0, errores: [] };

      return {
        total: sites.length,
        exitosos: resultados.exitosos || 0,
        errores: resultados.errores || [],
      };
    } catch (error: unknown) {
      logger.error('Error al importar sites:', error);
      return {
        total: sites.length,
        exitosos: 0,
        errores: [
          { site: 'Error general', error: error instanceof Error ? error.message : String(error) },
        ],
      };
    }
  }

  /**
   * Procesa la hoja de Personal Faltante
   */
  private static async processPersonalSheet(worksheet: ExcelJS.Worksheet): Promise<unknown> {
    const personal: unknown[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const personalData = {
        dni: row.getCell(1).value,
        nombre: row.getCell(2).value,
        apellido: row.getCell(3).value,
        cuil: row.getCell(4).value,
        tipo: row.getCell(5).value,
        fechaNacimiento: row.getCell(6).value,
        empresa: row.getCell(7).value,
        email: row.getCell(8).value,
        telefono: row.getCell(9).value,
      };

      if (personalData.dni && personalData.nombre && personalData.apellido) {
        personal.push(personalData);
      }
    });

    if (personal.length === 0) {
      return { total: 0, exitosos: 0, errores: [] };
    }

    try {
      // personalController ya está importado al inicio del archivo
      const mockReq = { body: { personal } };

      let responseData: unknown;
      const mockRes = {
        json: (data: unknown) => {
          responseData = data;
          return data;
        },
        status: (_code: number) => ({
          json: (data: unknown) => {
            responseData = data;
            return data;
          },
        }),
      };

      await personalController.bulkImportPersonal(mockReq, mockRes);

      // Extraer los resultados de la respuesta
      const resultados = responseData?.resultados || responseData || { exitosos: 0, errores: [] };

      return {
        total: personal.length,
        exitosos: resultados.exitosos || resultados.successful || 0,
        errores: resultados.errores || resultados.errors || [],
      };
    } catch (error: unknown) {
      logger.error('Error al importar personal:', error);
      return {
        total: personal.length,
        exitosos: 0,
        errores: [{ indice: 0, error: error instanceof Error ? error.message : String(error) }],
      };
    }
  }

  /**
   * Procesa la hoja de Vehiculos Faltantes
   */
  private static async processVehiculosSheet(worksheet: ExcelJS.Worksheet): Promise<unknown> {
    const vehiculos: unknown[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const vehiculoData = {
        dominio: row.getCell(1).value,
        tipo: row.getCell(2).value,
        marca: row.getCell(3).value,
        modelo: row.getCell(4).value,
        año: row.getCell(5).value,
        numeroChasis: row.getCell(6).value,
        numeroMotor: row.getCell(7).value,
        capacidadCarga: row.getCell(8).value,
        empresa: row.getCell(9).value,
      };

      if (vehiculoData.dominio && vehiculoData.tipo && vehiculoData.empresa) {
        vehiculos.push(vehiculoData);
      }
    });

    if (vehiculos.length === 0) {
      return { total: 0, exitosos: 0, errores: [] };
    }

    try {
      // createVehiculosBulk ya está importado al inicio del archivo
      const mockReq = { body: { vehiculos } };

      let responseData: unknown;
      const mockRes = {
        json: (data: unknown) => {
          responseData = data;
          return data;
        },
        status: (_code: number) => ({
          json: (data: unknown) => {
            responseData = data;
            return data;
          },
        }),
      };

      await createVehiculosBulk(mockReq, mockRes);

      // Extraer los resultados de la respuesta
      const resultados = responseData?.resultados || responseData || { exitosos: 0, errores: [] };

      return {
        total: vehiculos.length,
        exitosos: resultados.exitosos || resultados.successful || 0,
        errores: resultados.errores || resultados.errors || [],
      };
    } catch (error: unknown) {
      logger.error('Error al importar vehículos:', error);
      return {
        total: vehiculos.length,
        exitosos: 0,
        errores: [{ index: 0, message: error instanceof Error ? error.message : String(error) }],
      };
    }
  }

  /**
   * Procesa la hoja de Tramos Faltantes
   */
  // eslint-disable-next-line complexity, max-lines-per-function
  private static async processTramosSheet(
    worksheet: ExcelJS.Worksheet,
    clienteId: string
  ): Promise<unknown> {
    const tramos: unknown[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const tramoData = {
        cliente: clienteId,
        siteOrigen: row.getCell(2).value,
        siteDestino: row.getCell(3).value,
        valor: row.getCell(4).value,
        valorPeaje: row.getCell(5).value,
        vigenciaDesde: row.getCell(6).value,
        vigenciaHasta: row.getCell(7).value,
        tipo: row.getCell(8).value,
        metodoCalculo: row.getCell(9).value,
      };

      if (tramoData.siteOrigen && tramoData.siteDestino && tramoData.valor) {
        tramos.push(tramoData);
      }
    });

    if (tramos.length === 0) {
      return { total: 0, exitosos: 0, errores: [] };
    }

    try {
      // tramoController ya está importado al inicio del archivo
      const mockReq = {
        body: {
          cliente: clienteId,
          tramos,
          reutilizarDistancias: true,
          actualizarExistentes: false,
        },
      };

      let responseData: unknown;
      const mockRes = {
        json: (data: unknown) => {
          responseData = data;
          return data;
        },
        status: (_code: number) => ({
          json: (data: unknown) => {
            responseData = data;
            return data;
          },
        }),
      };

      await tramoController.bulkCreateTramos(mockReq, mockRes);

      // Extraer los resultados de la respuesta
      const resultados = responseData?.data?.resultados ||
        responseData?.resultados ||
        responseData || { exitosos: 0, errores: [] };

      return {
        total: tramos.length,
        exitosos: resultados.exitosos || resultados.successful || 0,
        errores: resultados.errores || resultados.errors || [],
      };
    } catch (error: unknown) {
      logger.error('Error al importar tramos:', error);
      return {
        total: tramos.length,
        exitosos: 0,
        errores: [
          { tramo: 'Error general', error: error instanceof Error ? error.message : String(error) },
        ],
      };
    }
  }

  /**
   * Aplica estilo estándar a los headers de las hojas Excel
   */
  private static applyHeaderStyle(worksheet: ExcelJS.Worksheet): void {
    worksheet.getRow(1).font = HEADER_FONT_STYLE;
    worksheet.getRow(1).fill = HEADER_FILL_STYLE;
  }

  /**
   * Configura headers de respuesta para descarga de Excel
   */
  private static setExcelResponseHeaders(res: Response, filename: string): void {
    res.setHeader('Content-Type', EXCEL_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  /**
   * Crea una hoja de instrucciones estándar
   */
  private static createInstructionsSheet(
    workbook: ExcelJS.Workbook,
    instructions: string[]
  ): ExcelJS.Worksheet {
    const instructionsSheet = workbook.addWorksheet(INSTRUCTIONS_SHEET_NAME);

    instructions.forEach((instruction, index) => {
      instructionsSheet.addRow([instruction]);
      if (index === 0) {
        instructionsSheet.getRow(index + 1).font = INSTRUCTION_HEADER_FONT;
      }
    });

    instructionsSheet.getColumn(1).width = INSTRUCTION_COLUMN_WIDTH;
    return instructionsSheet;
  }
}
