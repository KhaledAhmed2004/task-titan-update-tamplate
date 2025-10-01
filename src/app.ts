// import cors from 'cors';
// import YAML from 'yamljs';
// import router from './routes';
// import { Morgan } from './shared/morgen';
// import swaggerUi from 'swagger-ui-express';
// import { StatusCodes } from 'http-status-codes';
// import express, { Request, Response } from 'express';
// import globalErrorHandler from './app/middlewares/globalErrorHandler';
// import './config/passport';

// const app = express();
// import path from 'path';
// import passport from 'passport';
// //morgan
// app.use(Morgan.successHandler);
// app.use(Morgan.errorHandler);

// //body parser
// app.use(
//   cors({
//     // origin: "*",
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://localhost:5174',
//       'http://localhost:5173',
//       'https://task-titans-six.vercel.app',
//       'https://task-titans-admin.vercel.app',
//     ],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     credentials: true, // if you need cookies/auth
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(passport.initialize());

// //file retrieve
// app.use(express.static('uploads'));

// // Load your swagger.yml from the public folder
// const swaggerDocument = YAML.load(
//   path.join(__dirname, '../public/swagger.yaml')
// );

// //router
// app.use('/api/v1', router);

// // Serve Swagger UI at /api/v1/docs
// app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// //live response
// app.get('/', (req: Request, res: Response) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//       <title>Matrix Live Server</title>
//       <style>
//         body {
//           margin: 0;
//           padding: 0;
//           overflow: hidden;
//           background: black;
//           font-family: monospace;
//         }
//         canvas {
//           display: block;
//         }
//         .center-container {
//           position: absolute;
//           top: 50%;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           text-align: center;
//           color: #00ff00;
//         }
//         .server-message {
//           font-size: 3rem;
//           font-weight: bold;
//           text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00;
//           animation: glow 1.5s infinite alternate;
//         }
//         .date-time {
//           margin-top: 15px;
//           font-size: 1.2rem;
//           text-shadow: 0 0 5px #00ff00, 0 0 15px #00ff00;
//           animation: flicker 1.5s infinite;
//         }
//         @keyframes glow {
//           from { text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00; }
//           to { text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00, 0 0 60px #00ff00; }
//         }
//         @keyframes flicker {
//           0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
//           20%, 22%, 24%, 55% { opacity: 0.3; }
//         }
//       </style>
//     </head>
//     <body>
//       <canvas id="matrixCanvas"></canvas>
//       <div class="center-container">
//         <div class="server-message">✅ Server is Live 🚀</div>
//         <div class="date-time" id="dateTime"></div>
//       </div>

//       <script>
//         const canvas = document.getElementById("matrixCanvas");
//         const ctx = canvas.getContext("2d");

//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;

//         const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
//         const fontSize = 18;
//         const columns = Math.floor(canvas.width / fontSize);
//         const drops = Array(columns).fill(1);

//         function draw() {
//           ctx.fillStyle = "rgba(0,0,0,0.05)";
//           ctx.fillRect(0, 0, canvas.width, canvas.height);

//           ctx.fillStyle = "#0F0";
//           ctx.font = fontSize + "px monospace";

//           for (let i = 0; i < drops.length; i++) {
//             const text = letters[Math.floor(Math.random() * letters.length)];
//             ctx.fillText(text, i * fontSize, drops[i] * fontSize);
//             drops[i]++;
//             if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
//               drops[i] = 0;
//             }
//           }
//         }

//         setInterval(draw, 33);

//         // Live date & time
//         function updateDateTime() {
//           const now = new Date();
//           document.getElementById("dateTime").textContent = now.toLocaleString();
//         }
//         setInterval(updateDateTime, 1000);
//         updateDateTime();

//         window.addEventListener("resize", () => {
//           canvas.width = window.innerWidth;
//           canvas.height = window.innerHeight;
//         });
//       </script>
//     </body>
//     </html>
//   `);
// });

// //global error handle
// app.use(globalErrorHandler);

// //handle not found route;
// app.use((req, res) => {
//   res.status(StatusCodes.NOT_FOUND).json({
//     success: false,
//     message: 'Not found',
//     errorMessages: [
//       {
//         path: req.originalUrl,
//         message: "API DOESN'T EXIST",
//       },
//     ],
//   });
// });

// export default app;
import cors from 'cors';
import YAML from 'yamljs';
import router from './routes';
import { Morgan } from './shared/morgen';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import express, { Request, Response } from 'express';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import './config/passport';
import path from 'path';
import passport from 'passport';

const app = express();

// -------------------
// Morgan logging
// -------------------
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// -------------------
// CORS setup
// -------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5174',
  "https://task-titans-admin-orcin.vercel.app",
  'http://localhost:5173',
  'http://localhost:5175',
  'https://task-titans-six.vercel.app',
  'https://task-titans-admin.vercel.app',
  'https://tier-elected-proc-cumulative.trycloudflare.com',
  'https://directory-supplements-adapter-designs.trycloudflare.com',
  // Add common development origins
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log('🔍 CORS Origin Check:', origin);
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('❌ Origin blocked:', origin);
        console.log('📋 Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true, // allow cookies/auth headers
  })
);

// Explicitly handle preflight OPTIONS requests
app.options(
  '*',
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

// -------------------
// Body parser
// -------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------
// Passport
// -------------------
app.use(passport.initialize());

// -------------------
// Static files
// -------------------
app.use(express.static('uploads'));

// -------------------
// Swagger
// -------------------
const swaggerDocument = YAML.load(
  path.join(__dirname, '../public/swagger.yaml')
);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// -------------------
// API routes
// -------------------
app.use('/api/v1', router);

// -------------------
// Live response
// -------------------
app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>Server is live 🚀</h1>`);
});

// -------------------
// Global error handler
// -------------------
app.use(globalErrorHandler);

// -------------------
// 404 handler
// -------------------
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
