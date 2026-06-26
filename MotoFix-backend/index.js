require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
// express-mongo-sanitize removed — replaced with inline safe sanitizer below
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const Message = require('./models/Message');
const { sanitizeRequest } = require('./middlewares/sanitizeRequest');

const app = express();
const server = http.createServer(app); 
connectDB();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.set('socketio', io);

// 1. Secure HTTP Headers (Helmet) with cross-origin assets friendly policies
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));

// 2. Strict CORS Whitelisting
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// 3. Global and Auth IP Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per IP per window
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth attempts per IP per window (tightened to match 5-attempt lockout)
    message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiters disabled/removed for now
// if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_RATE_LIMIT !== 'true') {
//     app.use(globalLimiter);
//     app.use('/api/auth', authLimiter);
// }

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(hpp());

// 4a. NoSQL / MongoDB Operator Injection Prevention
//     Recursively strips keys starting with `$` from req.body, req.query, and req.params.
//     We mutate the object IN-PLACE (delete + reassign values) rather than replacing
//     req.query itself, because Node 19+ makes req.query a read-only getter.
const stripMongoOperators = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else {
            stripMongoOperators(obj[key]);
        }
    }
};
app.use((req, res, next) => {
    try {
        if (req.body)   stripMongoOperators(req.body);
        if (req.query)  stripMongoOperators(req.query);
        if (req.params) stripMongoOperators(req.params);
    } catch (e) {
        const logger = require('./utils/logger');
        logger.warn('NoSQL sanitizer error', { url: req.originalUrl, error: e.message });
    }
    next();
});

// 4b. Deep Injection Sanitizer: Shell command injection, embedded operator
//     values, shell meta-characters, path traversal sequences, and CRLF.
//     Also caps $regex search strings to 100 chars (ReDoS prevention).
app.use(sanitizeRequest);

// 4c. Recursive Anti-XSS Sanitizer (strips HTML / script tags, event handlers, and javascript protocols)
const sanitizeXSS = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;
    for (let key in obj) {
        // Exclude passwords, secrets, OTPs, CAPTCHAs, and tokens to preserve special characters
        const lowerKey = key.toLowerCase();
        if (
            lowerKey.includes('password') || 
            lowerKey.includes('token') || 
            lowerKey.includes('otp') || 
            lowerKey.includes('captcha') || 
            lowerKey.includes('secret')
        ) {
            continue;
        }

        if (typeof obj[key] === 'string') {
            obj[key] = obj[key]
                .replace(/<[^>]*>/g, '')
                .replace(/(javascript|data|vbscript):/gi, '')
                .replace(/\bon[a-z]+\s*=/gi, 'x-on=');
        } else if (typeof obj[key] === 'object') {
            sanitizeXSS(obj[key]);
        }
    }
};
app.use((req, res, next) => {
    if (req.body)   sanitizeXSS(req.body);
    if (req.query)  sanitizeXSS(req.query);
    if (req.params) sanitizeXSS(req.params);
    next();
});

// Register request and completion logger middleware
const requestLogger = require('./middlewares/requestLogger');
app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Routes ---
app.get('/api/public/services', require('./controllers/user/serviceController').getAvailableServices);
app.use('/api/auth', require('./routes/userRoute'));
app.use('/api/admin/users', require('./routes/admin/adminUserRoute'));
app.use('/api/admin/bookings', require('./routes/admin/bookingRoute'));
app.use('/api/admin/services', require('./routes/admin/serviceRoute'));
app.use('/api/admin/profile', require('./routes/admin/profileRoute'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoute'));
app.use('/api/admin/chat', require('./routes/admin/chatRoute'));
app.use('/api/user', require('./routes/user/dashboardRoute'));
app.use('/api/user', require('./routes/user/bookingRoute'));
app.use('/api/user', require('./routes/user/serviceRoute'));
app.use('/api/user', require('./routes/user/profileRoute'));
app.use('/api/user', require('./routes/user/securityRoute'));  // 2FA + data export
app.use('/api/user/chat', require('./routes/user/chatRoute'));
app.use('/api/admin/audit-logs', require('./routes/admin/auditRoute'));  // Audit trail
app.use('/api/payment/esewa', require('./routes/esewaRoute'));
app.use('/api/gemini', require('./routes/gemini'));
app.use('/api/reviews', require('./routes/reviewRoute'));

io.on('connection', (socket) => {
    socket.on('join_room', async (data) => {
        const { roomName, userId } = data;
        socket.join(roomName);
        try {
            await Message.updateMany(
                { room: roomName, authorId: { $ne: userId }, isRead: false },
                { $set: { isRead: true } }
            );
            const eventName = userId === 'admin_user' ? 'messages_read_by_admin' : 'messages_read_by_user';
            socket.emit(eventName, { room: roomName });

            let historyQuery = { room: roomName };
            if (userId === 'admin_user') {
                historyQuery.clearedForAdmin = { $ne: true };
            } else {
                historyQuery.clearedForUser = { $ne: true };
            }
            const history = await Message.find(historyQuery).sort({ timestamp: 1 }).limit(100);
            socket.emit('chat_history', history);
        } catch (error) {
            console.error(`Error in join_room for room ${roomName}:`, error);
        }
    });

    socket.on('send_message', async (data) => {
        if (!data.message || data.message.trim() === '') return;
        try {
            const message = new Message({
                room: data.room,
                author: data.author,
                authorId: data.authorId,
                message: data.message,
                isRead: false
            });
            await message.save();
            io.to(data.room).emit('receive_message', message);
            io.to(data.room).emit('new_message_notification', {
                room: data.room,
                authorId: data.authorId,
                message: data.message
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {});
});


app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log internal error using Winston logger
    const logger = require('./utils/logger');
    logger.error(`Critical Server Error: ${err.message}`, {
        url: req.originalUrl || req.url,
        method: req.method,
        statusCode,
        stack: err.stack
    });

    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
});

const PORT = process.env.PORT || 5050;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => { 
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}


module.exports = { app, server, io }; 