"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.LoggerError = exports.createLogMetadata = exports.LOG_LEVELS = void 0;
// Log levels
exports.LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Helper function to create log metadata with request context
var createLogMetadata = function (req, additionalData) {
    var _a;
    if (additionalData === void 0) { additionalData = {}; }
    return (__assign({ requestId: req === null || req === void 0 ? void 0 : req.id, userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id, path: req === null || req === void 0 ? void 0 : req.path, method: req === null || req === void 0 ? void 0 : req.method, ip: req === null || req === void 0 ? void 0 : req.ip, userAgent: req === null || req === void 0 ? void 0 : req.get('user-agent') }, additionalData));
};
exports.createLogMetadata = createLogMetadata;
// Error types
var LoggerError = /** @class */ (function (_super) {
    __extends(LoggerError, _super);
    function LoggerError(message, code, context) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.context = context;
        _this.name = 'LoggerError';
        return _this;
    }
    return LoggerError;
}(Error));
exports.LoggerError = LoggerError;
// Default configuration
exports.DEFAULT_CONFIG = {
    logDir: 'logs',
    level: 'info',
    maxFileSize: '20m',
    maxFiles: '14d',
    compressArchive: true,
    flushInterval: 5000,
    maxQueueSize: 10000,
    retryDelays: [1000, 2000, 5000],
    memoryThreshold: 0.85,
    memoryCheckInterval: 60000,
};
