const getAllSites = require('./getAllSites');
const createSite = require('./createSite');
const updateSite = require('./updateSite');
const deleteSite = require('./deleteSite');
const bulkCreateSites = require('./bulkCreateSites');
const searchNearby = require('./searchNearby');
const getSitesByCliente = require('./getSitesByCliente');

module.exports = {
    getAllSites,
    createSite,
    updateSite,
    deleteSite,
    bulkCreateSites,
    searchNearby,
    getSitesByCliente
}; 