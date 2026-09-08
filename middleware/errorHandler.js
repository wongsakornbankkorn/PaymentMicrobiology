/**
 * Global Error Handler Middleware
 * Rule 8: Prevents backend crashes, logs diagnostic info, and sends friendly JSON messages.
 */

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Handle Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 10MB)'
    });
  }

  // Handle Multer unexpected field or custom fileFilter errors
  if (err.name === 'MulterError' || err.message.includes('ประเภทไฟล์ไม่ถูกต้อง')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Default internal server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
