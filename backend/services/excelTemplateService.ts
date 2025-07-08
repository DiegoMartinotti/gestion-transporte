import ExcelJS from 'exceljs';
import { Response } from 'express';
import logger from '../utils/logger';
import Empresa from '../models/Empresa';
import Cliente from '../models/Cliente';
import Site from '../models/Site';
import Personal from '../models/Personal';
import Vehiculo from '../models/Vehiculo';

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
                { header: 'Nombre *', key: 'nombre', width: 30 }
            ];
            
            // Estilo para el header
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            // Agregar datos de ejemplo
            worksheet.addRow({
                cuit: '20123456789',
                nombre: 'Empresa Ejemplo S.A.C.'
            });
            
            // Agregar hoja de instrucciones
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR CLIENTES']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. CUIT: Debe tener 11 dígitos y ser válido (formato argentino)']);
            instructionsSheet.addRow(['3. Nombre: Mínimo 3 caracteres, debe ser único']);
            instructionsSheet.addRow(['4. Los campos createdAt y updatedAt se generan automáticamente']);
            instructionsSheet.addRow(['5. El campo activo se marca como true automáticamente']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['IMPORTANTE: No elimine ni modifique los encabezados de las columnas']);
            
            // Estilo para las instrucciones
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
            // Configurar respuesta
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_clientes.xlsx"'
            );
            
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
                { header: 'Observaciones', key: 'observaciones', width: 40 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                nombre: 'Transportes Ejemplo S.R.L.',
                tipo: 'Subcontratada',
                cuit: '30-70123456-7',
                razonSocial: 'Transportes Ejemplo Sociedad de Responsabilidad Limitada',
                direccion: 'Av. Corrientes 1234, Buenos Aires',
                telefono: '011-4567-8900',
                mail: 'info@transportesejemplo.com.ar',
                contactoPrincipal: 'Juan Pérez',
                observaciones: 'Especializada en transporte refrigerado'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR EMPRESAS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. Nombre *: Mínimo 3 caracteres, debe ser único']);
            instructionsSheet.addRow(['3. Tipo *: Debe ser "Propia" o "Subcontratada"']);
            instructionsSheet.addRow(['4. CUIT: Formato argentino (11 dígitos, ej: 30-70123456-7)']);
            instructionsSheet.addRow(['5. Razón Social: Denominación completa de la empresa']);
            instructionsSheet.addRow(['6. Dirección: Dirección completa (opcional)']);
            instructionsSheet.addRow(['7. Teléfono: Formato válido (opcional)']);
            instructionsSheet.addRow(['8. Mail: Formato de email válido']);
            instructionsSheet.addRow(['9. Contacto Principal: Nombre de la persona de contacto']);
            instructionsSheet.addRow(['10. Observaciones: Información adicional sobre la empresa']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['IMPORTANTE: El campo "activa" se marca como true automáticamente']);
            instructionsSheet.addRow(['Los campos "flota" y "personal" se gestionan automáticamente por el sistema']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_empresas.xlsx"'
            );
            
            await workbook.xlsx.write(res);
            logger.info('Plantilla de empresas generada exitosamente');
            
        } catch (error) {
            logger.error('Error al generar plantilla de empresas:', error);
            throw error;
        }
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
                { header: 'Teléfono', key: 'telefono', width: 15 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                dni: '12345678',
                nombre: 'Juan Carlos',
                apellido: 'Pérez López',
                cuil: '20-12345678-9',
                tipo: 'Conductor',
                fechaNacimiento: '15/03/1985',
                empresa: 'Transportes Ejemplo S.R.L.',
                email: 'juan.perez@empresa.com',
                telefono: '987654321'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR PERSONAL']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
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
                fgColor: { argb: 'FFE0E0E0' }
            };
            empresasSheet.getColumn(1).width = 30;
            empresasSheet.getColumn(2).width = 20;
            
            empresas.forEach(empresa => {
                empresasSheet.addRow([empresa.nombre, empresa.tipo]);
            });
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_personal.xlsx"'
            );
            
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
                { header: 'Latitud', key: 'latitud', width: 15 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                nombre: 'Almacén Central',
                cliente: 'Empresa Ejemplo S.A.C.',
                codigo: 'ALM001',
                direccion: 'Av. Industrial 123, Buenos Aires',
                localidad: 'Capital Federal',
                provincia: 'Buenos Aires',
                longitud: -58.3816,
                latitud: -34.6037
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR SITES']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. Nombre *: Nombre del sitio (debe ser único para cada cliente)']);
            instructionsSheet.addRow(['3. Cliente *: Nombre del cliente (debe existir en el sistema)']);
            instructionsSheet.addRow(['4. Código: Código identificador único por cliente (opcional)']);
            instructionsSheet.addRow(['5. Dirección: Dirección completa (opcional)']);
            instructionsSheet.addRow(['6. Localidad: Ciudad o localidad (opcional)']);
            instructionsSheet.addRow(['7. Provincia: Provincia o estado (opcional)']);
            instructionsSheet.addRow(['8. Longitud: Coordenada GPS (-180 a 180) (opcional)']);
            instructionsSheet.addRow(['9. Latitud: Coordenada GPS (-90 a 90) (opcional)']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['IMPORTANTE: Si proporciona coordenadas, debe incluir AMBAS (longitud y latitud)']);
            instructionsSheet.addRow(['Las coordenadas se almacenan en formato GeoJSON automáticamente']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
            // Agregar hoja con clientes disponibles
            const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
            logger.info(`Clientes encontrados para plantilla Sites: ${clientes.length}`);
            clientes.forEach(cliente => {
                logger.info(`Cliente: ${cliente.nombre}, CUIT: ${cliente.cuit}, Activo: ${cliente.activo}`);
            });
            
            const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
            clientesSheet.addRow(['Nombre', 'CUIT']);
            clientesSheet.getRow(1).font = { bold: true };
            clientesSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            clientesSheet.getColumn(1).width = 30;
            clientesSheet.getColumn(2).width = 15;
            
            clientes.forEach(cliente => {
                clientesSheet.addRow([cliente.nombre || 'Sin nombre', cliente.cuit || 'Sin CUIT']);
            });
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_sites.xlsx"'
            );
            
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
                { header: 'Empresa *', key: 'empresa', width: 30 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                dominio: 'ABC123',
                tipo: 'Camión',
                marca: 'Volvo',
                modelo: 'FH16',
                año: 2022,
                numeroChasis: 'VIN123456789',
                numeroMotor: 'MOT987654321',
                capacidadCarga: 25000,
                empresa: 'Transportes Ejemplo S.R.L.'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR VEHÍCULOS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. Dominio *: Formato patente argentina (ABC123 o AB123CD)']);
            instructionsSheet.addRow(['3. Tipo *: Camión/Acoplado/Semirremolque/Bitren/Furgón/Utilitario']);
            instructionsSheet.addRow(['4. Marca: Marca del vehículo (opcional)']);
            instructionsSheet.addRow(['5. Modelo: Modelo del vehículo (opcional)']);
            instructionsSheet.addRow(['6. Año: Año de fabricación (1950-2025, opcional)']);
            instructionsSheet.addRow(['7. Número Chasis: Número de chasis del vehículo (opcional)']);
            instructionsSheet.addRow(['8. Número Motor: Número de motor del vehículo (opcional)']);
            instructionsSheet.addRow(['9. Capacidad Carga: Capacidad en kilogramos (opcional)']);
            instructionsSheet.addRow(['10. Empresa *: Nombre de la empresa propietaria (debe existir)']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['IMPORTANTE: El campo "activo" se marca como true automáticamente al dar de alta']);
            
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
                fgColor: { argb: 'FFE0E0E0' }
            };
            empresasSheet.getColumn(1).width = 30;
            empresasSheet.getColumn(2).width = 20;
            
            empresas.forEach(empresa => {
                empresasSheet.addRow([empresa.nombre, empresa.tipo]);
            });
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_vehiculos.xlsx"'
            );
            
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
                { header: 'Método Cálculo', key: 'metodoCalculo', width: 20 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                cliente: 'Empresa Ejemplo S.A.C.',
                siteOrigen: 'Almacén Central',
                siteDestino: 'Puerto Callao',
                valor: 150.00,
                valorPeaje: 25.00,
                vigenciaDesde: '01/01/2024',
                vigenciaHasta: '31/12/2024',
                tipo: 'TRMC',
                metodoCalculo: 'Kilometro'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR TRAMOS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. Cliente *: Nombre del cliente (debe existir en el sistema)']);
            instructionsSheet.addRow(['3. Site Origen *: Nombre del site de origen (debe existir)']);
            instructionsSheet.addRow(['4. Site Destino *: Nombre del site de destino (debe existir)']);
            instructionsSheet.addRow(['5. La distancia se calcula automáticamente entre los sites']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['CAMPOS DE TARIFA OPCIONALES (si completa uno, debe completar todos):']);
            instructionsSheet.addRow(['6. Valor: Precio base del tramo (número)']);
            instructionsSheet.addRow(['7. Valor Peaje: Costo de peaje (número, opcional)']);
            instructionsSheet.addRow(['8. Vigencia Desde: Fecha inicio (DD/MM/AAAA)']);
            instructionsSheet.addRow(['9. Vigencia Hasta: Fecha fin (DD/MM/AAAA)']);
            instructionsSheet.addRow(['10. Tipo: TRMC o TRMI']);
            instructionsSheet.addRow(['11. Método Cálculo: Kilometro, Palet o Fijo']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['IMPORTANTE: Si no completa los campos de tarifa, se creará el tramo sin tarifas']);
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
                fgColor: { argb: 'FFE0E0E0' }
            };
            clientesSheet.getColumn(1).width = 30;
            clientesSheet.getColumn(2).width = 15;
            
            clientes.forEach(cliente => {
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
                fgColor: { argb: 'FFE0E0E0' }
            };
            sitesSheet.getColumn(1).width = 30;
            sitesSheet.getColumn(2).width = 30;
            sitesSheet.getColumn(3).width = 25;
            sitesSheet.getColumn(4).width = 20;
            
            sites.forEach(site => {
                sitesSheet.addRow([
                    site.nombre,
                    (site.cliente as any)?.nombre || 'Sin cliente',
                    site.localidad || '-',
                    site.provincia || '-'
                ]);
            });
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_tramos.xlsx"'
            );
            
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
                { header: 'Tipo Tramo *', key: 'tipoTramo', width: 15 },
                { header: 'Fecha *', key: 'fecha', width: 15 },
                { header: 'Chofer *', key: 'chofer', width: 15 },
                { header: 'Vehículo Principal *', key: 'vehiculoPrincipal', width: 20 },
                { header: 'DT *', key: 'dt', width: 20 },
                { header: 'Paletas', key: 'paletas', width: 10 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Observaciones', key: 'observaciones', width: 40 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
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
                observaciones: 'Carga frágil - manejar con cuidado'
            });
            
            // Agregar hoja con clientes disponibles
            const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
            const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
            clientesSheet.addRow(['Nombre', 'CUIT']);
            clientesSheet.getRow(1).font = { bold: true };
            clientesSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            clientesSheet.getColumn(1).width = 30;
            clientesSheet.getColumn(2).width = 15;
            
            clientes.forEach(cliente => {
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
                fgColor: { argb: 'FFE0E0E0' }
            };
            sitesSheet.getColumn(1).width = 30;
            sitesSheet.getColumn(2).width = 30;
            sitesSheet.getColumn(3).width = 25;
            sitesSheet.getColumn(4).width = 20;
            
            sites.forEach(site => {
                sitesSheet.addRow([
                    site.nombre,
                    (site.cliente as any)?.nombre || 'Sin cliente',
                    site.localidad || '-',
                    site.provincia || '-'
                ]);
            });
            
            // Agregar hoja con choferes disponibles
            const choferes = await Personal.find({ 
                activo: true, 
                tipo: 'Conductor' 
            }, 'nombre apellido dni empresa')
                .populate('empresa', 'nombre')
                .sort({ apellido: 1, nombre: 1 });
            const choferesSheet = workbook.addWorksheet('Choferes Disponibles');
            choferesSheet.addRow(['Nombre Completo', 'DNI', 'Empresa']);
            choferesSheet.getRow(1).font = { bold: true };
            choferesSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            choferesSheet.getColumn(1).width = 35;
            choferesSheet.getColumn(2).width = 15;
            choferesSheet.getColumn(3).width = 30;
            
            choferes.forEach(chofer => {
                choferesSheet.addRow([
                    `${chofer.nombre} ${chofer.apellido}`,
                    chofer.dni,
                    (chofer.empresa as any)?.nombre || 'Sin empresa'
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
                fgColor: { argb: 'FFE0E0E0' }
            };
            vehiculosSheet.getColumn(1).width = 15;
            vehiculosSheet.getColumn(2).width = 20;
            vehiculosSheet.getColumn(3).width = 20;
            vehiculosSheet.getColumn(4).width = 20;
            vehiculosSheet.getColumn(5).width = 30;
            
            vehiculos.forEach(vehiculo => {
                vehiculosSheet.addRow([
                    vehiculo.dominio,
                    vehiculo.marca || '-',
                    vehiculo.modelo || '-',
                    vehiculo.tipo,
                    (vehiculo.empresa as any)?.nombre || 'Sin empresa'
                ]);
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR VIAJES']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. Cliente *: Nombre del cliente (debe existir en "Clientes Disponibles")']);
            instructionsSheet.addRow(['3. Site Origen *: Nombre del site de origen (debe existir en "Sites Disponibles")']);
            instructionsSheet.addRow(['4. Site Destino *: Nombre del site de destino (debe existir en "Sites Disponibles")']);
            instructionsSheet.addRow(['5. Tipo Tramo *: Debe ser "TRMC" o "TRMI"']);
            instructionsSheet.addRow(['6. Fecha *: Formato DD/MM/AAAA (ej: 15/01/2024)']);
            instructionsSheet.addRow(['7. Chofer *: DNI del chofer (debe existir en "Choferes Disponibles")']);
            instructionsSheet.addRow(['8. Vehículo Principal *: Dominio del vehículo (debe existir en "Vehículos Disponibles")']);
            instructionsSheet.addRow(['9. DT *: Código único del viaje (debe ser único por cliente)']);
            instructionsSheet.addRow(['10. Paletas: Número de paletas (opcional, por defecto 0)']);
            instructionsSheet.addRow(['11. Estado: Pendiente/En Curso/Completado/Cancelado (por defecto Pendiente)']);
            instructionsSheet.addRow(['12. Observaciones: Información adicional (opcional)']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['CAMPOS CALCULADOS AUTOMÁTICAMENTE:']);
            instructionsSheet.addRow(['- Tipo Unidad: Se determina automáticamente según el vehículo principal']);
            instructionsSheet.addRow(['- Tarifa: Se calcula según el tramo y tarifas vigentes']);
            instructionsSheet.addRow(['- Peaje: Se obtiene de las tarifas vigentes del tramo']);
            instructionsSheet.addRow(['- Total: Suma de tarifa + extras aplicados']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['IMPORTANTE: Use las hojas de referencia para consultar los valores válidos']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getRow(14).font = { bold: true };
            instructionsSheet.getColumn(1).width = 80;
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_viajes.xlsx"'
            );
            
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
                { header: 'Valor *', key: 'valor', width: 15 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                tipo: 'SEGURO_CARGA',
                cliente: 'Empresa Ejemplo S.A.',
                descripcion: 'Seguro adicional para carga valiosa',
                vigenciaDesde: '01/01/2024',
                vigenciaHasta: '31/12/2024',
                valor: 50.00
            });
            
            // Agregar hoja con clientes disponibles
            const clientes = await Cliente.find({ activo: true }, 'nombre cuit').sort({ nombre: 1 });
            const clientesSheet = workbook.addWorksheet('Clientes Disponibles');
            clientesSheet.addRow(['Nombre', 'CUIT']);
            clientesSheet.getRow(1).font = { bold: true };
            clientesSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            clientesSheet.getColumn(1).width = 30;
            clientesSheet.getColumn(2).width = 15;
            
            clientes.forEach(cliente => {
                clientesSheet.addRow([cliente.nombre, cliente.cuit]);
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR EXTRAS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. Tipo *: Identificador del extra (se convierte automáticamente a MAYÚSCULAS)']);
            instructionsSheet.addRow(['3. Cliente *: Nombre del cliente (debe existir en "Clientes Disponibles")']);
            instructionsSheet.addRow(['4. Descripción: Descripción detallada del extra (opcional)']);
            instructionsSheet.addRow(['5. Vigencia Desde *: Fecha de inicio de vigencia (DD/MM/AAAA)']);
            instructionsSheet.addRow(['6. Vigencia Hasta *: Fecha de fin de vigencia (DD/MM/AAAA)']);
            instructionsSheet.addRow(['7. Valor *: Valor del extra (número, mínimo 0)']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['VALIDACIONES IMPORTANTES:']);
            instructionsSheet.addRow(['- La fecha de fin debe ser mayor o igual a la fecha de inicio']);
            instructionsSheet.addRow(['- No pueden existir extras del mismo tipo y cliente con fechas superpuestas']);
            instructionsSheet.addRow(['- El tipo se almacena en MAYÚSCULAS automáticamente']);
            instructionsSheet.addRow(['- El valor debe ser un número mayor o igual a 0']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['EJEMPLOS DE TIPOS: SEGURO_CARGA, COMBUSTIBLE_EXTRA, PEAJE_ADICIONAL']);
            instructionsSheet.addRow(['IMPORTANTE: Use la hoja "Clientes Disponibles" para consultar los clientes válidos']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getRow(9).font = { bold: true };
            instructionsSheet.getColumn(1).width = 80;
            
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-oficedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="plantilla_extras.xlsx"'
            );
            
            await workbook.xlsx.write(res);
            logger.info('Plantilla de extras generada exitosamente');
            
        } catch (error) {
            logger.error('Error al generar plantilla de extras:', error);
            throw error;
        }
    }
}