import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger, requestLogger } from './lib/logger';
import routes from './routes';
import prisma from './lib/prisma';
import { globalLimiter } from './middleware/rateLimiters';
import { corsOptions } from './middleware/corsOptions';

const mask = (value?: string | null) =>
  value ? `${value.substring(0, 6)}...` : undefined;

// Create Express app
const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

logger.info('[startup] environment configuration', {
  nodeEnv: process.env.NODE_ENV,
  portEnv: process.env.PORT,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonSet: !!process.env.SUPABASE_ANON_KEY,
  supabaseAnonPreview: mask(process.env.SUPABASE_ANON_KEY),
  supabaseServiceSet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseServicePreview: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
  corsOrigins: process.env.CORS_ORIGINS,
});

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.isDevelopment ? false : undefined,
}));

// Compression middleware
app.use(compression());

// Rate limiting (apply to API routes only)
app.use('/api', globalLimiter);

// CORS configuration
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'welcome to the Proven API' });
});


// API routes
app.use('/api', routes);

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(error.status || 500).json({
    success: false,
    message: config.isDevelopment ? error.message : 'Internal server error',
    ...(config.isDevelopment && { stack: error.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  // Close database connections
  await prisma.$disconnect();
  
  // Close server
  process.exit(0);
};

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
