module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ECTRACC Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};
