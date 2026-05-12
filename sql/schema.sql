CREATE DATABASE IF NOT EXISTS academico_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE academico_db;

CREATE TABLE usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  programa    VARCHAR(150),
  semestre    INT CHECK (semestre BETWEEN 1 AND 10),
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE actividades (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  titulo      VARCHAR(200) NOT NULL,
  tipo        ENUM('parcial','entrega','exposicion','taller','otro') NOT NULL,
  materia     VARCHAR(100) NOT NULL,
  fecha       DATE NOT NULL,
  hora        TIME,
  dificultad  TINYINT CHECK (dificultad BETWEEN 1 AND 5),
  descripcion TEXT,
  completada  BOOLEAN DEFAULT FALSE,
  creada_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE alertas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT NOT NULL,
  tipo             ENUM('conflicto_fecha','saturacion_diaria','saturacion_semanal','recordatorio') NOT NULL,
  mensaje          TEXT NOT NULL,
  fecha_referencia DATE NOT NULL,
  leida            BOOLEAN DEFAULT FALSE,
  creada_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE configuracion (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id             INT NOT NULL UNIQUE,
  max_actividades_dia    INT DEFAULT 2,
  max_actividades_semana INT DEFAULT 5,
  dias_anticipacion      INT DEFAULT 3,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE VIEW vista_carga_semanal AS
SELECT
  u.id AS usuario_id,
  u.nombre,
  YEARWEEK(a.fecha, 1)             AS semana,
  MIN(a.fecha)                     AS inicio_semana,
  MAX(a.fecha)                     AS fin_semana,
  COUNT(*)                         AS total_actividades,
  SUM(a.dificultad)                AS carga_total,
  AVG(a.dificultad)                AS dificultad_promedio,
  SUM(CASE WHEN a.tipo = 'parcial'     THEN 1 ELSE 0 END) AS parciales,
  SUM(CASE WHEN a.tipo = 'entrega'     THEN 1 ELSE 0 END) AS entregas,
  SUM(CASE WHEN a.tipo = 'exposicion'  THEN 1 ELSE 0 END) AS exposiciones
FROM actividades a
JOIN usuarios u ON a.usuario_id = u.id
WHERE a.completada = FALSE
GROUP BY u.id, u.nombre, YEARWEEK(a.fecha, 1);