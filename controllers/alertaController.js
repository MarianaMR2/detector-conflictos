const db = require('../config/db');

const misAlertas = async (req, res) => {
  try {
    const [alertas] = await db.query(`
      SELECT * FROM alertas
      WHERE usuario_id = ?
      ORDER BY leida ASC, creada_en DESC
    `, [req.usuario.id]);

    const noLeidas = alertas.filter(a => !a.leida).length;
    res.json({ no_leidas: noLeidas, total: alertas.length, alertas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const marcarLeida = async (req, res) => {
  try {
    await db.query(
      'UPDATE alertas SET leida = TRUE WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );
    res.json({ mensaje: 'Alerta marcada como leída' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const marcarTodasLeidas = async (req, res) => {
  try {
    await db.query(
      'UPDATE alertas SET leida = TRUE WHERE usuario_id = ?',
      [req.usuario.id]
    );
    res.json({ mensaje: 'Todas las alertas marcadas como leídas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { misAlertas, marcarLeida, marcarTodasLeidas };