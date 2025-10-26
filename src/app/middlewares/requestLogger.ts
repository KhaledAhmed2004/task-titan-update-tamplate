import type { NextFunction, Request, Response } from 'express';
import colors from 'colors';
import { logger, errorLogger } from '../../shared/logger';
import config from '../../config';

// 🗓️ Format date
const formatDate = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
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
const statusText = (code: number): string => {
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
const getClientIp = (req: Request): string => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    (req as any).connection?.remoteAddress;
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
const maskSensitive = (value: any): any => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(maskSensitive);
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.has(k) ? '********' : maskSensitive(v);
    }
    return out;
  }
  return value;
};

// 🧰 Normalize body
const normalizeBody = (req: Request): any => {
  const body: any = (req as any).body;
  if (!body) return {};
  if (Buffer.isBuffer(body)) return { raw: true, length: body.length };
  if (typeof body !== 'object') return { value: String(body) };
  return body;
};

// 🔠 Indent helper
const indentBlock = (text: string, spaces = 5): string => {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => pad + line)
    .join('\n');
};

// 📏 File size converter
const humanFileSize = (size: number): string => {
  if (size < 1024) return size + ' B';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  return (size / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

// 📝 Extract files
const extractFilesInfo = (req: Request) => {
  const formatFile = (file: any) => ({
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: humanFileSize(file.size),
  });

  if (req.file) return formatFile(req.file);
  if (req.files) {
    // Handle both array format (from .any()) and object format (from .fields())
    if (Array.isArray(req.files)) {
      // Group files by fieldname when using .any()
      const grouped: Record<string, any> = {};
      for (const file of (req.files as any[])) {
        const fieldName = (file as any).fieldname;
        if (!grouped[fieldName]) {
          grouped[fieldName] = [];
        }
        grouped[fieldName].push(formatFile(file));
      }
      
      // Convert single-item arrays to single objects for cleaner output
      const out: Record<string, any> = {};
      for (const [fieldName, files] of Object.entries(grouped)) {
        out[fieldName] = (files as any[]).length === 1 ? (files as any[])[0] : files;
      }
      return out;
    } else {
      // Handle object format (from .fields())
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(req.files as Record<string, any>)) {
        if (Array.isArray(value)) out[key] = value.map(formatFile);
        else out[key] = formatFile(value);
      }
      return out;
    }
  }
  return undefined;
};

// 🧭 Detect Stripe webhook requests
const WEBHOOK_PATH = '/api/v1/payments/webhook';
const isStripeWebhook = (req: Request): boolean => {
  const pathMatch = req.originalUrl?.includes(WEBHOOK_PATH);
  const sigPresent = Boolean(req.headers['stripe-signature']);
  const ua = String(req.headers['user-agent'] || '');
  const uaStripe = ua.startsWith('Stripe/');
  return Boolean(pathMatch || sigPresent || uaStripe);
};

// 🧾 Build minimal webhook context for global logs (no secrets)
const getWebhookLogContext = (req: Request) => {
  const contentType = String(req.headers['content-type'] || '');
  const ua = String(req.headers['user-agent'] || '');
  const sigHeader = req.headers['stripe-signature'];
  const body: any = (req as any).body;
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
const parseStripeEventSafe = (req: Request): any | undefined => {
  const body: any = (req as any).body;
  try {
    if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
    if (typeof body === 'string') return JSON.parse(body);
    if (body && typeof body === 'object') return body;
  } catch {
    return undefined;
  }
  return undefined;
};

const getEventSummary = (evt: any) => ({
  type: evt?.type,
  id: evt?.id,
  created:
    typeof evt?.created === 'number'
      ? new Date(evt.created * 1000).toISOString()
      : evt?.created,
  livemode: Boolean(evt?.livemode),
});

const getPaymentIntentLogDetails = (evt: any) => {
  const obj = evt?.data?.object || {};
  const metadata = obj?.metadata && typeof obj.metadata === 'object' ? obj.metadata : undefined;
  return {
    paymentIntentId: obj?.id,
    amount: obj?.amount,
    amount_capturable: obj?.amount_capturable,
    currency: obj?.currency,
    status: obj?.status,
    metadata,
  };
};

// 🧾 Main Logger
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
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
          return colors.bgGreen.black.bold(` ${req.method} `);
        case 'POST':
          return colors.bgBlue.white.bold(` ${req.method} `);
        case 'PUT':
          return colors.bgYellow.black.bold(` ${req.method} `);
        case 'PATCH':
          return colors.bgMagenta.white.bold(` ${req.method} `);
        case 'DELETE':
          return colors.bgRed.white.bold(` ${req.method} `);
        default:
          return colors.bgWhite.black.bold(` ${req.method} `);
      }
    })();

    const routeColor = colors.cyan.bold(req.originalUrl);
    const ipColor = colors.gray.bold(` ${getClientIp(req)} `);

    // 🎨 Status color
    const statusColor = (() => {
      if (status >= 500) return colors.bgRed.white.bold;
      if (status >= 400) return colors.bgRed.white.bold;
      if (status >= 300) return colors.bgYellow.black.bold;
      return colors.bgGreen.black.bold;
    })();

    // 🎨 Message text color only background
    const messageBg = (() => {
      if (status >= 500) return colors.bgRed.white;
      if (status >= 400) return colors.bgRed.white;
      if (status >= 300) return colors.bgYellow.black;
      return colors.bgGreen.black;
    })();

    const responsePayload = res.locals.responsePayload || {};
    const responseMessage = responsePayload.message || '';
    const responseErrors = responsePayload.errorMessages;

    const lines: string[] = [];
    lines.push(colors.gray.bold(`[${formatDate()}]`));
    lines.push(`📥 Request: ${methodColor} ${routeColor} from IP:${ipColor}`);

    // 🔔 Stripe webhook request context (global)
    if (isStripeWebhook(req)) {
      lines.push(colors.yellow('     🔔 Stripe webhook request context:'));
      lines.push(colors.gray(indentBlock(JSON.stringify(getWebhookLogContext(req), null, 2))));

      // ✅ Signature verification status from controller
      const sigVerified = (res.locals as any)?.webhookSignatureVerified;
      const sigError = (res.locals as any)?.webhookSignatureError;
      if (sigVerified === true) {
        lines.push(colors.green('     ✅ Webhook signature verified successfully'));
      } else if (sigVerified === false) {
        lines.push(colors.red(`     ❌ Webhook signature verification failed: ${sigError || 'unknown error'}`));
      }

      // 🔐 Masked webhook secret preview
      const secretPreview = (res.locals as any)?.webhookSecretPreview || (process.env.STRIPE_WEBHOOK_SECRET ? String(process.env.STRIPE_WEBHOOK_SECRET).substring(0, 10) + '...' : undefined);
      if (secretPreview) {
        lines.push(colors.blue(`     🔐 Webhook secret configured: ${secretPreview}`));
      }

      const evt = parseStripeEventSafe(req);
      if (evt && evt.object === 'event' && evt.type) {
        lines.push(colors.yellow('     📨 Received webhook event:'));
        lines.push(colors.gray(indentBlock(JSON.stringify(getEventSummary(evt), null, 2))));

        const type = evt.type as string;
        if (type === 'payment_intent.amount_capturable_updated') {
          lines.push(colors.yellow('     💳 Amount capturable updated:'));
          lines.push(colors.gray(indentBlock(JSON.stringify(getPaymentIntentLogDetails(evt), null, 2))));
        } else if (type === 'payment_intent.succeeded') {
          lines.push(colors.yellow('     💰 Processing payment succeeded:'));
          lines.push(colors.gray(indentBlock(JSON.stringify(getPaymentIntentLogDetails(evt), null, 2))));
        } else if (type === 'payment_intent.payment_failed') {
          lines.push(colors.yellow('     ❌ Payment failed details:'));
          lines.push(colors.gray(indentBlock(JSON.stringify(getPaymentIntentLogDetails(evt), null, 2))));
        }
      }
    }

    if (config.node_env === 'development') {
      lines.push(colors.yellow('     🔎 Request details:'));
      lines.push(
        colors.gray(indentBlock(JSON.stringify(maskedDetails, null, 2)))
      );
    }

    const respLabel = status >= 400 ? '❌ Response sent:' : '📤 Response sent:';
    lines.push(`${respLabel} ${statusColor(` ${status} ${statusMsg} `)}`);

    // 💬 Message with bg only on message text
    if (responseMessage) {
      lines.push(`💬 Message: ${messageBg(` ${responseMessage} `)}`);
    }

    if (
      responseErrors &&
      Array.isArray(responseErrors) &&
      responseErrors.length
    ) {
      lines.push(colors.red('📌 Details:'));
      lines.push(
        colors.gray(indentBlock(JSON.stringify(responseErrors, null, 2)))
      );
    }

    lines.push(colors.magenta.bold(`⏱️ Processed in ${ms}ms`));

    const formatted = lines.join('\n');
    if (status >= 400) errorLogger.error(formatted);
    else logger.info(formatted);
  });

  next();
};

// (removed) Misplaced Stripe signature log block — now handled inside formatted logger output
