// middlewares/auditLogger.js
/**
 * Structured audit logger helper.
 *
 * Usage:
 *   const { logAudit } = require('../middlewares/auditLogger');
 *   await logAudit('login_success', { userId, userEmail, req, status: 'success', metadata: {} });
 */
const AuditLog = require('../models/AuditLog');

/**
 * @param {string}  action     - AuditLog action enum value
 * @param {object}  opts
 * @param {string}  opts.userId     - MongoDB user _id (optional for pre-auth)
 * @param {string}  opts.userEmail  - User email
 * @param {object}  opts.req        - Express request (for IP + User-Agent)
 * @param {string}  [opts.status]   - 'success' | 'failure' | 'warning'
 * @param {object}  [opts.metadata] - Extra data (never include passwords/tokens)
 */
const logAudit = async (action, { userId = null, userEmail = null, req = null, status = 'success', metadata = {} } = {}) => {
    try {
        const ip = req
            ? (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown')
            : 'system';
        const userAgent = req?.headers?.['user-agent'] || null;

        await AuditLog.create({
            userId,
            userEmail,
            action,
            ip,
            userAgent,
            status,
            metadata
        });
    } catch (err) {
        // Audit logging must never crash the app — swallow errors silently
        console.error('[AuditLogger] Failed to write audit log:', err.message);
    }
};

module.exports = { logAudit };
