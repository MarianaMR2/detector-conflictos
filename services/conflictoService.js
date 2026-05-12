const db = require('../config/db');

async function detectarConflictoDiario(usuarioId, fecha) {
  const [[config]] = await db.query(
    'SELECT max_actividades_dia FROM configuracion WHERE usuario_id = ?',
    [usuarioId]
  );
  const limite = config?.max_actividades_dia || 2;

  const [[conteo]] = await db.query(`
    SELECT COUNT(*) AS total, SUM(dificultad) AS carga
    FROM actividades
    WHERE usuario_id = ? AND fecha = ? AND completada = FALSE
  `, [usuarioId, fecha]);

  return {
    tiene_conflicto: conteo.total >= limite,
    actividades_en_dia: conteo.total,
    carga_dificultad: conteo.carga || 0,
    limite_dia: limite,
    fecha
  };
}

async function detectarSaturacionSemanal(usuarioId, fecha) {
  const [[config]] = await db.query(
    'SELECT max_actividades_semana FROM configuracion WHERE usuario_id = ?',
    [usuarioId]
  );
  const limite = config?.max_actividades_semana || 5;

  const [[semana]] = await db.query(`
    SELECT
      DATE_SUB(?, INTERVAL WEEKDAY(?) DAY) AS lunes,
      DATE_ADD(DATE_SUB(?, INTERVAL WEEKDAY(?) DAY), INTERVAL 6 DAY) AS domingo
  `, [fecha, fecha, fecha, fecha]);

  const [actividades] = await db.query(`
    SELECT titulo, tipo, fecha, dificultad, materia
    FROM actividades
    WHERE usuario_id = ?
      AND fecha BETWEEN ? AND ?
      AND completada = FALSE
    ORDER BY fecha
  `, [usuarioId, semana.lunes, semana.domingo]);

  const cargaTotal = actividades.reduce((s, a) => s + (a.dificultad || 1), 0);

  return {
    tiene_saturacion: actividades.length >= limite,
    actividades_semana: actividades.length,
    carga_total: cargaTotal,
    limite_semana: limite,
    semana_inicio: semana.lunes,
    semana_fin: semana.domingo,
    detalle: actividades
  };
}

async function detectarConflictoHorario(usuarioId, fecha, hora, excluirId = null) {
  let query = `
    SELECT id, titulo, tipo, materia, hora
    FROM actividades
    WHERE usuario_id = ? AND fecha = ? AND hora = ? AND completada = FALSE
  `;
  const params = [usuarioId, fecha, hora];

  if (excluirId) {
    query += ' AND id != ?';
    params.push(excluirId);
  }

  const [coincidencias] = await db.query(query, params);
  return {
    tiene_conflicto: coincidencias.length > 0,
    actividades_misma_hora: coincidencias
  };
}

async function analizarYGenerarAlertas(usuarioId, actividad) {
  const alertas = [];
  const { id: actividadId, fecha, hora, titulo, tipo } = actividad;

  if (hora) {
    const conflictoHora = await detectarConflictoHorario(usuarioId, fecha, hora, actividadId);
    if (conflictoHora.tiene_conflicto) {
      const otra = conflictoHora.actividades_misma_hora[0];
      alertas.push({
        tipo: 'conflicto_fecha',
        mensaje: `Conflicto de horario: "${titulo}" coincide exactamente con "${otra.titulo}" el ${formatearFecha(fecha)} a las ${hora}. Considera cambiar la hora.`,
        fecha_referencia: fecha
      });
    }
  }

  const cargaDia = await detectarConflictoDiario(usuarioId, fecha);
  if (cargaDia.tiene_conflicto) {
    alertas.push({
      tipo: 'saturacion_diaria',
      mensaje: ` Día saturado: el ${formatearFecha(fecha)} tendrás ${cargaDia.actividades_en_dia} actividades (límite: ${cargaDia.limite_dia}). Nivel de carga: ${cargaDia.carga_dificultad}/10. Considera redistribuir tu tiempo de estudio.`,
      fecha_referencia: fecha
    });
  }

  const cargaSemana = await detectarSaturacionSemanal(usuarioId, fecha);
  if (cargaSemana.tiene_saturacion) {
    alertas.push({
      tipo: 'saturacion_semanal',
      mensaje: ` Semana crítica: del ${formatearFecha(cargaSemana.semana_inicio)} al ${formatearFecha(cargaSemana.semana_fin)} tienes ${cargaSemana.actividades_semana} actividades con carga total ${cargaSemana.carga_total}. ¡Empieza a prepararte con anticipación!`,
      fecha_referencia: fecha
    });
  }

  const [[config]] = await db.query(
    'SELECT dias_anticipacion FROM configuracion WHERE usuario_id = ?',
    [usuarioId]
  );
  const diasAntes = config?.dias_anticipacion || 3;

  alertas.push({
    tipo: 'recordatorio',
    mensaje: `Recordatorio: "${titulo}" (${tipo} de ${actividad.materia}) está programado para el ${formatearFecha(fecha)}. Prepárate con ${diasAntes} días de anticipación.`,
    fecha_referencia: new Date(new Date(fecha).getTime() - diasAntes * 86400000)
      .toISOString().split('T')[0]
  });

  for (const alerta of alertas) {
    await db.query(
      'INSERT INTO alertas (usuario_id, tipo, mensaje, fecha_referencia) VALUES (?, ?, ?, ?)',
      [usuarioId, alerta.tipo, alerta.mensaje, alerta.fecha_referencia]
    );
  }

  return alertas;
}

async function obtenerResumenSemana(usuarioId, fecha) {
  const resultado = await detectarSaturacionSemanal(usuarioId, fecha);

  const [porDia] = await db.query(`
    SELECT
      fecha,
      COUNT(*) AS total,
      SUM(dificultad) AS carga,
      GROUP_CONCAT(tipo ORDER BY hora SEPARATOR ', ') AS tipos
    FROM actividades
    WHERE usuario_id = ? AND fecha BETWEEN ? AND ? AND completada = FALSE
    GROUP BY fecha
    ORDER BY fecha
  `, [usuarioId, resultado.semana_inicio, resultado.semana_fin]);

  return { ...resultado, por_dia: porDia };
}

function formatearFecha(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = {
  detectarConflictoDiario,
  detectarSaturacionSemanal,
  detectarConflictoHorario,
  analizarYGenerarAlertas,
  obtenerResumenSemana
};