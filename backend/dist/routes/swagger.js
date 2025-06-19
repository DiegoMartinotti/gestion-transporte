import express from 'express';
const router = express.Router();
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from '../config/swaggerConfig';
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpecs));
export default router;
//# sourceMappingURL=swagger.js.map