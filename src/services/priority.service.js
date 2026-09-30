/**
 * Servicio encargado de la lógica de negocio para la evaluación,
 * cálculo de puntaje y asignación de prioridad de una postulación.
 */
export class PriorityService {
    /**
     * Evalúa los factores de una postulación y retorna el puntaje y prioridad calculados.
     * 
     * @param {Object} params
     * @param {number} params.candidatoAnosExperiencia - Años de experiencia del candidato
     * @param {number} params.vacanteAnosMinimos - Años mínimos requeridos por la vacante
     * @param {string} params.fuente - Fuente de la postulación ('REFERRAL', 'INTERNAL', 'JOB_BOARD', 'OTHER')
     * @param {string} [params.cartaPresentacion=''] - Texto de la carta de presentación
     * @param {number} params.postulacionesActivasOtrasVacantes - Cantidad de postulaciones activas en otras vacantes
     * @returns {{ puntaje: number, prioridad: string }}
     */
    static calcularPuntajeYPrioridad({
      candidatoAnosExperiencia,
      vacanteAnosMinimos,
      fuente,
      cartaPresentacion = '',
      postulacionesActivasOtrasVacantes = 0
    }) {
      let puntaje = 0;
  
      // Regla 1: Años de experiencia igual o superior a los exigidos (+4)
      if (candidatoAnosExperiencia >= vacanteAnosMinimos) {
        puntaje += 4;
      }
  
      // Regla 2: Fuente de postulación (REFERRAL +3, INTERNAL +2)
      if (fuente === 'REFERRAL') {
        puntaje += 3;
      } else if (fuente === 'INTERNAL') {
        puntaje += 2;
      }
  
      // Regla 3: Carta de presentación contiene "node", "sql" o "api" (+2, insensible a mayúsculas/minúsculas, aplica una sola vez)
      const palabrasClave = ['node', 'sql', 'api'];
      const cartaMinusculas = cartaPresentacion.toLowerCase();
      const contienePalabraClave = palabrasClave.some(palabra => cartaMinusculas.includes(palabra));
      
      if (contienePalabraClave) {
        puntaje += 2;
      }
  
      // Regla 4: Carta de presentación con más de 500 caracteres (+1)
      if (cartaPresentacion.length > 500) {
        puntaje += 1;
      }
  
      // Regla 5: Candidato con 3 o más postulaciones activas en otras vacantes (-2)
      if (postulacionesActivasOtrasVacantes >= 3) {
        puntaje -= 2;
      }
  
      // Límite inferior: El puntaje total nunca puede ser negativo
      if (puntaje < 0) {
        puntaje = 0;
      }
  
      // Determinación de la prioridad según la escala
      const prioridad = this.determinarPrioridad(puntaje);
  
      return {
        puntaje,
        prioridad
      };
    }
  
    /**
     * Determina la categoría de prioridad a partir del puntaje acumulado.
     * 
     * @param {number} puntaje 
     * @returns {string} LOW | MEDIUM | HIGH | TOP
     */
    static determinarPrioridad(puntaje) {
      if (puntaje <= 2) {
        return 'LOW';
      }
      if (puntaje <= 4) {
        return 'MEDIUM';
      }
      if (puntaje <= 6) {
        return 'HIGH';
      }
      return 'TOP';
    }
  }