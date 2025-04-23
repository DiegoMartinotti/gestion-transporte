"use strict";
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../config/swaggerConfig');
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpecs));
module.exports = router;
//# sourceMappingURL=swagger.js.map