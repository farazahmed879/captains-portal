"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./config/db");
const prisma_1 = require("./config/prisma");
const errorHandler_1 = require("./middlewares/errorHandler");
const swagger_1 = require("./config/swagger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const playerRoutes_1 = __importDefault(require("./routes/playerRoutes"));
const tournamentRoutes_1 = __importDefault(require("./routes/tournamentRoutes"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const matchPaymentRoutes_1 = __importDefault(require("./routes/matchPaymentRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const sponsorRoutes_1 = __importDefault(require("./routes/sponsorRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const playerReturnRoutes_1 = __importDefault(require("./routes/playerReturnRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to Database (Mongoose & Prisma)
(0, db_1.connectDB)();
(0, prisma_1.connectPrisma)();
// Middlewares
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
// Swagger API Documentation
(0, swagger_1.setupSwagger)(app);
// API Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        appName: 'Captains Portal API',
        timestamp: new Date().toISOString(),
    });
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/teams', teamRoutes_1.default);
app.use('/api/players', playerRoutes_1.default);
app.use('/api/player-returns', playerReturnRoutes_1.default);
app.use('/api/tournaments', tournamentRoutes_1.default);
app.use('/api/matches', matchRoutes_1.default);
app.use('/api/payments', matchPaymentRoutes_1.default);
app.use('/api/expenses', expenseRoutes_1.default);
app.use('/api/sponsors', sponsorRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});
// Centralized Global Error Handler
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Captains Portal Backend Server is running on http://localhost:${PORT}`);
    console.log(`📑 Swagger Documentation available at http://localhost:${PORT}/api/docs`);
});
exports.default = app;
