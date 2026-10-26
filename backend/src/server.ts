import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { connectPrisma } from './config/prisma';
import { errorHandler } from './middlewares/errorHandler';
import { setupSwagger } from './config/swagger';

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
import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (Mongoose & Prisma)
connectDB();
connectPrisma();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Swagger API Documentation
setupSwagger(app);

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
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Centralized Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Captains Portal Backend Server is running on http://localhost:${PORT}`);
  console.log(`📑 Swagger Documentation available at http://localhost:${PORT}/api/docs`);
});

export default app;
