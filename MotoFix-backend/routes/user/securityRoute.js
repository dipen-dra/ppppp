// routes/user/securityRoute.js
/**
 * Authenticated user security routes:
 *  - TOTP 2FA setup, verify, disable
 *  - TOTP login challenge verification
 *  - Data export (GDPR)
 */
const express = require('express');
const router  = express.Router();
const { authenticateUser } = require('../../middlewares/authorizedUser');
const {
    setup2FA,
    verify2FASetup,
    disable2FA,
    verifyTOTPLogin
} = require('../../controllers/twoFactorController');
const { exportUserData } = require('../../controllers/user/dataExportController');

// ── TOTP 2FA Management (requires full auth) ──────────────────────────────────
router.post('/2fa/setup',   authenticateUser, setup2FA);
router.post('/2fa/verify',  authenticateUser, verify2FASetup);
router.post('/2fa/disable', authenticateUser, disable2FA);

// ── TOTP Login Challenge (uses tempToken — no full auth needed) ───────────────
router.post('/2fa/login',   verifyTOTPLogin);

// ── Data Export ───────────────────────────────────────────────────────────────
router.get('/export-data',  authenticateUser, exportUserData);

module.exports = router;
