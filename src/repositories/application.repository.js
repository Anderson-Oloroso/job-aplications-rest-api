import pool from '../config/database.js';

export class ApplicationRepository {
  /**
   * Cuenta las postulaciones activas ('RECEIVED', 'IN_REVIEW') de un candidato en otras vacantes.
   */
  static async contarPostulacionesActivasEnOtrasVacantes(candidatoId, vacanteId) {
    const query = `
      SELECT COUNT(*) AS total
      FROM postulaciones
      WHERE candidato_id = ?
        AND vacante_id != ?
        AND estado IN ('RECEIVED', 'IN_REVIEW')
    `;
    const [rows] = await pool.execute(query, [candidatoId, vacanteId]);
    return rows[0].total;
  }

  /**
   * Busca la postulación más reciente de un candidato para una vacante específica.
   */
  static async obtenerUltimaPostulacion(candidatoId, vacanteId) {
    const query = `
      SELECT id, estado, fecha_ultima_actualizacion, fecha_creacion
      FROM postulaciones
      WHERE candidato_id = ? AND vacante_id = ?
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [candidatoId, vacanteId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Inserta una nueva postulación en la base de datos.
   */
  static async crear(data) {
    const { candidatoId, vacanteId, cartaPresentacion, fuente, puntaje, prioridad } = data;
    const query = `
      INSERT INTO postulaciones 
        (candidato_id, vacante_id, carta_presentacion, fuente, puntaje, prioridad, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED')
    `;
    const [result] = await pool.execute(query, [
      candidatoId,
      vacanteId,
      cartaPresentacion || null,
      fuente,
      puntaje,
      prioridad
    ]);
    
    return result.insertId;
  }

  /**
   * Obtiene una postulación por su ID.
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT id, candidato_id, vacante_id, carta_presentacion, fuente, 
             puntaje, prioridad, estado, fecha_creacion, fecha_ultima_actualizacion
      FROM postulaciones
      WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Consulta postulaciones con opción de filtrado por estado y/o vacante.
   * Ordenado por puntaje DESC y fecha_creacion ASC.
   */
  static async listar({ status, vacancyId }) {
    let query = `
      SELECT 
        p.id,
        p.candidato_id AS candidateId,
        c.nombre AS candidateName,
        c.correo_electronico AS candidateEmail,
        p.vacante_id AS vacancyId,
        v.titulo_cargo AS vacancyTitle,
        p.carta_presentacion AS coverLetter,
        p.fuente AS source,
        p.puntaje AS score,
        p.prioridad AS priority,
        p.estado AS status,
        p.fecha_creacion AS createdAt,
        p.fecha_ultima_actualizacion AS updatedAt
      FROM postulaciones p
      INNER JOIN candidatos c ON p.candidato_id = c.id
      INNER JOIN vacantes v ON p.vacante_id = v.id
    `;

    const whereConditions = [];
    const queryParams = [];

    if (status) {
      whereConditions.push('p.estado = ?');
      queryParams.push(status);
    }

    if (vacancyId) {
      whereConditions.push('p.vacante_id = ?');
      queryParams.push(vacancyId);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Ordenamiento requerido: puntaje de mayor a menor y fecha_creacion la más antigua primero
    query += ' ORDER BY p.puntaje DESC, p.fecha_creacion ASC';

    const [rows] = await pool.execute(query, queryParams);
    return rows;
  }

  /**
   * Actualiza el estado de una postulación.
   */
  static async actualizarEstado(id, nuevoEstado) {
    const query = `
      UPDATE postulaciones 
      SET estado = ?, fecha_ultima_actualizacion = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [nuevoEstado, id]);
    return result.affectedRows > 0;
  }
}