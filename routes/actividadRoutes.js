const router = require('express').Router();
const ctrl = require('../controllers/actividadController');
const { verificarToken } = require('../middleware/authMiddleware');

router.use(verificarToken);
router.post('/',               ctrl.crear);
router.get('/',                ctrl.listar);
router.get('/semana',          ctrl.resumenSemana);
router.get('/:id',             ctrl.obtener);
router.put('/:id',             ctrl.editar);
router.patch('/:id/completar', ctrl.completar);
router.delete('/:id',          ctrl.eliminar);

module.exports = router;