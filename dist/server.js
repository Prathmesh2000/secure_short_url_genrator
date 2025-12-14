"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./services/db"));
const healthCheckRoutes_1 = __importDefault(require("./routes/healthCheckRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const shortUrlRoutes_1 = __importDefault(require("./routes/shortUrlRoutes"));
const errorsHandler_1 = require("./http/errorsHandler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
app.use('/health', healthCheckRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/short-url', shortUrlRoutes_1.default);
// Error handler must be registered after all routes
app.use(errorsHandler_1.errorHandler);
let server;
async function start() {
    await db_1.default.query('SELECT 1');
    console.log('[DB] connected');
    server = app.listen(PORT, () => {
        console.log(`[SERVER] listening on ${PORT}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error('PORT IN USE');
            process.exit(1);
        }
    });
}
async function shutdown(signal) {
    console.log(`Shutdown: ${signal}`);
    if (server) {
        server.close(() => process.exit(0));
    }
    else {
        process.exit(0);
    }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);
process.on('exit', shutdown);
start();
