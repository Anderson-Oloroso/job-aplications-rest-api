-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS recruitment_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recruitment_db;

-- Desactivar temporalmente revisión de llaves foráneas para reinicialización limpia
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS postulaciones;
DROP TABLE IF EXISTS vacantes;
DROP TABLE IF EXISTS candidatos;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- TABLA: candidatos
-- Cumple 3FN: Todos los campos depeden únicamente del ID del candidato.
-- =============================================================================
CREATE TABLE candidatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(150) NOT NULL UNIQUE,
    anos_experiencia INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_anos_experiencia CHECK (anos_experiencia >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLA: vacantes
-- Cumple 3FN: Los atributos describen únicamente las propiedades de la vacante.
-- =============================================================================
CREATE TABLE vacantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo_cargo VARCHAR(150) NOT NULL,
    anos_minimos_experiencia INT NOT NULL DEFAULT 0,
    estado ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vacante_anos_minimos CHECK (anos_minimos_experiencia >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLA: postulaciones
-- Cumple 3FN: Relaciona Candidato y Vacante. No hay dependencias transitivas.
-- =============================================================================
CREATE TABLE postulaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    carta_presentacion TEXT NULL,
    fuente ENUM('REFERRAL', 'INTERNAL', 'JOB_BOARD', 'OTHER') NOT NULL,
    puntaje DECIMAL(5,2) NULL DEFAULT 0.00,
    prioridad ENUM('HIGH', 'MEDIUM', 'LOW') NULL,
    estado ENUM('RECEIVED', 'IN_REVIEW', 'REJECTED', 'HIRED') NOT NULL DEFAULT 'RECEIVED',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas con restricciones de integridad
    CONSTRAINT fk_postulacion_candidato 
        FOREIGN KEY (candidato_id) REFERENCES candidatos(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_postulacion_vacante 
        FOREIGN KEY (vacante_id) REFERENCES vacantes(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Un candidato solo puede postularse una vez a la misma vacante
    CONSTRAINT uq_candidato_vacante UNIQUE (candidato_id, vacante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices de rendimiento para consultas frecuentes de selección y filtrado
CREATE INDEX idx_postulaciones_vacante_estado ON postulaciones(vacante_id, estado);
CREATE INDEX idx_postulaciones_prioridad ON postulaciones(prioridad);

-- Actualización de la definición del tipo de datos para el campo prioridad
ALTER TABLE postulaciones 
MODIFY COLUMN prioridad ENUM('LOW', 'MEDIUM', 'HIGH', 'TOP') NOT NULL;