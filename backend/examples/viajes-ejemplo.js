const fs = require('fs');
const logger = require('../utils/logger');

const viajes = [
  {
    origen: "Buenos Aires",
    destino: "Rosario",
    fecha: "2024-03-20",
    tarifa: 150000,
    cliente: "Cliente A",
    dt: "2024-03-20-A1",
    demoras: 5000,
    operativos: 3000,
    estadias: 2000,
    cobrado: false,
    paletas: 2
  },
  {
    origen: "Córdoba",
    destino: "Mendoza",
    fecha: "2024-03-21",
    tarifa: 180000,
    cliente: "Cliente B",
    dt: "2024-03-21-B1",
    demoras: 0,
    operativos: 4000,
    estadias: 0,
    cobrado: true,
    paletas: 4
  },
  {
    origen: "La Plata",
    destino: "Mar del Plata",
    fecha: "2024-03-22",
    tarifa: 130000,
    cliente: "Cliente C",
    dt: "2024-03-22-C1",
    demoras: 2000,
    operativos: 0,
    estadias: 3000,
    cobrado: false,
    paletas: 3
  }
];

// Crear el contenido CSV
const headers = Object.keys(viajes[0]).join(',');
const rows = viajes.map(viaje => Object.values(viaje).join(','));
const csvContent = [headers, ...rows].join('\n');

// Escribir el archivo CSV
fs.writeFileSync('viajes-ejemplo.csv', csvContent);

logger.info("Archivo CSV generado: viajes-ejemplo.csv");
