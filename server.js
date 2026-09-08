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

// Middleware
app.use(cors({ origin: true, credentials: true }));
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
