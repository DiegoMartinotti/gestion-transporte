class ApiResponse {
  static success(res, data, message = 'Operación exitosa', status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'Error en la operación', status = 400, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(status).json(response);
  }
}

module.exports = ApiResponse;
