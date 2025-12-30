import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatRoutes from './routes/chat.js';
import experimentRoutes from './routes/experiment.js';
import donationRoutes from './routes/donation.js';
import runMigrations from './config/migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const app = express();

// CORS: Allow production frontend + localhost for testing
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8000',
  'http://127.0.0.1:8000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/experiment', experimentRoutes);
app.use('/api/donation', donationRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function start() {
  try {
    // Skip migrations for local testing (tables already exist in production DB)
    // await runMigrations();
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Backend running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
