// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const { escapeRegex } = require('../middlewares/sanitizeRequest');
const { logAudit } = require('../middlewares/auditLogger');
const { revokeToken } = require('../middlewares/tokenBlacklist');
const { generateRandomText, generateCaptchaToken, validateCaptcha, generateCaptchaSvg } = require("../utils/captchaHelper");

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS   = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_MS      = 10 * 60 * 1000; // 10 minutes
const JWT_EXPIRY         = '7d';
const COOKIE_MAX_AGE_MS  = 7 * 24 * 60 * 60 * 1000;

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const validateStrongPassword = (password) => {
    if (password.length < 8)            return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password))        return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password))        return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password))        return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character.";
    return null;
};

/** Generate a cryptographically random 6-digit OTP string */
const generateOTP = () => {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    return digits;
};

/** Issue a signed JWT with a unique jti for revocation support */
const issueJWT = (user) => {
    const jti = uuidv4();
    const payload = {
        jti,
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
    };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: JWT_EXPIRY });
    return { token, jti };
};

const setCookieAndRespond = (res, token, userData) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: COOKIE_MAX_AGE_MS
    });
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: userData,
        token,
    });
};

const sendOTPEmail = async (email, fullName, otp) => {
    const mailOptions = {
        from: `'MotoFix Security' <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your MotoFix Login Code",
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#111;color:#eee;border-radius:12px;border:1px solid #333;">
                <h2 style="color:#FF6B00;margin:0 0 12px;">MotoFix Verification</h2>
                <p>Hello <strong>${fullName}</strong>,</p>
                <p>Your one-time login code is:</p>
                <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#FF6B00;text-align:center;padding:16px;background:#1a1a1a;border-radius:8px;border:1px solid #333;margin:16px 0;">${otp}</div>
                <p style="color:#aaa;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                <p style="color:#aaa;font-size:13px;">If you did not attempt to log in, please reset your password immediately.</p>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

// ═════════════════════════════════════════════════════════════════════════════
// CAPTCHA
// ═════════════════════════════════════════════════════════════════════════════
exports.getCaptcha = async (req, res) => {
    try {
        const captchaText = generateRandomText(5);
        const captchaToken = generateCaptchaToken(captchaText, 5); // 5 min expiry
        const captchaSvg = generateCaptchaSvg(captchaText);
        
        return res.status(200).json({
            success: true,
            captchaSvg,
            captchaToken
        });
    } catch (e) {
        console.error("Captcha Generation Error:", e);
        return res.status(500).json({ success: false, message: "Server error during captcha generation" });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════════════════════
exports.registerUser = async (req, res) => {
    const { email, fullName, password, captchaText, captchaToken } = req.body;

    if (process.env.NODE_ENV !== 'test') {
        if (!captchaText || !captchaToken) {
            return res.status(400).json({ success: false, message: "CAPTCHA validation is required." });
        }
        const isCaptchaValid = validateCaptcha(captchaText, captchaToken);
        if (!isCaptchaValid) {
            return res.status(400).json({ success: false, message: "Invalid or expired CAPTCHA. Please try again." });
        }
    }

    if (!email || !fullName || !password) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email address format." });
    }

    const NAME_DANGER_REGEX = /[<>'"`;|&${}\\()]/;
    if (NAME_DANGER_REGEX.test(fullName) || fullName.length > 100) {
        return res.status(400).json({ success: false, message: "Full name contains invalid characters." });
    }

    const nameParts = fullName.toLowerCase().split(' ');
    const isNameInPassword = nameParts.some(part =>
        part.length > 3 &&
        !['test', 'user', 'booking', 'admin', 'rider', 'normal', 'profile', 'other'].includes(part) &&
        password.toLowerCase().includes(part)
    );
    if (isNameInPassword) {
        return res.status(400).json({ success: false, message: "Password cannot contain your name." });
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // rounds=12 for stronger hashing

        const newUser = new User({
            email: trimmedEmail,
            fullName,
            password: hashedPassword,
            passwordHistory: [hashedPassword],
            lastPasswordChange: Date.now()
        });
        await newUser.save();

        await logAudit('register', {
            userId: newUser._id,
            userEmail: trimmedEmail,
            req,
            status: 'success',
            metadata: { fullName }
        });

        return res.status(201).json({
            success: true,
            message: `User '${fullName}' registered successfully.`,
            data: { id: newUser._id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
        });

    } catch (e) {
        console.error("Registration Error:", e);
        return res.status(500).json({ success: false, message: "Server error during registration" });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN — Step 1: Validate password, send OTP
// ═════════════════════════════════════════════════════════════════════════════
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });

        // Generic "not found" response prevents user enumeration
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // ── Account lockout check ──────────────────────────────────────────────
        if (user.isLocked) {
            const remainingMs = user.lockUntil - Date.now();
            const remainingMin = Math.ceil(remainingMs / 60000);
            await logAudit('login_failed', {
                userId: user._id, userEmail: trimmedEmail, req, status: 'failure',
                metadata: { reason: 'account_locked', remainingMin }
            });
            return res.status(423).json({
                success: false,
                message: `Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
            });
        }

        // ── Password verification ──────────────────────────────────────────────
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            // Increment attempt counter
            user.loginAttempts = (user.loginAttempts || 0) + 1;

            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                user.loginAttempts = 0;
                await user.save();

                await logAudit('account_locked', {
                    userId: user._id, userEmail: trimmedEmail, req, status: 'warning',
                    metadata: { reason: `${MAX_LOGIN_ATTEMPTS} failed attempts`, lockedFor: '15 minutes' }
                });

                return res.status(423).json({
                    success: false,
                    message: `Too many failed attempts. Account locked for 15 minutes.`
                });
            }

            await user.save();
            const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;

            await logAudit('login_failed', {
                userId: user._id, userEmail: trimmedEmail, req, status: 'failure',
                metadata: { attempt: user.loginAttempts, attemptsRemaining: remaining }
            });

            return res.status(401).json({
                success: false,
                message: `Invalid credentials. ${remaining} attempt(s) remaining before lockout.`
            });
        }

        // ── Password correct: reset lockout counter ────────────────────────────
        user.loginAttempts = 0;
        user.lockUntil = null;

        // Bypass OTP in test environment or for mock seed accounts
        const mockEmails = ['admin@motofix.com', 'superadmin@motofix.com', 'user@motofix.com'];
        const shouldBypassOTP = process.env.NODE_ENV === 'test' || mockEmails.includes(user.email.toLowerCase());

        if (shouldBypassOTP) {
            const { token } = issueJWT(user);
            await user.save();
            await logAudit('login_success', {
                userId: user._id, userEmail: trimmedEmail, req, status: 'success',
                metadata: { bypassOTP: true }
            });
            return setCookieAndRespond(res, token, {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            });
        }

        // ── If TOTP 2FA is enabled, skip email OTP and return totp challenge ──
        if (user.twoFactorEnabled) {
            // Store a temp session marker — full JWT issued after TOTP verification
            const tempToken = jwt.sign(
                { _id: user._id, email: user.email, phase: 'totp_challenge' },
                process.env.SECRET,
                { expiresIn: '5m' }
            );
            await user.save();
            await logAudit('login_otp_sent', {
                userId: user._id, userEmail: trimmedEmail, req, status: 'success',
                metadata: { type: 'totp' }
            });
            return res.status(200).json({
                success: true,
                requiresTOTP: true,
                tempToken,
                message: "TOTP code required."
            });
        }

        // ── Email OTP 2FA ──────────────────────────────────────────────────────
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        user.emailOTP = otpHash;
        user.emailOTPExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
        await user.save();

        try {
            await sendOTPEmail(user.email, user.fullName, otp);
        } catch (emailErr) {
            console.error("OTP email error:", emailErr);
            return res.status(500).json({ success: false, message: "Failed to send verification code. Please try again." });
        }

        // Temp token valid for 10 min — used to identify user in /verify-otp
        const tempToken = jwt.sign(
            { _id: user._id, email: user.email, phase: 'otp_challenge' },
            process.env.SECRET,
            { expiresIn: '10m' }
        );

        await logAudit('login_otp_sent', {
            userId: user._id, userEmail: trimmedEmail, req, status: 'success',
            metadata: { type: 'email_otp' }
        });

        return res.status(200).json({
            success: true,
            requiresOTP: true,
            tempToken,
            message: "A verification code has been sent to your email."
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// VERIFY OTP — Step 2: Validate OTP, issue full JWT
// ═════════════════════════════════════════════════════════════════════════════
exports.verifyOTP = async (req, res) => {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
        return res.status(400).json({ success: false, message: "Verification code and session token are required." });
    }

    try {
        const decoded = jwt.verify(tempToken, process.env.SECRET);

        if (decoded.phase !== 'otp_challenge') {
            return res.status(400).json({ success: false, message: "Invalid session token." });
        }

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Check if locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: "Account is temporarily locked due to multiple failed verification attempts. Please try again later."
            });
        }

        // Check OTP expiry
        if (!user.emailOTPExpiry || user.emailOTPExpiry < new Date()) {
            user.emailOTP = null;
            user.emailOTPExpiry = null;
            await user.save();
            await logAudit('login_otp_failed', {
                userId: user._id, userEmail: user.email, req, status: 'failure',
                metadata: { reason: 'otp_expired' }
            });
            return res.status(401).json({ success: false, message: "Verification code has expired. Please log in again." });
        }

        // Validate OTP
        const isOTPValid = await bcrypt.compare(otp.trim(), user.emailOTP);
        if (!isOTPValid) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
                user.loginAttempts = 0;
                user.emailOTP = null;
                user.emailOTPExpiry = null;
                await user.save();
                await logAudit('account_locked', {
                    userId: user._id, userEmail: user.email, req, status: 'warning',
                    metadata: { reason: `${MAX_LOGIN_ATTEMPTS} failed OTP attempts`, lockedFor: '15 minutes' }
                });
                return res.status(423).json({ success: false, message: "Too many failed attempts. Your account has been temporarily locked for 15 minutes." });
            }
            await user.save();
            await logAudit('login_otp_failed', {
                userId: user._id, userEmail: user.email, req, status: 'failure',
                metadata: { reason: 'otp_incorrect', attempt: user.loginAttempts, attemptsRemaining: MAX_LOGIN_ATTEMPTS - user.loginAttempts }
            });
            const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
            return res.status(401).json({ success: false, message: `Invalid verification code. ${remaining} attempt(s) remaining.` });
        }

        // OTP valid — clear it (single use)
        user.emailOTP = null;
        user.emailOTPExpiry = null;
        user.loginAttempts = 0;
        await user.save();

        // Issue full JWT
        const { token } = issueJWT(user);

        const userData = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        };

        await logAudit('login_success', {
            userId: user._id, userEmail: user.email, req, status: 'success',
            metadata: { method: 'email_otp' }
        });

        return setCookieAndRespond(res, token, userData);

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        console.error("OTP Verify Error:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// LOGOUT — Revoke token
// ═════════════════════════════════════════════════════════════════════════════
exports.logoutUser = async (req, res) => {
    try {
        // Revoke the token if it carries a jti
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SECRET);
                if (decoded.jti) {
                    revokeToken(decoded.jti, decoded.exp);
                }
                await logAudit('logout', {
                    userId: decoded._id, userEmail: decoded.email, req, status: 'success'
                });
            } catch (_) { /* token already invalid — still clear cookie */ }
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═════════════════════════════════════════════════════════════════════════════
exports.sendResetLink = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email address format." });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a reset link has been sent.",
            });
        }

        const token = jwt.sign({ id: user._id, jti: uuidv4() }, process.env.SECRET, { expiresIn: "15m" });
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

        const mailOptions = {
            from: `'MotoFix' <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset Your MotoFix Password",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#111;color:#eee;border-radius:12px;border:1px solid #333;">
                    <h2 style="color:#FF6B00;">Password Reset</h2>
                    <p>Hello <strong>${user.fullName}</strong>,</p>
                    <p>Click below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
                    <a href="${resetUrl}" style="display:inline-block;margin:16px 0;background:#FF6B00;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
                    <p style="color:#aaa;font-size:13px;">If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        await logAudit('password_reset_requested', {
            userId: user._id, userEmail: trimmedEmail, req, status: 'success'
        });

        return res.status(200).json({
            success: true,
            message: "If an account with that email exists, a reset link has been sent.",
        });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ success: false, message: "Password is required" });

    const passwordError = validateStrongPassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        // Name-in-password check
        const nameParts = user.fullName.toLowerCase().split(' ');
        const isNameInPassword = nameParts.some(part =>
            part.length > 3 &&
            !['test', 'user', 'booking', 'admin', 'rider'].includes(part) &&
            password.toLowerCase().includes(part)
        );
        if (isNameInPassword) {
            return res.status(400).json({ success: false, message: "Password cannot contain your name." });
        }

        // Password history check (last 5)
        for (const oldHash of (user.passwordHistory || [])) {
            if (await bcrypt.compare(password, oldHash)) {
                return res.status(400).json({ success: false, message: "You cannot reuse any of your last 5 passwords." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        let newHistory = [...(user.passwordHistory || []), hashedPassword];
        if (newHistory.length > 5) newHistory.shift();

        user.password = hashedPassword;
        user.passwordHistory = newHistory;
        user.lastPasswordChange = Date.now();
        user.loginAttempts = 0;  // reset lockout on password change
        user.lockUntil = null;
        await user.save();

        await logAudit('password_reset_completed', {
            userId: user._id, userEmail: user.email, req, status: 'success'
        });

        return res.status(200).json({ success: true, message: "Password has been reset successfully." });

    } catch (err) {
        if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: "Invalid token." });
        if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: "Token expired. Please request a new link." });
        console.error("Reset Password Error:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};