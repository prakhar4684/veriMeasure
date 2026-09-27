import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api.router.js';
import { initDb } from './db/db.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'VeriMeasure Legal Metrology Platform API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// Central Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Initialize database & start server
async function start() {
  try {
    await initDb();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 VeriMeasure Legal Metrology API Server listening at http://localhost:${PORT}`);
      console.log(`📡 Healthcheck: http://localhost:${PORT}/health`);
      console.log(`🔒 QuickVerify QR Public Verification: http://localhost:${PORT}/api/v1/certificates/public/verify/QR-CERT-LM-2026-889102`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

start();
