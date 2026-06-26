// middlewares/requestLogger.js
const logger = require('../utils/logger');

// Fields that must NEVER appear in logs
const SENSITIVE_KEYS = new Set([
    'password', 'currentPassword', 'newPassword', 'confirmPassword',
    'token', 'otp', 'secret', 'twoFactorSecret', 'twoFactorTempSecret',
    'creditCard', 'cardNumber', 'cvv', 'ssn', 'emailOTP'
]);

/**
 * Recursively redact sensitive fields from an object before logging.
 * Returns a new object — never mutates the original.
 */
const redactSensitive = (obj, depth = 0) => {
    if (depth > 5 || obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => redactSensitive(i, depth + 1));

    const redacted = {};
    for (const [key, val] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(key)) {
            redacted[key] = '[REDACTED]';
        } else {
            redacted[key] = redactSensitive(val, depth + 1);
        }
    }
    return redacted;
};

// Auth endpoints where query params should not be logged
const SENSITIVE_URLS = ['/api/auth/', '/api/user/2fa/', '/api/user/export-data'];

module.exports = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const isSensitiveUrl = SENSITIVE_URLS.some(u => (req.originalUrl || req.url).startsWith(u));

        const logData = {
            ip: req.ip || req.connection?.remoteAddress,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            // Only log body/query for non-sensitive endpoints, and always redact
            body: isSensitiveUrl ? '[HIDDEN]' : redactSensitive(req.body),
            query: isSensitiveUrl ? '[HIDDEN]' : redactSensitive(req.query),
        };

        if (statusCode >= 500) {
            logger.error(`Critical Exception: ${req.method} ${logData.url} - ${statusCode}`, { metadata: logData });
        } else if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
            logger.warn(`Security Warning / Access Denied: ${req.method} ${logData.url} - ${statusCode}`, { metadata: logData });
        } else {
            logger.info(`General Traffic: ${req.method} ${logData.url} - ${statusCode}`, { metadata: logData });
        }
    });

    next();
};
