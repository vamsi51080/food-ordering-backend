const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/+$/, '');
const configuredOrigins = [
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean),
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, health checks)
    if (!origin) {
      return callback(null, true);
    }

    const requestOrigin = normalizeOrigin(origin);
    const isExplicitlyAllowed = configuredOrigins.includes(requestOrigin);
    let isRenderDomain = false;

    try {
      isRenderDomain = /\.onrender\.com$/i.test(new URL(requestOrigin).hostname);
    } catch (error) {
      isRenderDomain = false;
    }

    if (isExplicitlyAllowed || isRenderDomain) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Anytime Stop API',
    version: '1.0.0',
    endpoints: {
      menu: '/api/menu',
      orders: '/api/orders',
      admin: '/api/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should be running on http://localhost:3000`);
});
