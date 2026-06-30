import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Base endpoints
app.use('/api/auth', authRoutes);
app.use('/api', dataRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Zenith AI Productivity API Server is running.' });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Express Error Handler caught:', err);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server listening on port ${PORT}`);
});
