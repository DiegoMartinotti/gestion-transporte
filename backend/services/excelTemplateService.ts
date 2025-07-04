import ExcelJS from 'exceljs';
import { Response } from 'express';
import logger from '../utils/logger';

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
                { header: 'RUC', key: 'ruc', width: 15 },
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Dirección', key: 'direccion', width: 40 }
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
                ruc: '20123456789',
                nombre: 'Empresa Ejemplo S.A.C.',
                email: 'contacto@ejemplo.com',
                telefono: '01-2345678',
                direccion: 'Av. Ejemplo 123, Lima'
            });
            
            // Agregar hoja de instrucciones
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR CLIENTES']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios marcados con *']);
            instructionsSheet.addRow(['2. RUC: Debe tener 11 dígitos y ser válido']);
            instructionsSheet.addRow(['3. Nombre: Mínimo 3 caracteres']);
            instructionsSheet.addRow(['4. Email: Formato de email válido']);
            instructionsSheet.addRow(['5. Teléfono: Formato válido (opcional)']);
            instructionsSheet.addRow(['6. Dirección: Dirección completa (opcional)']);
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
                { header: 'RUC', key: 'ruc', width: 15 },
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Dirección', key: 'direccion', width: 40 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                ruc: '20987654321',
                nombre: 'Transportes Ejemplo S.R.L.',
                email: 'info@transportes.com',
                telefono: '01-9876543',
                direccion: 'Jr. Transportes 456, Callao'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR EMPRESAS']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. RUC: Debe tener 11 dígitos y ser válido']);
            instructionsSheet.addRow(['3. Nombre: Mínimo 3 caracteres']);
            instructionsSheet.addRow(['4. Email: Formato de email válido']);
            instructionsSheet.addRow(['5. Teléfono: Formato válido (opcional)']);
            instructionsSheet.addRow(['6. Dirección: Dirección completa (opcional)']);
            
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
                { header: 'DNI', key: 'dni', width: 12 },
                { header: 'Nombres', key: 'nombres', width: 25 },
                { header: 'Apellidos', key: 'apellidos', width: 25 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Cargo', key: 'cargo', width: 20 },
                { header: 'Empresa RUC', key: 'empresaRuc', width: 15 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                dni: '12345678',
                nombres: 'Juan Carlos',
                apellidos: 'Pérez López',
                email: 'juan.perez@empresa.com',
                telefono: '987654321',
                cargo: 'Conductor',
                empresaRuc: '20123456789'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR PERSONAL']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. DNI: Debe tener 8 dígitos']);
            instructionsSheet.addRow(['3. Nombres: Nombres completos']);
            instructionsSheet.addRow(['4. Apellidos: Apellidos completos']);
            instructionsSheet.addRow(['5. Email: Formato de email válido']);
            instructionsSheet.addRow(['6. Teléfono: Formato válido (opcional)']);
            instructionsSheet.addRow(['7. Cargo: Puesto de trabajo']);
            instructionsSheet.addRow(['8. Empresa RUC: RUC de la empresa a la que pertenece']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
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
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Dirección', key: 'direccion', width: 40 },
                { header: 'Latitud', key: 'latitud', width: 15 },
                { header: 'Longitud', key: 'longitud', width: 15 },
                { header: 'Cliente RUC', key: 'clienteRuc', width: 15 },
                { header: 'Descripción', key: 'descripcion', width: 40 }
            ];
            
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.addRow({
                nombre: 'Almacén Central',
                direccion: 'Av. Industrial 123, Lima',
                latitud: -12.0464,
                longitud: -77.0428,
                clienteRuc: '20123456789',
                descripcion: 'Almacén principal de distribución'
            });
            
            const instructionsSheet = workbook.addWorksheet('Instrucciones');
            instructionsSheet.addRow(['INSTRUCCIONES PARA IMPORTAR SITES']);
            instructionsSheet.addRow(['']);
            instructionsSheet.addRow(['1. Complete todos los campos obligatorios']);
            instructionsSheet.addRow(['2. Nombre: Nombre del sitio']);
            instructionsSheet.addRow(['3. Dirección: Dirección completa']);
            instructionsSheet.addRow(['4. Latitud/Longitud: Coordenadas GPS (opcional)']);
            instructionsSheet.addRow(['5. Cliente RUC: RUC del cliente propietario']);
            instructionsSheet.addRow(['6. Descripción: Información adicional (opcional)']);
            
            instructionsSheet.getRow(1).font = { bold: true, size: 14 };
            instructionsSheet.getColumn(1).width = 60;
            
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