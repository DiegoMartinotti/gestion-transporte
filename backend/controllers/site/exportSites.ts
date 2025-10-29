import { Request, Response } from 'express';
import * as ExcelJS from 'exceljs';
import { FilterQuery } from 'mongoose';
import { tryCatch } from '../../utils/errorHandler';
import Site, { ISite } from '../../models/Site';
import logger from '../../utils/logger';
import { PopulatedCliente } from '../../types/mongoose';

/**
 * Exporta sites a Excel con filtros aplicados
 * @route GET /api/sites/export
 * @param cliente - Optional client filter
 * @param search - Optional search term
 * @returns Excel file with sites data
 */
// eslint-disable-next-line max-lines-per-function
export const exportSites = tryCatch(async (req: Request, res: Response): Promise<void> => {
  logger.info('Exportando sites a Excel');

  // Construir filtros desde query parameters
  const filters: FilterQuery<ISite> = {};
  if (req.query.cliente) {
    filters.cliente = req.query.cliente as string;
  }
  if (req.query.search) {
    const searchTerm = req.query.search as string;
    filters.$or = [
      { nombre: { $regex: searchTerm, $options: 'i' } },
      { direccion: { $regex: searchTerm, $options: 'i' } },
      { localidad: { $regex: searchTerm, $options: 'i' } },
      { provincia: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Obtener sites con filtros
  const sites = await Site.find(filters)
    .populate<{ cliente: PopulatedCliente }>('cliente', 'nombre cuit')
    .sort({ nombre: 1 });

  // Crear workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sites');

  // Configurar columnas
  worksheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Código', key: 'codigo', width: 15 },
    { header: 'Dirección', key: 'direccion', width: 40 },
    { header: 'Localidad', key: 'localidad', width: 25 },
    { header: 'Provincia', key: 'provincia', width: 20 },
    { header: 'Longitud', key: 'longitud', width: 15 },
    { header: 'Latitud', key: 'latitud', width: 15 },
    { header: 'Fecha Creación', key: 'fechaCreacion', width: 20 },
  ];

  // Estilo para el header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Agregar datos
  sites.forEach((site) => {
    worksheet.addRow({
      nombre: site.nombre,
      cliente:
        typeof site.cliente === 'object' && site.cliente ? site.cliente.nombre : 'Sin cliente',
      codigo: site.codigo || '',
      direccion: site.direccion || '',
      localidad: site.localidad || '',
      provincia: site.provincia || '',
      longitud: site.location?.coordinates?.[0] || '',
      latitud: site.location?.coordinates?.[1] || '',
      fechaCreacion: site.createdAt ? new Date(site.createdAt).toLocaleDateString() : '',
    });
  });

  // Configurar respuesta
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="sites_export_${new Date().toISOString().split('T')[0]}.xlsx"`
  );

  await workbook.xlsx.write(res);
  logger.info(`Exportación de sites completada: ${sites.length} registros`);
});
