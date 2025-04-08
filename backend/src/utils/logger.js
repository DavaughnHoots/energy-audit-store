"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.winstonLogger = exports.appLogger = exports.LoggerInitializer = exports.loggerContextMiddleware = exports.createLogMetadata = void 0;
var winston_1 = __importDefault(require("winston"));
var winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var async_hooks_1 = require("async_hooks");
var logger_js_1 = require("../types/logger.js");
// Create the logger instance
var logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || logger_js_1.DEFAULT_CONFIG.level,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata(), winston_1.default.format.json()),
    transports: [
        new winston_daily_rotate_file_1.default({
            dirname: path_1.default.join(process.cwd(), logger_js_1.DEFAULT_CONFIG.logDir),
            filename: '%DATE%-app.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: logger_js_1.DEFAULT_CONFIG.compressArchive,
            maxSize: logger_js_1.DEFAULT_CONFIG.maxFileSize,
            maxFiles: logger_js_1.DEFAULT_CONFIG.maxFiles,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.simple()),
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        })
    ]
});
// Helper function to create log metadata with request context
var createLogMetadata = function (req, additionalData) {
    var _a;
    if (additionalData === void 0) { additionalData = {}; }
    return (__assign({ requestId: req === null || req === void 0 ? void 0 : req.id, userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id, path: req === null || req === void 0 ? void 0 : req.path, method: req === null || req === void 0 ? void 0 : req.method, ip: req === null || req === void 0 ? void 0 : req.ip, userAgent: req === null || req === void 0 ? void 0 : req.get('user-agent') }, additionalData));
};
exports.createLogMetadata = createLogMetadata;
// Create logger wrapper with type safety
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.prototype.error = function (message, metadata, error) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = metadata || {};
                logger.error(message, __assign(__assign({}, meta), { error: error instanceof Error ? error.stack : String(error) }));
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.warn = function (message, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = metadata || {};
                logger.warn(message, meta);
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.info = function (message, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = metadata || {};
                logger.info(message, meta);
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.http = function (message, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = metadata || {};
                logger.http(message, meta);
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.debug = function (message, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = metadata || {};
                logger.debug(message, meta);
                return [2 /*return*/];
            });
        });
    };
    Logger.prototype.audit = function (action, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = metadata || {};
                logger.info("AUDIT: ".concat(action), __assign(__assign({}, meta), { audit: true, timestamp: new Date().toISOString() }));
                return [2 /*return*/];
            });
        });
    };
    return Logger;
}());
// Create AsyncLocalStorage instance for request context
var asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
// Add context middleware
var loggerContextMiddleware = function (req, res, next) {
    var _a;
    try {
        var context = {
            requestId: req.id,
            userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        asyncLocalStorage.run(context, function () {
            next();
        });
    }
    catch (error) {
        console.error('Error in logger context middleware:', error);
        next();
    }
};
exports.loggerContextMiddleware = loggerContextMiddleware;
// Initialize logger with proper lifecycle management
var LoggerInitializer = /** @class */ (function () {
    function LoggerInitializer() {
    }
    LoggerInitializer.initialize = function () {
        if (this.isInitialized) {
            return;
        }
        // Ensure log directory exists
        if (!fs_1.default.existsSync(logger_js_1.DEFAULT_CONFIG.logDir)) {
            fs_1.default.mkdirSync(logger_js_1.DEFAULT_CONFIG.logDir, { recursive: true });
        }
        // Check for write permissions
        try {
            fs_1.default.accessSync(logger_js_1.DEFAULT_CONFIG.logDir, fs_1.default.constants.W_OK);
        }
        catch (error) {
            console.error('Cannot write to log directory:', error);
            process.exit(1);
        }
        this.isInitialized = true;
    };
    LoggerInitializer.isInitialized = false;
    return LoggerInitializer;
}());
exports.LoggerInitializer = LoggerInitializer;
// Initialize logger before creating instance
LoggerInitializer.initialize();
// Export singleton instance
exports.appLogger = new Logger();
// Export winston logger for advanced usage if needed
exports.winstonLogger = logger;
