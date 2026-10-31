/**
 * Authentication Guard Middleware
 * Security: ป้องกัน API Routes ที่ต้องการสิทธิ์ Admin/เหรัญญิก
 * ตรวจสอบว่า request มาจากผู้ที่ผ่านการ login แล้วจริง
 * 
 * Note: ระบบนี้ใช้ Simple Session Token ผ่าน Header
 * สำหรับ production ควรอัปเกรดเป็น JWT หรือ express-session + secure cookies
 */

const rateLimit = require('express-rate-limit');

// Security: Rate Limiter เฉพาะ Login routes (เข้มข้นกว่า global limiter)
// ป้องกัน Brute-force password guessing
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // จำกัดเพียง 10 ครั้ง ต่อ 15 นาที ต่อ IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'พยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในอีก 15 นาที'
  }
});

// In-memory admin session store
// ในระบบ production จริง ควรเปลี่ยนเป็น Redis หรือ Database session store
const adminSessions = new Map();

/**
 * สร้าง session token สำหรับ admin ที่ login สำเร็จ
 * @param {Object} admin - Admin data object
 * @returns {string} session token
 */
function createAdminSession(admin) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    adminId: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    createdAt: Date.now()
  });
  return token;
}

/**
 * ลบ session token (Logout)
 * @param {string} token
 */
function destroyAdminSession(token) {
  adminSessions.delete(token);
}

/**
 * Middleware: ตรวจสอบสิทธิ์ Admin ก่อนเข้าถึง Protected Routes
 * ตรวจ Header: Authorization: Bearer <token>
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'กรุณาเข้าสู่ระบบเหรัญญิกก่อนดำเนินการ'
    });
  }

  const token = authHeader.slice(7);
  const session = adminSessions.get(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
    });
  }

  // Session timeout: 8 ชม. (เหมาะสมสำหรับ working day)
  const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > SESSION_TIMEOUT_MS) {
    adminSessions.delete(token);
    return res.status(401).json({
      success: false,
      error: 'Session หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่'
    });
  }

  // แนบข้อมูล admin ลงใน request สำหรับใช้ใน controller
  req.admin = session;
  next();
}

/**
 * ทำความสะอาด sessions ที่หมดอายุ (ทุก 1 ชั่วโมง)
 * ป้องกัน memory leak จาก sessions สะสม
 */
setInterval(() => {
  const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT_MS) {
      adminSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  requireAdmin,
  createAdminSession,
  destroyAdminSession,
  loginRateLimiter
};
