import pool from '../config/database.js';

export class CandidateRepository {
  /**
   * Obtiene un candidato por su ID.
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  static async obtenerPorId(id) {
    const [rows] = await pool.execute(
      'SELECT id, nombre, correo_electronico, anos_experiencia FROM candidatos WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}