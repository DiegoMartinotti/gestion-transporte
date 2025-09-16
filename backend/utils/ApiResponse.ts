import { Response } from 'express';

class ApiResponse {
  static success(
    res: Response,
    data: unknown,
    message: string = 'Operación exitosa',
    status: number = 200
  ): Response {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string = 'Error en la operación',
    status: number = 400,
    errors: Record<string, unknown> | null = null
  ): Response {
    const response: {
      success: boolean;
      message: string;
      errors?: Record<string, unknown> | null;
    } = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(status).json(response);
  }
}

export default ApiResponse;
