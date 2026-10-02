export class ApiResponse {
    static success(res, data, message = 'Operación exitosa', statusCode = 200) {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  
    static error(res, message = 'Error interno del servidor', statusCode = 500, errors = null) {
      return res.status(statusCode).json({
        success: false,
        message,
        errors
      });
    }
  }