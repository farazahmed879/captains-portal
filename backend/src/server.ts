import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';

import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import playerRoutes from './routes/playerRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import matchRoutes from './routes/matchRoutes';
import matchPaymentRoutes from './routes/matchPaymentRoutes';
import expenseRoutes from './routes/expenseRoutes';
import sponsorRoutes from './routes/sponsorRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import playerReturnRoutes from './routes/playerReturnRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'Captains Portal API',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/player-returns', playerReturnRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/payments', matchPaymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Captains Portal Backend Server is running on http://localhost:${PORT}`);
});

export default app;
