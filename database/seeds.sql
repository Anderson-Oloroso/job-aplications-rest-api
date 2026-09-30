
-- =============================================================================
-- DATA SEEDS (Datos de Prueba)
-- =============================================================================

-- 1. Candidatos (Mínimo 5 registros)
INSERT INTO candidatos (id, nombre, correo_electronico, anos_experiencia) VALUES
(1, 'Carlos Mendoza', 'carlos.mendoza@example.com', 5),
(2, 'Ana Sofía Rodríguez', 'ana.rodriguez@example.com', 2),
(3, 'Luis Fernando Gómez', 'luis.gomez@example.com', 8),
(4, 'María Isabel Morales', 'maria.morales@example.com', 1),
(5, 'Jorge Mario Alvarado', 'jorge.alvarado@example.com', 4),
(6, 'Elena Patricia Fuentes', 'elena.fuentes@example.com', 6);

-- 2. Vacantes (Mínimo 5 registros, incluye al menos una CLOSED)
INSERT INTO vacantes (id, titulo_cargo, anos_minimos_experiencia, estado) VALUES
(1, 'Desarrollador Backend Senior', 5, 'OPEN'),
(2, 'Analista de QA Automation', 2, 'OPEN'),
(3, 'Diseñador UX/UI', 3, 'OPEN'),
(4, 'Arquitecto de Software', 7, 'CLOSED'), -- Vacante cerrada
(5, 'Ingeniero DevOps', 4, 'OPEN');

-- 3. Postulaciones (Mínimo 5 registros)
INSERT INTO postulaciones (id, candidato_id, vacante_id, carta_presentacion, fuente, puntaje, prioridad, estado) VALUES
(1, 1, 1, 'Cuento con amplia experiencia en arquitecturas distribuidas con Node.js y MySQL.', 'REFERRAL', 95.00, 'HIGH', 'RECEIVED'),
(2, 2, 2, 'Me apasiona el aseguramiento de calidad y las pruebas automatizadas.', 'JOB_BOARD', 70.00, 'MEDIUM', 'IN_REVIEW'),
(3, 3, 4, 'Tengo más de 8 años diseñando sistemas escalables.', 'INTERNAL', 85.00, 'MEDIUM', 'REJECTED'),
(4, 4, 3, 'Diseñadora egresada enfocada en interfaces intuitivas.', 'OTHER', 40.00, 'LOW', 'RECEIVED'),
(5, 5, 5, 'Especialista en pipelines de CI/CD y gestión de contenedores.', 'JOB_BOARD', 80.00, 'HIGH', 'IN_REVIEW'),
(6, 6, 1, 'Desarrolladora Fullstack con enfoque principal en servicios RESTful backend.', 'INTERNAL', 90.00, 'HIGH', 'RECEIVED');