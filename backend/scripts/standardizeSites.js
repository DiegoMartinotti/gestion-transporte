const mongoose = require('mongoose');
const Site = require('../models/Site');
const logger = require('../utils/logger');
require('dotenv').config();

async function standardizeSites() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Conectado a MongoDB');

        const sites = await Site.find({});
        logger.info(`Encontrados ${sites.length} sites para estandarizar`);

        for (const site of sites) {
            site.cliente = site.cliente.toUpperCase();
            site.site = site.site.toUpperCase();
            await site.save();
        }

        logger.info('Estandarización completada');
        process.exit(0);
    } catch (error) {
        logger.error('Error:', error);
        process.exit(1);
    }
}

standardizeSites();
