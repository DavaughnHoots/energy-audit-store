"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.dbConfig = void 0;
var pg_1 = __importDefault(require("pg"));
var logger_js_1 = require("./logger.js");
var Pool = pg_1.default.Pool;
// Parse DATABASE_URL for Heroku
var parseDbUrl = function (url) {
    var pattern = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    var matches = url.match(pattern);
    if (!matches) {
        throw new Error('Invalid DATABASE_URL format');
    }
    var user = matches[1], password = matches[2], host = matches[3], port = matches[4], database = matches[5];
    return {
        user: user,
        password: password,
        host: host,
        port: parseInt(port),
        database: database,
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: false
        } : undefined,
        max: parseInt(process.env.DB_POOL_SIZE || '20'),
        idleTimeoutMillis: 30000
    };
};
// Configure database connection based on environment
exports.dbConfig = process.env.DATABASE_URL
    ? parseDbUrl(process.env.DATABASE_URL)
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'postgres',
        max: parseInt(process.env.DB_POOL_SIZE || '20'),
        idleTimeoutMillis: 30000,
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: false
        } : undefined
    };
// Log database configuration (without sensitive data)
logger_js_1.appLogger.info('Database configuration:', {
    host: exports.dbConfig.host,
    port: exports.dbConfig.port,
    database: exports.dbConfig.database,
    user: exports.dbConfig.user,
    max: exports.dbConfig.max,
    ssl: !!exports.dbConfig.ssl
});
// Create a mock pool for development/testing when DB is not available
var MockPool = /** @class */ (function () {
    function MockPool() {
    }
    MockPool.prototype.query = function (text, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger_js_1.appLogger.warn("Mock DB query: ".concat(text), { params: params });
                // Return mock data based on the query
                if (text.includes('SELECT NOW()')) {
                    return [2 /*return*/, { rows: [{ now: new Date() }] }];
                }
                return [2 /*return*/, { rows: [] }];
            });
        });
    };
    MockPool.prototype.on = function (event, callback) {
        // Do nothing
    };
    MockPool.prototype.end = function () {
        // Do nothing
    };
    return MockPool;
}());
var pool;
try {
    // Create a pool instance to be used across the application
    exports.pool = pool = new Pool(exports.dbConfig);
    // Log pool errors
    pool.on('error', function (err) {
        logger_js_1.appLogger.error('Unexpected error on idle client', (0, logger_js_1.createLogMetadata)(undefined, { error: err }));
        // Don't exit the process, just log the error
    });
    // Test database connection
    pool.query('SELECT NOW()', function (err) {
        if (err) {
            logger_js_1.appLogger.error('Error connecting to the database, using mock implementation', (0, logger_js_1.createLogMetadata)(undefined, { error: err }));
            exports.pool = pool = new MockPool();
        }
        else {
            logger_js_1.appLogger.info('Successfully connected to the database');
        }
    });
}
catch (error) {
    logger_js_1.appLogger.error('Failed to initialize database pool, using mock implementation', (0, logger_js_1.createLogMetadata)(undefined, { error: error }));
    exports.pool = pool = new MockPool();
}
exports.default = pool;
