import { ApplicationRepository } from '../repositories/application.repository.js';
import { JobRepository } from '../repositories/job.repository.js';
import { CandidateRepository } from '../repositories/candidate.repository.js';
import { PriorityService } from './priority.service.js';

const FUENTES_PERMITIDAS = ['REFERRAL', 'INTERNAL', 'JOB_BOARD', 'OTHER'];
const ESTADOS_PERMITIDOS = ['RECEIVED', 'IN_REVIEW', 'REJECTED', 'HIRED'];
const ESTADOS_FINALES = ['REJECTED', 'HIRED'];

export class ApplicationService {
  /**
   * Registra una postulación verificando todas las reglas de negocio y restricciones.
   */
  static async registrarPostulacion({ candidateId, vacancyId, source, coverLetter }) {
    // 1. Validar datos obligatorios
    if (!candidateId || !vacancyId || !source) {
      const error = new Error('Los campos candidateId, vacancyId y source son obligatorios.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Validar fuente permitida
    if (!FUENTES_PERMITIDAS.includes(source)) {
      const error = new Error(`La fuente '${source}' no es válida. Permitidas: ${FUENTES_PERMITIDAS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    // 3. Verificar que el candidato exista
    const candidato = await CandidateRepository.obtenerPorId(candidateId);
    if (!candidato) {
      const error = new Error('El candidato especificado no existe.');
      error.statusCode = 404;
      throw error;
    }

    // 4. Verificar que la vacante exista y esté OPEN
    const vacante = await JobRepository.obtenerPorId(vacancyId);
    if (!vacante) {
      const error = new Error('La vacante especificada no existe.');
      error.statusCode = 404;
      throw error;
    }

    if (vacante.estado !== 'OPEN') {
      const error = new Error('No es posible postularse a una vacante que no está en estado OPEN.');
      error.statusCode = 400;
      throw error;
    }

    // 5. Aplicar Regla de Duplicidad y Restricción de Re-postulación (Sección 8)
    const ultimaPostulacion = await ApplicationRepository.obtenerUltimaPostulacion(candidateId, vacancyId);

    if (ultimaPostulacion) {
      const estadoActual = ultimaPostulacion.estado;

      // Si está en RECEIVED, IN_REVIEW o HIRED -> Bloquear
      if (['RECEIVED', 'IN_REVIEW', 'HIRED'].includes(estadoActual)) {
        const error = new Error(`El candidato ya tiene una postulación en estado '${estadoActual}' para esta vacante.`);
        error.statusCode = 409;
        throw error;
      }

      // Si fue REJECTED -> Verificar transcurso de 30 días
      if (estadoActual === 'REJECTED') {
        const fechaRechazo = new Date(ultimaPostulacion.fecha_ultima_actualizacion || ultimaPostulacion.fecha_creacion);
        const hoy = new Date();
        const diferenciaDias = Math.floor((hoy - fechaRechazo) / (1000 * 60 * 60 * 24));

        if (diferenciaDias < 30) {
          const diasRestantes = 30 - diferenciaDias;
          const error = new Error(
            `Su postulación previa a esta vacante fue REJECTED. Debe esperar ${diasRestantes} día(s) más para poder postularse nuevamente.`
          );
          error.statusCode = 422;
          throw error;
        }
      }
    }

    // 6. Consultar postulaciones activas en otras vacantes
    const postulacionesActivasOtrasVacantes = 
      await ApplicationRepository.contarPostulacionesActivasEnOtrasVacantes(candidateId, vacancyId);

    // 7. Calcular puntaje y prioridad automáticamente
    const { puntaje, prioridad } = PriorityService.calcularPuntajeYPrioridad({
      candidatoAnosExperiencia: candidato.anos_experiencia,
      vacanteAnosMinimos: vacante.anos_minimos_experiencia,
      fuente: source,
      cartaPresentacion: coverLetter,
      postulacionesActivasOtrasVacantes
    });

    // 8 y 9. Registrar postulación en la base de datos con estado 'RECEIVED'
    const insertId = await ApplicationRepository.crear({
      candidatoId: candidateId,
      vacanteId: vacancyId,
      cartaPresentacion: coverLetter,
      fuente: source,
      puntaje,
      prioridad
    });

    return {
      id: insertId,
      candidateId,
      vacancyId,
      source,
      coverLetter: coverLetter || null,
      score: puntaje,
      priority: prioridad,
      status: 'RECEIVED'
    };
  }

  /**
   * Obtiene la lista de postulaciones filtradas y ordenadas.
   */
  static async listarPostulaciones({ status, vacancyId }) {
    if (status && !ESTADOS_PERMITIDOS.includes(status)) {
      const error = new Error(`El estado de filtro '${status}' no es válido.`);
      error.statusCode = 400;
      throw error;
    }

    return await ApplicationRepository.listar({ status, vacancyId });
  }

  /**
   * Actualiza el estado de una postulación existente.
   */
  static async cambiarEstado(id, nuevoEstado) {
    if (!nuevoEstado || !ESTADOS_PERMITIDOS.includes(nuevoEstado)) {
      const error = new Error(`El estado '${nuevoEstado}' no es válido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    // 1. Verificar que la postulación exista
    const postulacion = await ApplicationRepository.obtenerPorId(id);
    if (!postulacion) {
      const error = new Error('La postulación especificada no existe.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verificar que no esté en un estado final
    if (ESTADOS_FINALES.includes(postulacion.estado)) {
      const error = new Error(`No se puede cambiar el estado de una postulación que ya está en estado final '${postulacion.estado}'.`);
      error.statusCode = 422;
      throw error;
    }

    // 3. Actualizar estado
    await ApplicationRepository.actualizarEstado(id, nuevoEstado);

    return {
      id: Number(id),
      previousStatus: postulacion.estado,
      newStatus: nuevoEstado,
      updatedAt: new Date()
    };
  }
}