"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = exports.swaggerSpec = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Captains Portal API Documentation',
        version: '1.0.0',
        description: `
**Captains Portal REST API** — Complete backend service for cricket team management, tournaments, matches, squad lineups, player fee tracking, expenses, sponsors, and returns.

### Authentication
Most endpoints require a JSON Web Token (JWT).
1. Authenticate via **\`/api/auth/login\`** or **\`/api/auth/register\`**.
2. Copy the \`token\` from the response.
3. Click the **Authorize** button (top right 🔓) and enter the token (e.g. \`eyJhbGciOi...\`).
    `,
        contact: {
            name: 'Captains Portal Support',
        },
    },
    servers: [
        {
            url: 'http://localhost:5000',
            description: 'Local Development Server',
        },
        {
            url: '/',
            description: 'Current Environment / Host',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT access token directly.',
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Invalid credentials or resource not found' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
                    tenantId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d0' },
                    name: { type: 'string', example: 'Faraz Ahmed' },
                    email: { type: 'string', example: 'captain@example.com' },
                    role: { type: 'string', enum: ['super_admin', 'captain', 'treasurer', 'viewer'], example: 'captain' },
                    phone: { type: 'string', example: '+923001234567' },
                    avatar: { type: 'string', nullable: true },
                    isActive: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'captain@example.com' },
                    password: { type: 'string', format: 'password', example: 'Password123' },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'Faraz Ahmed' },
                    email: { type: 'string', format: 'email', example: 'captain@example.com' },
                    password: { type: 'string', format: 'password', example: 'Password123' },
                    role: { type: 'string', enum: ['captain', 'treasurer', 'viewer'], default: 'captain' },
                    phone: { type: 'string', example: '+923001234567' },
                },
            },
            Player: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
                    name: { type: 'string', example: 'Babar Azam' },
                    phone: { type: 'string', example: '+923001112233' },
                    email: { type: 'string', example: 'babar@example.com' },
                    role: { type: 'string', enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'], example: 'batsman' },
                    battingStyle: { type: 'string', enum: ['right_hand', 'left_hand'], example: 'right_hand' },
                    bowlingStyle: { type: 'string', example: 'right_arm_offbreak' },
                    jerseyNumber: { type: 'integer', example: 56 },
                    profilePhoto: { type: 'string', nullable: true },
                    isRegular: { type: 'boolean', example: true },
                    isActive: { type: 'boolean', example: true },
                    teamIds: { type: 'array', items: { type: 'string' } },
                },
            },
            CreatePlayerInput: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', example: 'Shaheen Afridi' },
                    role: { type: 'string', enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'], default: 'bowler' },
                    battingStyle: { type: 'string', default: 'left_hand' },
                    bowlingStyle: { type: 'string', default: 'left_arm_fast' },
                    jerseyNumber: { type: 'integer', example: 10 },
                    phone: { type: 'string', example: '+923001112244' },
                    email: { type: 'string', example: 'shaheen@example.com' },
                    isRegular: { type: 'boolean', default: true },
                    teamIds: { type: 'array', items: { type: 'string' } },
                },
            },
            Team: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string', example: 'Karachi Kings' },
                    shortName: { type: 'string', example: 'KK' },
                    city: { type: 'string', example: 'Karachi' },
                    primaryColor: { type: 'string', example: '#0284c7' },
                    captainId: { type: 'string' },
                    isActive: { type: 'boolean', example: true },
                },
            },
            Tournament: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string', example: 'Karachi Champions Trophy 2026' },
                    organizer: { type: 'string', example: 'KCCA' },
                    venue: { type: 'string', example: 'National Stadium, Karachi' },
                    format: { type: 'string', example: 'T20' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time', nullable: true },
                    entryFee: { type: 'number', example: 25000 },
                    expectedWinningPrize: { type: 'number', example: 100000 },
                    actualWinningPrizeWon: { type: 'number', example: 0 },
                    status: { type: 'string', enum: ['upcoming', 'ongoing', 'completed', 'knocked_out', 'champions'], example: 'ongoing' },
                },
            },
            Match: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    teamId: { type: 'string' },
                    matchType: { type: 'string', enum: ['friendly', 'tournament'], example: 'tournament' },
                    tournamentId: { type: 'string', nullable: true },
                    matchDate: { type: 'string', format: 'date-time' },
                    opponentTeam: { type: 'string', example: 'Lahore Warriors' },
                    venue: { type: 'string', example: 'Asghar Ali Shah Stadium' },
                    overs: { type: 'integer', example: 20 },
                    groundCost: { type: 'number', example: 12000 },
                    umpireCost: { type: 'number', example: 3000 },
                    ballCost: { type: 'number', example: 2000 },
                    refreshmentCost: { type: 'number', example: 1500 },
                    otherCosts: { type: 'number', example: 500 },
                    totalMatchExpense: { type: 'number', example: 19000 },
                    perPlayerFee: { type: 'number', example: 1500 },
                    squadPlayerIds: { type: 'array', items: { type: 'string' } },
                    result: { type: 'string', enum: ['won', 'lost', 'draw', 'tied', 'upcoming', 'cancelled'], example: 'won' },
                    teamScore: { type: 'string', example: '185/4 (20.0 ov)' },
                    opponentScore: { type: 'string', example: '160/9 (20.0 ov)' },
                    winningPrizeMoney: { type: 'number', example: 10000 },
                },
            },
            Expense: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    teamId: { type: 'string' },
                    tournamentId: { type: 'string', nullable: true },
                    category: { type: 'string', example: 'equipment' },
                    title: { type: 'string', example: 'CA Plus Cricket Balls (Box of 6)' },
                    amount: { type: 'number', example: 7500 },
                    expenseDate: { type: 'string', format: 'date-time' },
                    paidBy: { type: 'string', example: 'Captain' },
                    receiptUrl: { type: 'string', nullable: true },
                    description: { type: 'string', nullable: true },
                },
            },
            Sponsor: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    sponsorName: { type: 'string', example: 'Vertex Logistics' },
                    companyName: { type: 'string', example: 'Vertex Global Corp' },
                    phone: { type: 'string', example: '+923009988776' },
                    email: { type: 'string', example: 'sponsor@vertex.com' },
                    amountInvested: { type: 'number', example: 150000 },
                    returnsPaid: { type: 'number', example: 25000 },
                    contractType: { type: 'string', example: 'general_grant' },
                    status: { type: 'string', enum: ['pledged', 'active', 'completed'], example: 'active' },
                    transactions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                type: { type: 'string', enum: ['investment', 'payout'] },
                                amount: { type: 'number' },
                                date: { type: 'string', format: 'date-time' },
                                method: { type: 'string' },
                                notes: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
            },
            MatchPayment: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    matchId: { type: 'string' },
                    playerId: { type: 'string' },
                    feeAssigned: { type: 'number', example: 1500 },
                    feePaid: { type: 'number', example: 1500 },
                    paymentStatus: { type: 'string', enum: ['paid', 'partial', 'pending'], example: 'paid' },
                    paymentMethod: { type: 'string', example: 'cash' },
                    paymentDate: { type: 'string', format: 'date-time', nullable: true },
                    transactionRef: { type: 'string', nullable: true },
                },
            },
            PlayerReturn: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    playerId: { type: 'string' },
                    amount: { type: 'number', example: 3500 },
                    returnDate: { type: 'string', format: 'date-time' },
                    source: { type: 'string', example: 'prize_money_distribution' },
                    reason: { type: 'string', example: 'Final win incentive' },
                    paymentMethod: { type: 'string', example: 'bank_transfer' },
                },
            },
        },
    },
    paths: {
        '/api/health': {
            get: {
                tags: ['Health'],
                summary: 'Check API server health',
                responses: {
                    200: {
                        description: 'API is online and operational',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'online' },
                                        appName: { type: 'string', example: 'Captains Portal API' },
                                        timestamp: { type: 'string', example: '2026-10-26T08:15:00.000Z' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Log in with email and password',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Authentication successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                                        user: { $ref: '#/components/schemas/User' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Invalid credentials',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                    },
                },
            },
        },
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new captain/team account',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Registration successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        token: { type: 'string' },
                                        user: { $ref: '#/components/schemas/User' },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Email already exists or invalid data',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                    },
                },
            },
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current authenticated user profile',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user profile',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        user: { $ref: '#/components/schemas/User' },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                    },
                },
            },
        },
        '/api/auth/dashboard-settings': {
            put: {
                tags: ['Auth'],
                summary: 'Update user dashboard widget & filter preferences',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    widgets: { type: 'array', items: { type: 'string' } },
                                    selections: { type: 'object' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Preferences updated successfully',
                    },
                },
            },
        },
        '/api/dashboard/stats': {
            get: {
                tags: ['Dashboard'],
                summary: 'Get aggregated financial and team stats for dashboard',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'teamId', in: 'query', schema: { type: 'string' }, description: 'Filter by specific team' },
                    { name: 'tournamentId', in: 'query', schema: { type: 'string' }, description: 'Filter by tournament' },
                ],
                responses: {
                    200: {
                        description: 'Financial metrics and team statistics',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/players': {
            get: {
                tags: ['Players'],
                summary: 'Get all players in tenant roster',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'role', in: 'query', schema: { type: 'string' }, description: 'Filter by role' },
                    { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or contact' },
                ],
                responses: {
                    200: {
                        description: 'List of players',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Player' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Players'],
                summary: 'Add a new player to the roster',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreatePlayerInput' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Player created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { $ref: '#/components/schemas/Player' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/players/{id}': {
            get: {
                tags: ['Players'],
                summary: 'Get player details by ID',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: {
                        description: 'Player profile with matches and payment ledger',
                    },
                    404: {
                        description: 'Player not found',
                    },
                },
            },
            put: {
                tags: ['Players'],
                summary: 'Update player profile',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreatePlayerInput' },
                        },
                    },
                },
                responses: {
                    200: { description: 'Player updated successfully' },
                },
            },
            delete: {
                tags: ['Players'],
                summary: 'Delete player',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Player removed successfully' },
                },
            },
        },
        '/api/players/{id}/profile': {
            get: {
                tags: ['Players'],
                summary: 'Get complete player financial and match summary profile',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Comprehensive player summary' },
                },
            },
        },
        '/api/teams': {
            get: {
                tags: ['Teams'],
                summary: 'Get all teams',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of teams',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Team' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Teams'],
                summary: 'Create a new team',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'shortName'],
                                properties: {
                                    name: { type: 'string', example: 'Karachi Kings' },
                                    shortName: { type: 'string', example: 'KK' },
                                    city: { type: 'string', example: 'Karachi' },
                                    primaryColor: { type: 'string', example: '#0284c7' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Team created successfully' },
                },
            },
        },
        '/api/teams/{id}': {
            get: {
                tags: ['Teams'],
                summary: 'Get team details by ID',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Team details' },
                },
            },
            put: {
                tags: ['Teams'],
                summary: 'Update team details',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Team updated successfully' },
                },
            },
            delete: {
                tags: ['Teams'],
                summary: 'Delete team',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Team deleted' },
                },
            },
        },
        '/api/tournaments': {
            get: {
                tags: ['Tournaments'],
                summary: 'Get all tournaments',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of tournaments',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Tournament' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Tournaments'],
                summary: 'Create a new tournament',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['teamId', 'name', 'startDate'],
                                properties: {
                                    teamId: { type: 'string' },
                                    name: { type: 'string', example: 'Ramadan Night Cup 2026' },
                                    organizer: { type: 'string', example: 'City Sports' },
                                    venue: { type: 'string', example: 'TMC Ground' },
                                    format: { type: 'string', default: 'T20' },
                                    startDate: { type: 'string', format: 'date' },
                                    entryFee: { type: 'number', example: 20000 },
                                    expectedWinningPrize: { type: 'number', example: 80000 },
                                    status: { type: 'string', enum: ['upcoming', 'ongoing', 'completed', 'knocked_out', 'champions'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Tournament created' },
                },
            },
        },
        '/api/tournaments/{id}': {
            get: {
                tags: ['Tournaments'],
                summary: 'Get tournament by ID with all related matches',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Tournament details and match fixtures' },
                },
            },
            put: {
                tags: ['Tournaments'],
                summary: 'Update tournament status and prize details',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Tournament updated successfully' },
                },
            },
            delete: {
                tags: ['Tournaments'],
                summary: 'Delete tournament',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Tournament deleted' },
                },
            },
        },
        '/api/matches': {
            get: {
                tags: ['Matches'],
                summary: 'Get all matches with optional filters',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'teamId', in: 'query', schema: { type: 'string' } },
                    { name: 'tournamentId', in: 'query', schema: { type: 'string' } },
                    { name: 'matchType', in: 'query', schema: { type: 'string', enum: ['friendly', 'tournament'] } },
                ],
                responses: {
                    200: {
                        description: 'List of matches',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Match' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Matches'],
                summary: 'Schedule a match and auto-generate player payment fee records',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['teamId', 'opponentTeam', 'venue', 'matchDate', 'overs'],
                                properties: {
                                    teamId: { type: 'string' },
                                    matchType: { type: 'string', enum: ['friendly', 'tournament'], default: 'friendly' },
                                    tournamentId: { type: 'string' },
                                    opponentTeam: { type: 'string', example: 'Islamabad Stars' },
                                    venue: { type: 'string', example: 'National Stadium' },
                                    matchDate: { type: 'string', format: 'date-time' },
                                    overs: { type: 'integer', default: 20 },
                                    groundCost: { type: 'number', example: 12000 },
                                    umpireCost: { type: 'number', example: 3000 },
                                    ballCost: { type: 'number', example: 2000 },
                                    refreshmentCost: { type: 'number', example: 1500 },
                                    otherCosts: { type: 'number', example: 500 },
                                    perPlayerFee: { type: 'number', example: 1500 },
                                    squadPlayerIds: { type: 'array', items: { type: 'string' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Match scheduled' },
                },
            },
        },
        '/api/matches/{id}': {
            get: {
                tags: ['Matches'],
                summary: 'Get match details, squad, score, and payment status',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Match details with payments' },
                },
            },
            put: {
                tags: ['Matches'],
                summary: 'Update match score, expenses, result, or squad',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Match updated successfully' },
                },
            },
            delete: {
                tags: ['Matches'],
                summary: 'Delete match and cascade remove fee allocations',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Match deleted' },
                },
            },
        },
        '/api/payments': {
            post: {
                tags: ['Match Payments'],
                summary: 'Create or record an individual player match payment',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['matchId', 'playerId'],
                                properties: {
                                    matchId: { type: 'string' },
                                    playerId: { type: 'string' },
                                    feeAssigned: { type: 'number', example: 1500 },
                                    feePaid: { type: 'number', example: 1500 },
                                    paymentStatus: { type: 'string', enum: ['paid', 'partial', 'pending'], default: 'paid' },
                                    paymentMethod: { type: 'string', default: 'cash' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Payment recorded' },
                },
            },
        },
        '/api/payments/bulk': {
            put: {
                tags: ['Match Payments'],
                summary: 'Bulk update fee status for multiple squad members',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['updates'],
                                properties: {
                                    updates: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['id'],
                                            properties: {
                                                id: { type: 'string' },
                                                feePaid: { type: 'number' },
                                                paymentStatus: { type: 'string', enum: ['paid', 'partial', 'pending'] },
                                                paymentMethod: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Bulk payment statuses updated' },
                },
            },
        },
        '/api/payments/{id}': {
            put: {
                tags: ['Match Payments'],
                summary: 'Update single payment allocation',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Payment updated' },
                },
            },
            delete: {
                tags: ['Match Payments'],
                summary: 'Delete payment record',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Payment record deleted' },
                },
            },
        },
        '/api/expenses': {
            get: {
                tags: ['Expenses'],
                summary: 'Get all team expenses',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'teamId', in: 'query', schema: { type: 'string' } },
                    { name: 'tournamentId', in: 'query', schema: { type: 'string' } },
                    { name: 'category', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    200: {
                        description: 'List of expenses',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Expenses'],
                summary: 'Log a new team or tournament expense',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['teamId', 'title', 'amount'],
                                properties: {
                                    teamId: { type: 'string' },
                                    tournamentId: { type: 'string' },
                                    category: { type: 'string', example: 'equipment' },
                                    title: { type: 'string', example: 'Team Kit Shirts (x15)' },
                                    amount: { type: 'number', example: 18000 },
                                    expenseDate: { type: 'string', format: 'date-time' },
                                    paidBy: { type: 'string', default: 'Captain' },
                                    description: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Expense recorded' },
                },
            },
        },
        '/api/expenses/{id}': {
            put: {
                tags: ['Expenses'],
                summary: 'Update an existing expense',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Expense updated' },
                },
            },
            delete: {
                tags: ['Expenses'],
                summary: 'Delete expense record',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Expense deleted' },
                },
            },
        },
        '/api/sponsors': {
            get: {
                tags: ['Sponsors'],
                summary: 'Get all sponsor contracts & ledgers',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'teamId', in: 'query', schema: { type: 'string' } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['pledged', 'active', 'completed'] } },
                ],
                responses: {
                    200: {
                        description: 'List of sponsors',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/Sponsor' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Sponsors'],
                summary: 'Add a new sponsor and contract',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['teamId', 'sponsorName', 'amountInvested'],
                                properties: {
                                    teamId: { type: 'string' },
                                    sponsorName: { type: 'string', example: 'Crown Lubricants' },
                                    companyName: { type: 'string', example: 'Crown Group' },
                                    phone: { type: 'string', example: '+923331234567' },
                                    amountInvested: { type: 'number', example: 100000 },
                                    contractType: { type: 'string', default: 'general_grant' },
                                    status: { type: 'string', default: 'active' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Sponsor created' },
                },
            },
        },
        '/api/sponsors/{id}': {
            get: {
                tags: ['Sponsors'],
                summary: 'Get sponsor by ID with full transaction history',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Sponsor details' },
                },
            },
            put: {
                tags: ['Sponsors'],
                summary: 'Update sponsor contract or details',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Sponsor updated' },
                },
            },
            delete: {
                tags: ['Sponsors'],
                summary: 'Delete sponsor',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Sponsor deleted' },
                },
            },
        },
        '/api/sponsors/{id}/transactions': {
            post: {
                tags: ['Sponsors'],
                summary: 'Add an investment top-up or return payout to sponsor ledger',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['type', 'amount'],
                                properties: {
                                    type: { type: 'string', enum: ['investment', 'payout'] },
                                    amount: { type: 'number', example: 25000 },
                                    method: { type: 'string', default: 'bank_transfer' },
                                    reference: { type: 'string', example: 'TXN-98231' },
                                    notes: { type: 'string', example: 'Dividend payout from tournament prize' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Transaction recorded' },
                },
            },
        },
        '/api/player-returns': {
            get: {
                tags: ['Player Returns'],
                summary: 'Get player return/refund history',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'playerId', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    200: {
                        description: 'List of player return disbursements',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { type: 'array', items: { $ref: '#/components/schemas/PlayerReturn' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Player Returns'],
                summary: 'Record a prize disbursement, refund, or incentive return to a player',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['playerId', 'amount'],
                                properties: {
                                    playerId: { type: 'string' },
                                    amount: { type: 'number', example: 3500 },
                                    source: { type: 'string', example: 'prize_money_distribution' },
                                    reason: { type: 'string', example: 'Man of the Match reward share' },
                                    paymentMethod: { type: 'string', default: 'cash' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Player return disbursed' },
                },
            },
        },
        '/api/users': {
            get: {
                tags: ['Users'],
                summary: 'List all tenant users (Super Admin only)',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: 'List of users' },
                    403: { description: 'Requires Super Admin privileges' },
                },
            },
            post: {
                tags: ['Users'],
                summary: 'Create a new user account (Super Admin only)',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                        },
                    },
                },
                responses: {
                    201: { description: 'User created' },
                },
            },
        },
        '/api/users/{id}/role': {
            patch: {
                tags: ['Users'],
                summary: 'Change user role (Super Admin only)',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['role'],
                                properties: {
                                    role: { type: 'string', enum: ['super_admin', 'captain', 'treasurer', 'viewer'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Role updated' },
                },
            },
        },
        '/api/users/{id}/status': {
            patch: {
                tags: ['Users'],
                summary: 'Toggle active status of a user (Super Admin only)',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Status updated' },
                },
            },
        },
    },
};
const swaggerCustomOptions = {
    customSiteTitle: 'Captains Portal API Docs',
    customCss: `
    .swagger-ui .topbar { display: flex; align-items: center; background-color: #0f172a; border-bottom: 2px solid #0284c7; }
    .swagger-ui .topbar-wrapper img { content: url('https://raw.githubusercontent.com/swagger-api/swagger-ui/master/dist/favicon-32x32.png'); }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #0284c7; font-weight: 700; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
  `,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'list',
    },
};
const setupSwagger = (app) => {
    // Raw JSON spec endpoint
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(exports.swaggerSpec);
    });
    // Interactive Swagger UI endpoints
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(exports.swaggerSpec, swaggerCustomOptions));
    app.use('/docs', (req, res) => {
        res.redirect('/api/docs');
    });
};
exports.setupSwagger = setupSwagger;
