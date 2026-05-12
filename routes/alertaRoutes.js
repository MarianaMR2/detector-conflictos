const router = require('express').Router();
const ctrl = require('../controllers/alertaController');
const { verificarToken } = require('../middleware/authMiddleware');

router.use(verificarToken);
router.get('/',              ctrl.misAlertas);
router.patch('/:id/leer',   ctrl.marcarLeida);
router.patch('/leer-todas', ctrl.marcarTodasLeidas);

module.exports = router;