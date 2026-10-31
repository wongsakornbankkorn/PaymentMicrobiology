/**
 * CPE Department Treasury & Student Payment Tracking System (DeptTreasury)
 * Main Backend Server
 * Adheres strictly to project rules and guidelines:
 * - /config, /controllers, /routes, /models
 * - Single Responsibility, Parameterized queries, No Hardcoding
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rosterRoutes = require('./routes/rosterRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: HTTP headers hardening via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Security: CORS จำกัดเฉพาะ origin ที่อนุญาต (ไม่ใช่ origin: true ที่เปิดทุก origin)
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // อนุญาต requests ที่ไม่มี origin (เช่น mobile apps, curl) เฉพาะ dev mode
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Security: Rate Limiting ป้องกัน Brute-force และ DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 300, // จำกัด 300 requests ต่อ 15 นาที ต่อ IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'คำขอมากเกินไป กรุณาลองใหม่ในอีก 15 นาที' }
});
app.use(globalLimiter);

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads', 'slips');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded slips statically for preview
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'CPE Department Treasury API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/roster', rosterRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(` DeptTreasury API Server running on port ${PORT}`);
  console.log(` Local Endpoint: http://localhost:${PORT}`);
  console.log(`=======================================================`);
  
  // Test MySQL connection on startup
  await testConnection();
});
