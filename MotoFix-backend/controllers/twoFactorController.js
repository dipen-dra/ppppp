// controllers/twoFactorController.js
/**
 * TOTP 2FA — Google Authenticator compatible.
 * Uses speakeasy for TOTP secret generation/verification.
 * Uses qrcode to generate a scannable QR code PNG as a data URL.
 */
const speakeasy = require('speakeasy');
const QRCode    = require('qrcode');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User      = require('../models/User');
const { logAudit } = require('../middlewares/auditLogger');

// ─── Setup: Generate secret + QR code ─────────────────────────────────────────
exports.setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (user.twoFactorEnabled) {
            return res.status(400).json({ success: false, message: '2FA is already enabled on your account.' });
        }

        // Generate a new TOTP secret
        const secret = speakeasy.generateSecret({
            name: `MotoFix (${user.email})`,
            length: 32
        });

        // Store temp secret (not yet confirmed)
        user.twoFactorTempSecret = secret.base32;
        await user.save();

        // Generate QR code as a data URL
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        await logAudit('2fa_setup_initiated', {
            userId: user._id, userEmail: user.email, req, status: 'success'
        });

        return res.status(200).json({
            success: true,
            message: 'Scan the QR code with Google Authenticator, then verify with the 6-digit code.',
            qrCode: qrCodeDataUrl,
            secret: secret.base32, // also show manual entry option
        });

    } catch (err) {
        console.error('2FA Setup Error:', err);
        return res.status(500).json({ success: false, message: 'Server error during 2FA setup.' });
    }
};

// ─── Verify setup: Confirm the TOTP token to enable 2FA ─────────────────────
exports.verify2FASetup = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'TOTP code is required.' });

    try {
        const user = await User.findById(req.user._id);
        if (!user?.twoFactorTempSecret) {
            return res.status(400).json({ success: false, message: 'No pending 2FA setup. Please start setup again.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorTempSecret,
            encoding: 'base32',
            token: token.trim(),
            window: 1 // allow 30s clock drift
        });

        if (!verified) {
            await logAudit('2fa_verify_failed', {
                userId: user._id, userEmail: user.email, req, status: 'failure',
                metadata: { phase: 'setup' }
            });
            return res.status(401).json({ success: false, message: 'Invalid code. Please try again.' });
        }

        // Promote temp secret to permanent
        user.twoFactorSecret = user.twoFactorTempSecret;
        user.twoFactorTempSecret = null;
        user.twoFactorEnabled = true;
        await user.save();

        await logAudit('2fa_enabled', {
            userId: user._id, userEmail: user.email, req, status: 'success'
        });

        return res.status(200).json({
            success: true,
            message: 'Two-Factor Authentication enabled successfully.'
        });

    } catch (err) {
        console.error('2FA Verify Setup Error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Disable 2FA ──────────────────────────────────────────────────────────────
exports.disable2FA = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'TOTP code required to disable 2FA.' });

    try {
        const user = await User.findById(req.user._id);
        if (!user?.twoFactorEnabled) {
            return res.status(400).json({ success: false, message: '2FA is not enabled on your account.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token.trim(),
            window: 1
        });

        if (!verified) {
            await logAudit('2fa_verify_failed', {
                userId: user._id, userEmail: user.email, req, status: 'failure',
                metadata: { phase: 'disable' }
            });
            return res.status(401).json({ success: false, message: 'Invalid code. 2FA not disabled.' });
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.twoFactorTempSecret = null;
        await user.save();

        await logAudit('2fa_disabled', {
            userId: user._id, userEmail: user.email, req, status: 'warning'
        });

        return res.status(200).json({ success: true, message: 'Two-Factor Authentication has been disabled.' });

    } catch (err) {
        console.error('2FA Disable Error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── Verify TOTP at login ─────────────────────────────────────────────────────
exports.verifyTOTPLogin = async (req, res) => {
    const { tempToken, token } = req.body;

    if (!tempToken || !token) {
        return res.status(400).json({ success: false, message: 'Session token and TOTP code are required.' });
    }

    try {
        const decoded = jwt.verify(tempToken, process.env.SECRET);
        if (decoded.phase !== 'totp_challenge') {
            return res.status(400).json({ success: false, message: 'Invalid session token.' });
        }

        const user = await User.findById(decoded._id);
        if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
            return res.status(400).json({ success: false, message: 'TOTP is not configured for this account.' });
        }

        // Check if locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: "Account is temporarily locked due to multiple failed verification attempts. Please try again later."
            });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token.trim(),
            window: 1
        });

        if (!verified) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000;
                user.loginAttempts = 0;
                await user.save();
                await logAudit('account_locked', {
                    userId: user._id, userEmail: user.email, req, status: 'warning',
                    metadata: { reason: '5 failed TOTP attempts', lockedFor: '15 minutes' }
                });
                return res.status(423).json({ success: false, message: 'Too many failed attempts. Your account has been temporarily locked for 15 minutes.' });
            }
            await user.save();
            await logAudit('login_otp_failed', {
                userId: user._id, userEmail: user.email, req, status: 'failure',
                metadata: { type: 'totp', attempt: user.loginAttempts, attemptsRemaining: 5 - user.loginAttempts }
            });
            const remaining = 5 - user.loginAttempts;
            return res.status(401).json({ success: false, message: `Invalid authenticator code. ${remaining} attempt(s) remaining.` });
        }

        // Reset failed login attempts on success
        user.loginAttempts = 0;
        await user.save();

        // Issue full JWT
        const jti = uuidv4();
        const fullToken = jwt.sign(
            { jti, _id: user._id, email: user.email, fullName: user.fullName, role: user.role },
            process.env.SECRET,
            { expiresIn: '7d' }
        );

        const userData = { _id: user._id, email: user.email, fullName: user.fullName, role: user.role };

        await logAudit('login_success', {
            userId: user._id, userEmail: user.email, req, status: 'success',
            metadata: { method: 'totp' }
        });

        res.cookie('token', fullToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ success: true, message: 'Login successful', data: userData, token: fullToken });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }
        console.error('TOTP Login Verify Error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};
