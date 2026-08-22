import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import conversationsRouter from './routes/conversations.js';
import handoffsRouter from './routes/handoffs.js';
import providersRouter from './routes/providers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/conversations', conversationsRouter);
app.use('/api/conversations', handoffsRouter);
app.use('/api/providers', providersRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ContextBridge API Server'
  });
});

// Serve frontend static build in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback for SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next();
    });
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`ContextBridge Server running on http://localhost:${PORT}`);
  console.log(`- Claude Mode: ${process.env.ANTHROPIC_API_KEY ? 'Live API' : 'Demo Mode (Simulation)'}`);
  console.log(`- Gemini Mode: ${process.env.GEMINI_API_KEY ? 'Live API' : 'Demo Mode (Simulation)'}`);
});
