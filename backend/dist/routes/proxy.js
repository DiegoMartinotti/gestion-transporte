"use strict";
const express = require('express');
const router = express.Router();
const { geocode } = require('../controllers/proxyController');
router.get('/geocode', geocode);
module.exports = router;
//# sourceMappingURL=proxy.js.map