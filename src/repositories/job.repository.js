import pool from '../config/database.js';

export class JobRepository {
  /**
   * Obtiene una vacante por su ID.
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  static async obtenerPorId(id) {
    const [rows] = await pool.execute(
      'SELECT id, titulo_cargo, anos_minimos_experiencia, estado FROM vacantes WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}