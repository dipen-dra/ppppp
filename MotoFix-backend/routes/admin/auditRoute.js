// routes/admin/auditRoute.js
const express = require('express');
const router = express.Router();
const AuditLog = require('../../models/AuditLog');
const { authenticateUser, isSuperAdmin } = require('../../middlewares/authorizedUser');

/**
 * GET /api/admin/audit-logs
 * Query params:
 *   page     (default 1)
 *   limit    (default 20, max 100)
 *   action   (filter by action)
 *   status   (filter by status: success | failure | warning)
 *   userId   (filter by specific user)
 *   from     (ISO date start)
 *   to       (ISO date end)
 */
router.get('/', authenticateUser, isSuperAdmin, async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip   = (page - 1) * limit;

        const filter = {};
        if (req.query.action)  filter.action  = req.query.action;
        if (req.query.status)  filter.status  = req.query.status;
        if (req.query.userId)  filter.userId  = req.query.userId;
        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
            if (req.query.to)   filter.createdAt.$lte = new Date(req.query.to);
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });

    } catch (err) {
        console.error('Audit Log Error:', err);
        return res.status(500).json({ success: false, message: 'Server error fetching audit logs.' });
    }
});

/**
 * GET /api/admin/audit-logs/stats
 * Returns aggregated counts by action for dashboard display
 */
router.get('/stats', authenticateUser, isSuperAdmin, async (req, res) => {
    try {
        const stats = await AuditLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
                }
            },
            {
                $group: { _id: '$action', count: { $sum: 1 }, failures: { $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] } } }
            },
            { $sort: { count: -1 } }
        ]);

        const failedLogins = await AuditLog.countDocuments({
            action: 'login_failed',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        const lockedAccounts = await AuditLog.countDocuments({
            action: 'account_locked',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        return res.status(200).json({
            success: true,
            data: { stats, last24h: { failedLogins, lockedAccounts } }
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error fetching audit stats.' });
    }
});

module.exports = router;
