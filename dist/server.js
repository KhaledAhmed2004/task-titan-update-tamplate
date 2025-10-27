"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const seedAdmin_1 = require("./DB/seedAdmin");
const socketHelper_1 = require("./helpers/socketHelper");
const logger_1 = require("./shared/logger");
const redis_1 = require("./config/redis");
const CacheHelper_1 = require("./app/shared/CacheHelper");
//uncaught exception
process.on('uncaughtException', error => {
    logger_1.errorLogger.error('UnhandleException Detected', error);
    process.exit(1);
});
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Environment & config logs
            logger_1.logger.info(`🌐 Environment: ${config_1.default.node_env || 'unknown'}`);
            logger_1.logger.info(`🛠️ Debug Mode: ${config_1.default.node_env === 'development' ? 'ON' : 'OFF'}`);
            logger_1.logger.info(`🔗 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
            mongoose_1.default.connect(config_1.default.database_url);
            logger_1.logger.info('🚀 Database connected successfully');
            //Seed Super Admin after database connection is successful
            yield (0, seedAdmin_1.seedSuperAdmin)();
            const port = typeof config_1.default.port === 'number' ? config_1.default.port : Number(config_1.default.port);
            server = app_1.default.listen(port, config_1.default.ip_address, () => {
                logger_1.logger.info(`♻️ Application listening on port:${config_1.default.port}`);
            });
            // Initialize Redis client and CacheHelper
            const redis = (0, redis_1.getRedisClient)();
            const redisOk = yield (0, redis_1.redisPing)();
            const cache = CacheHelper_1.CacheHelper.getInstance();
            //socket
            const io = new socket_io_1.Server(server, {
                pingTimeout: 60000,
                cors: {
                    origin: '*',
                },
            });
            socketHelper_1.socketHelper.socket(io);
            //@ts-ignore
            global.io = io;
            // Startup Summary
            const summary = [
                `📝 Startup Summary:`,
                `      - DB connected ${mongoose_1.default.connection.readyState === 1 ? '✅' : '❌'}`,
                `      - Redis connected ${redisOk ? '✅' : '❌'}`,
                `      - CacheHelper initialized ${cache ? '✅' : '❌'}`,
                `      - RateLimit active ✅`,
                `      - Debug Mode ${config_1.default.node_env === 'development' ? 'ON ✅' : 'OFF ❌'}`,
            ].join('\n');
            logger_1.logger.info(summary);
        }
        catch (error) {
            logger_1.errorLogger.error('❌ Database connection failed');
            (0, logger_1.notifyCritical)('Database Connection Failed', (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        }
        //handle unhandleRejection
        process.on('unhandledRejection', error => {
            if (server) {
                server.close(() => {
                    logger_1.errorLogger.error('❌ UnhandledRejection Detected');
                    (0, logger_1.notifyCritical)('Unhandled Rejection', (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
                    process.exit(1);
                });
            }
            else {
                process.exit(1);
            }
        });
    });
}
main();
//SIGTERM
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM IS RECEIVE');
    if (server) {
        server.close();
    }
});
