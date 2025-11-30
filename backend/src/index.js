import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatRoutes from './routes/chat.js';
import experimentRoutes from './routes/experiment.js';
import donationRoutes from './routes/donation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/experiment', experimentRoutes);
app.use('/api/donation', donationRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Backend running on port ${process.env.PORT || 3000}`);
});
