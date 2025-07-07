import ExcelJS from 'exceljs';
import { Response } from 'express';
import logger from '../utils/logger';
import Empresa from '../models/Empresa';
import Cliente from '../models/Cliente';

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
                { header: 'Placa', key: 'placa', width: 12 },
                { header: 'Marca', key: 'marca', width: 20 },
                { header: 'Modelo', key: 'modelo', width: 20 },
                { header: 'Año', key: 'anio', width: 10 },
                { header: 'Capacidad Carga', key: 'capacidadCarga', width: 15 },
                { header: 'Empresa RUC', key: 'empresaRuc', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                placa: 'ABC-123',
                marca: 'Volvo',
                modelo: 'FH16',
                anio: 2022,
                capacidadCarga: 25000,
                empresaRuc: '20987654321',
                estado: 'Activo'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR VEHÍCULOS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. Placa: Formato peruano (XXX-123)']);
            instructionsSheet.addRow(['3. Marca: Marca del vehículo']);
            instructionsSheet.addRow(['4. Modelo: Modelo del vehículo']);
            instructionsSheet.addRow(['5. Año: Año de fabricación']);
            instructionsSheet.addRow(['6. Capacidad Carga: Capacidad en kilogramos']);
            instructionsSheet.addRow(['7. Empresa RUC: RUC de la empresa propietaria']);
            instructionsSheet.addRow(['8. Estado: Activo, Inactivo, Mantenimiento']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
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
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Site Origen', key: 'siteOrigen', width: 30 },
                { header: 'Site Destino', key: 'siteDestino', width: 30 },
                { header: 'Cliente RUC', key: 'clienteRuc', width: 15 },
                { header: 'Distancia KM', key: 'distanciaKm', width: 15 },
                { header: 'Precio Base', key: 'precioBase', width: 15 },
                { header: 'Activo', key: 'activo', width: 10 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                nombre: 'Lima - Callao',
                siteOrigen: 'Almacén Central',
                siteDestino: 'Puerto Callao',
                clienteRuc: '20123456789',
                distanciaKm: 15.5,
                precioBase: 150.00,
                activo: 'SI'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR TRAMOS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. Nombre: Nombre descriptivo del tramo']);
            instructionsSheet.addRow(['3. Site Origen: Nombre del site de origen']);
            instructionsSheet.addRow(['4. Site Destino: Nombre del site de destino']);
            instructionsSheet.addRow(['5. Cliente RUC: RUC del cliente propietario']);
            instructionsSheet.addRow(['6. Distancia KM: Distancia en kilómetros']);
            instructionsSheet.addRow(['7. Precio Base: Precio base del tramo']);
            instructionsSheet.addRow(['8. Activo: SI o NO']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
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
                { header: 'Tramo', key: 'tramo', width: 30 },
                { header: 'Vehículo Placa', key: 'vehiculoPlaca', width: 15 },
                { header: 'Conductor DNI', key: 'conductorDni', width: 15 },
                { header: 'Fecha Inicio', key: 'fechaInicio', width: 20 },
                { header: 'Fecha Fin', key: 'fechaFin', width: 20 },
                { header: 'Carga KG', key: 'cargaKg', width: 15 },
                { header: 'Observaciones', key: 'observaciones', width: 40 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                tramo: 'Lima - Callao',
                vehiculoPlaca: 'ABC-123',
                conductorDni: '12345678',
                fechaInicio: '2024-01-15 08:00',
                fechaFin: '2024-01-15 10:00',
                cargaKg: 15000,
                observaciones: 'Carga frágil'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR VIAJES']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. Tramo: Nombre del tramo existente']);
            instructionsSheet.addRow(['3. Vehículo Placa: Placa del vehículo']);
            instructionsSheet.addRow(['4. Conductor DNI: DNI del conductor']);
            instructionsSheet.addRow(['5. Fecha Inicio: Formato YYYY-MM-DD HH:MM']);
            instructionsSheet.addRow(['6. Fecha Fin: Formato YYYY-MM-DD HH:MM']);
            instructionsSheet.addRow(['7. Carga KG: Peso de la carga en kilogramos']);
            instructionsSheet.addRow(['8. Observaciones: Información adicional (opcional)']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
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
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Descripción', key: 'descripcion', width: 40 },
                { header: 'Precio', key: 'precio', width: 15 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Activo', key: 'activo', width: 10 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                nombre: 'Seguro de Carga',
                descripcion: 'Seguro adicional para carga valiosa',
                precio: 50.00,
                tipo: 'Servicio',
                activo: 'SI'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR EXTRAS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. Nombre: Nombre del extra']);
            instructionsSheet.addRow(['3. Descripción: Descripción detallada']);
            instructionsSheet.addRow(['4. Precio: Precio del extra']);
            instructionsSheet.addRow(['5. Tipo: Tipo de extra (Servicio, Producto, etc.)']);
            instructionsSheet.addRow(['6. Activo: SI o NO']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
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