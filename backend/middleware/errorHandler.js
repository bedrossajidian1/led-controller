// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Hardware initialization errors
  if (err.message && err.message.includes('Hardware not initialized')) {
    return res.status(503).json({
      error: 'Hardware not initialized',
      message: 'The LED controller hardware is not ready. Please check the system.',
    });
  }

  // GPIO errors
  if (err.message && err.message.includes('GPIO')) {
    return res.status(500).json({
      error: 'GPIO error',
      message: err.message,
    });
  }

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message || 'Invalid request',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

