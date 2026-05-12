const db = require('../config/db');
const { analizarYGenerarAlertas, obtenerResumenSemana } = require('../services/conflictoService');

const crear = async (req, res) => {
  try {
    const { titulo, tipo, materia, fecha, hora, dificultad, descripcion } = req.body;
    const usuarioId = req.usuario.id;

    if (!titulo || !tipo || !materia || !fecha) {
      return res.status(400).json({ error: 'Campos requeridos: titulo, tipo, materia, fecha' });
    }

    const [result] = await db.query(`
      INSERT INTO actividades (usuario_id, titulo, tipo, materia, fecha, hora, dificultad, descripcion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [usuarioId, titulo, tipo, materia, fecha, hora || null, dificultad || 3, descripcion || null]);

    const alertas = await analizarYGenerarAlertas(usuarioId, {
      id: result.insertId, titulo, tipo, materia, fecha, hora, dificultad
    });

    res.status(201).json({
      mensaje: 'Actividad registrada',
      actividad_id: result.insertId,
      alertas_generadas: alertas.length,
      alertas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listar = async (req, res) => {
  try {
    const { desde, hasta, tipo, completada } = req.query;
    let query = 'SELECT * FROM actividades WHERE usuario_id = ?';
    const params = [req.usuario.id];

    if (desde)      { query += ' AND fecha >= ?'; params.push(desde); }
    if (hasta)      { query += ' AND fecha <= ?'; params.push(hasta); }
    if (tipo)       { query += ' AND tipo = ?';   params.push(tipo); }
    if (completada !== undefined) {
      query += ' AND completada = ?';
      params.push(completada === 'true' ? 1 : 0);
    }

    query += ' ORDER BY fecha ASC, hora ASC';
    const [actividades] = await db.query(query, params);

    res.json({ total: actividades.length, actividades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const [[actividad]] = await db.query(
      'SELECT * FROM actividades WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });
    res.json(actividad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const editar = async (req, res) => {
  try {
    const { titulo, tipo, materia, fecha, hora, dificultad, descripcion } = req.body;
    await db.query(`
      UPDATE actividades
      SET titulo=?, tipo=?, materia=?, fecha=?, hora=?, dificultad=?, descripcion=?
      WHERE id=? AND usuario_id=?
    `, [titulo, tipo, materia, fecha, hora || null, dificultad || 3, descripcion || null,
        req.params.id, req.usuario.id]);

    const alertas = await analizarYGenerarAlertas(req.usuario.id, {
      id: req.params.id, titulo, tipo, materia, fecha, hora, dificultad
    });

    res.json({ mensaje: 'Actividad actualizada', alertas_nuevas: alertas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const completar = async (req, res) => {
  try {
    await db.query(
      'UPDATE actividades SET completada = TRUE WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );
    res.json({ mensaje: 'Actividad marcada como completada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM actividades WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );
    res.json({ mensaje: 'Actividad eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resumenSemana = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const resumen = await obtenerResumenSemana(req.usuario.id, fecha);
    res.json(resumen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { crear, listar, obtener, editar, completar, eliminar, resumenSemana };