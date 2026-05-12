const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const registrar = async (req, res) => {
  try {
    const { nombre, email, password, programa, semestre } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const [[existe]] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (existe) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, password, programa, semestre) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hash, programa || null, semestre || null]
    );

    // Crear configuración por defecto para el usuario
    await db.query(
      'INSERT INTO configuracion (usuario_id) VALUES (?)',
      [result.insertId]
    );

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [[usuario]] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?', [email]
    );

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      usuario: {
        id:       usuario.id,
        nombre:   usuario.nombre,
        email:    usuario.email,
        programa: usuario.programa,
        semestre: usuario.semestre
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registrar, login };