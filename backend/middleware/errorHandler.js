const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Error de duplicado',
      details: 'Ya existe un registro con esos datos únicos'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
};

module.exports = errorHandler;
