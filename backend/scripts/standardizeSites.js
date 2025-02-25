const mongoose = require('mongoose');
const Site = require('../models/Site');
require('dotenv').config();

async function standardizeSites() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        const sites = await Site.find({});
        console.log(`Encontrados ${sites.length} sites para estandarizar`);

        for (const site of sites) {
            site.cliente = site.cliente.toUpperCase();
            site.site = site.site.toUpperCase();
            await site.save();
        }

        console.log('Estandarización completada');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

standardizeSites();
