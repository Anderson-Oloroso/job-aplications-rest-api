import { ApplicationService } from '../services/application.service.js';
import { ApiResponse } from '../utils/response.util.js';

export class ApplicationController {
  /**
   * POST /applications
   */
  static async create(req, res, next) {
    try {
      const { candidateId, vacancyId, source, coverLetter } = req.body;
      const nuevaPostulacion = await ApplicationService.registrarPostulacion({
        candidateId,
        vacancyId,
        source,
        coverLetter
      });

      return ApiResponse.success(res, nuevaPostulacion, 'Postulación registrada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /applications
   */
  static async getAll(req, res, next) {
    try {
      const { status, vacancyId } = req.query;
      const postulaciones = await ApplicationService.listarPostulaciones({ status, vacancyId });

      return ApiResponse.success(res, postulaciones, 'Postulaciones obtenidas exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /applications/:id/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const resultado = await ApplicationService.cambiarEstado(id, status);

      return ApiResponse.success(res, resultado, 'Estado de postulación actualizado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
}