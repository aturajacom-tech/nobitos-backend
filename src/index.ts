/**
 * NOBITOS APP — Phase 1 Backend
 * Main Express.js application entry point
 */

import express, { Express } from 'express';
// @ts-ignore
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateConfig, config } from './config/env';
import { initializeDatabase, closeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { auditLogMiddleware } from './middleware/auditLog';
import routes from './routes';

// Load environment variables
dotenv.config();

// Validate configuration
try {
  validateConfig();
} catch (error: any) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Configuration Error:', errorMessage);
  process.exit(1);
}

const app: Express = express();
const PORT = config.PORT;

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(auditLogMiddleware);

// Routes
app.use('/api/v1', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n📍 Shutting down gracefully...');
  try {
    await closeDatabase();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function startServer() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log();
      console.log('='.repeat(60));
      console.log('✅ NOBITOS APP — Phase 1 Backend');
      console.log('='.repeat(60));
      console.log(`📍 Server running on http://localhost:${PORT}`);
      console.log(`📍 API base URL: http://localhost:${PORT}/api/v1`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log('='.repeat(60));
      console.log();
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to start server:', errorMessage);
    process.exit(1);
  }
}

// Only start server if this is the main module
if (require.main === module) {
  startServer();
}

export default app;
