"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../../shared/logger");
const config_1 = __importDefault(require("../../config"));
// 🗓️ Format date
const formatDate = () => {
    const now = new Date();
    const options = {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    const datePart = now.toLocaleString('en-US', options);
    return `${datePart} , ${now.getFullYear()}`;
};
// 🧾 Status text
const statusText = (code) => {
    switch (code) {
        case 200:
            return 'OK';
        case 201:
            return 'Created';
        case 204:
            return 'No Content';
        case 400:
            return 'Bad Request';
        case 401:
            return 'Unauthorized';
        case 403:
            return 'Forbidden';
        case 404:
            return 'Not Found';
        case 429:
            return 'Too Many Requests';
        case 500:
            return 'Internal Server Error';
        default:
            return String(code);
    }
};
// 🌐 Client IP
const getClientIp = (req) => {
    var _a, _b;
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length)
        return xff.split(',')[0].trim();
    const ip = req.ip ||
        ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) ||
        ((_b = req.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress);
    return ip || 'unknown';
};
// 🔒 Mask sensitive
const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'client_secret',
    'secret',
    'api_key',
    'apiKey',
]);
const maskSensitive = (value) => {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value.map(maskSensitive);
    if (typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = SENSITIVE_KEYS.has(k) ? '********' : maskSensitive(v);
        }
        return out;
    }
    return value;
};
// 🧰 Normalize body
const normalizeBody = (req) => {
    const body = req.body;
    if (!body)
        return {};
    if (Buffer.isBuffer(body))
        return { raw: true, length: body.length };
    if (typeof body !== 'object')
        return { value: String(body) };
    return body;
};
// 🔠 Indent helper
const indentBlock = (text, spaces = 5) => {
    const pad = ' '.repeat(spaces);
    return text
        .split('\n')
        .map(line => pad + line)
        .join('\n');
};
// 📏 File size converter
const humanFileSize = (size) => {
    if (size < 1024)
        return size + ' B';
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    return (size / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};
// 📝 Extract files
const extractFilesInfo = (req) => {
    const formatFile = (file) => ({
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: humanFileSize(file.size),
    });
    if (req.file)
        return formatFile(req.file);
    if (req.files) {
        // Handle both array format (from .any()) and object format (from .fields())
        if (Array.isArray(req.files)) {
            // Group files by fieldname when using .any()
            const grouped = {};
            for (const file of req.files) {
                const fieldName = file.fieldname;
                if (!grouped[fieldName]) {
                    grouped[fieldName] = [];
                }
                grouped[fieldName].push(formatFile(file));
            }
            // Convert single-item arrays to single objects for cleaner output
            const out = {};
            for (const [fieldName, files] of Object.entries(grouped)) {
                out[fieldName] = files.length === 1 ? files[0] : files;
            }
            return out;
        }
        else {
            // Handle object format (from .fields())
            const out = {};
            for (const [key, value] of Object.entries(req.files)) {
                if (Array.isArray(value))
                    out[key] = value.map(formatFile);
                else
                    out[key] = formatFile(value);
            }
            return out;
        }
    }
    return undefined;
};
// 🧭 Detect Stripe webhook requests
const WEBHOOK_PATH = '/api/v1/payments/webhook';
const isStripeWebhook = (req) => {
    var _a;
    const pathMatch = (_a = req.originalUrl) === null || _a === void 0 ? void 0 : _a.includes(WEBHOOK_PATH);
    const sigPresent = Boolean(req.headers['stripe-signature']);
    const ua = String(req.headers['user-agent'] || '');
    const uaStripe = ua.startsWith('Stripe/');
    return Boolean(pathMatch || sigPresent || uaStripe);
};
// 🧾 Build minimal webhook context for global logs (no secrets)
const getWebhookLogContext = (req) => {
    const contentType = String(req.headers['content-type'] || '');
    const ua = String(req.headers['user-agent'] || '');
    const sigHeader = req.headers['stripe-signature'];
    const body = req.body;
    const rawLength = Buffer.isBuffer(body)
        ? body.length
        : typeof body === 'string'
            ? Buffer.byteLength(body)
            : undefined;
    return {
        timestamp: new Date().toISOString(),
        headers: {
            'stripe-signature': sigHeader ? 'Present' : 'Missing',
            'content-type': contentType,
            'user-agent': ua,
        },
        bodySize: rawLength,
    };
};
// 🧪 Safely parse Stripe event from raw body without mutating req.body
const parseStripeEventSafe = (req) => {
    const body = req.body;
    try {
        if (Buffer.isBuffer(body))
            return JSON.parse(body.toString('utf8'));
        if (typeof body === 'string')
            return JSON.parse(body);
        if (body && typeof body === 'object')
            return body;
    }
    catch (_a) {
        return undefined;
    }
    return undefined;
};
const getEventSummary = (evt) => ({
    type: evt === null || evt === void 0 ? void 0 : evt.type,
    id: evt === null || evt === void 0 ? void 0 : evt.id,
    created: typeof (evt === null || evt === void 0 ? void 0 : evt.created) === 'number'
        ? new Date(evt.created * 1000).toISOString()
        : evt === null || evt === void 0 ? void 0 : evt.created,
    livemode: Boolean(evt === null || evt === void 0 ? void 0 : evt.livemode),
});
const getPaymentIntentLogDetails = (evt) => {
    var _a;
    const obj = ((_a = evt === null || evt === void 0 ? void 0 : evt.data) === null || _a === void 0 ? void 0 : _a.object) || {};
    const metadata = (obj === null || obj === void 0 ? void 0 : obj.metadata) && typeof obj.metadata === 'object' ? obj.metadata : undefined;
    return {
        paymentIntentId: obj === null || obj === void 0 ? void 0 : obj.id,
        amount: obj === null || obj === void 0 ? void 0 : obj.amount,
        amount_capturable: obj === null || obj === void 0 ? void 0 : obj.amount_capturable,
        currency: obj === null || obj === void 0 ? void 0 : obj.currency,
        status: obj === null || obj === void 0 ? void 0 : obj.status,
        metadata,
    };
};
// 🧾 Main Logger
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        var _a, _b, _c;
        const ms = Date.now() - start;
        const status = res.statusCode;
        const statusMsg = statusText(status);
        const details = {
            params: req.params || {},
            query: req.query || {},
            body: normalizeBody(req),
            files: extractFilesInfo(req),
        };
        const maskedDetails = maskSensitive(details);
        // 🎨 Method color
        const methodColor = (() => {
            switch (req.method) {
                case 'GET':
                    return colors_1.default.bgGreen.black.bold(` ${req.method} `);
                case 'POST':
                    return colors_1.default.bgBlue.white.bold(` ${req.method} `);
                case 'PUT':
                    return colors_1.default.bgYellow.black.bold(` ${req.method} `);
                case 'PATCH':
                    return colors_1.default.bgMagenta.white.bold(` ${req.method} `);
                case 'DELETE':
                    return colors_1.default.bgRed.white.bold(` ${req.method} `);
                default:
                    return colors_1.default.bgWhite.black.bold(` ${req.method} `);
            }
        })();
        const routeColor = colors_1.default.cyan.bold(req.originalUrl);
        const ipColor = colors_1.default.gray.bold(` ${getClientIp(req)} `);
        // 🎨 Status color
        const statusColor = (() => {
            if (status >= 500)
                return colors_1.default.bgRed.white.bold;
            if (status >= 400)
                return colors_1.default.bgRed.white.bold;
            if (status >= 300)
                return colors_1.default.bgYellow.black.bold;
            return colors_1.default.bgGreen.black.bold;
        })();
        // 🎨 Message text color only background
        const messageBg = (() => {
            if (status >= 500)
                return colors_1.default.bgRed.white;
            if (status >= 400)
                return colors_1.default.bgRed.white;
            if (status >= 300)
                return colors_1.default.bgYellow.black;
            return colors_1.default.bgGreen.black;
        })();
        const responsePayload = res.locals.responsePayload || {};
        const responseMessage = responsePayload.message || '';
        const responseErrors = responsePayload.errorMessages;
        const lines = [];
        lines.push(colors_1.default.gray.bold(`[${formatDate()}]`));
        lines.push(`📥 Request: ${methodColor} ${routeColor} from IP:${ipColor}`);
        // 🔔 Stripe webhook request context (global)
        if (isStripeWebhook(req)) {
            lines.push(colors_1.default.yellow('     🔔 Stripe webhook request context:'));
            lines.push(colors_1.default.gray(indentBlock(JSON.stringify(getWebhookLogContext(req), null, 2))));
            // ✅ Signature verification status from controller
            const sigVerified = (_a = res.locals) === null || _a === void 0 ? void 0 : _a.webhookSignatureVerified;
            const sigError = (_b = res.locals) === null || _b === void 0 ? void 0 : _b.webhookSignatureError;
            if (sigVerified === true) {
                lines.push(colors_1.default.green('     ✅ Webhook signature verified successfully'));
            }
            else if (sigVerified === false) {
                lines.push(colors_1.default.red(`     ❌ Webhook signature verification failed: ${sigError || 'unknown error'}`));
            }
            // 🔐 Masked webhook secret preview
            const secretPreview = ((_c = res.locals) === null || _c === void 0 ? void 0 : _c.webhookSecretPreview) || (process.env.STRIPE_WEBHOOK_SECRET ? String(process.env.STRIPE_WEBHOOK_SECRET).substring(0, 10) + '...' : undefined);
            if (secretPreview) {
                lines.push(colors_1.default.blue(`     🔐 Webhook secret configured: ${secretPreview}`));
            }
            const evt = parseStripeEventSafe(req);
            if (evt && evt.object === 'event' && evt.type) {
                lines.push(colors_1.default.yellow('     📨 Received webhook event:'));
                lines.push(colors_1.default.gray(indentBlock(JSON.stringify(getEventSummary(evt), null, 2))));
                const type = evt.type;
                if (type === 'payment_intent.amount_capturable_updated') {
                    lines.push(colors_1.default.yellow('     💳 Amount capturable updated:'));
                    lines.push(colors_1.default.gray(indentBlock(JSON.stringify(getPaymentIntentLogDetails(evt), null, 2))));
                }
                else if (type === 'payment_intent.succeeded') {
                    lines.push(colors_1.default.yellow('     💰 Processing payment succeeded:'));
                    lines.push(colors_1.default.gray(indentBlock(JSON.stringify(getPaymentIntentLogDetails(evt), null, 2))));
                }
                else if (type === 'payment_intent.payment_failed') {
                    lines.push(colors_1.default.yellow('     ❌ Payment failed details:'));
                    lines.push(colors_1.default.gray(indentBlock(JSON.stringify(getPaymentIntentLogDetails(evt), null, 2))));
                }
            }
        }
        if (config_1.default.node_env === 'development') {
            lines.push(colors_1.default.yellow('     🔎 Request details:'));
            lines.push(colors_1.default.gray(indentBlock(JSON.stringify(maskedDetails, null, 2))));
        }
        const respLabel = status >= 400 ? '❌ Response sent:' : '📤 Response sent:';
        lines.push(`${respLabel} ${statusColor(` ${status} ${statusMsg} `)}`);
        // 💬 Message with bg only on message text
        if (responseMessage) {
            lines.push(`💬 Message: ${messageBg(` ${responseMessage} `)}`);
        }
        if (responseErrors &&
            Array.isArray(responseErrors) &&
            responseErrors.length) {
            lines.push(colors_1.default.red('📌 Details:'));
            lines.push(colors_1.default.gray(indentBlock(JSON.stringify(responseErrors, null, 2))));
        }
        lines.push(colors_1.default.magenta.bold(`⏱️ Processed in ${ms}ms`));
        const formatted = lines.join('\n');
        if (status >= 400)
            logger_1.errorLogger.error(formatted);
        else
            logger_1.logger.info(formatted);
    });
    next();
};
exports.requestLogger = requestLogger;
// (removed) Misplaced Stripe signature log block — now handled inside formatted logger output
