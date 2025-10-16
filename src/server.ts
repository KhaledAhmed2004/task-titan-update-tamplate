import colors from 'colors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import { seedSuperAdmin } from './DB/seedAdmin';
import { socketHelper } from './helpers/socketHelper';
import { errorLogger, logger, notifyCritical } from './shared/logger';
import { getRedisClient, redisPing } from './config/redis';
import { CacheHelper } from './app/shared/CacheHelper';

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  process.exit(1);
});

let server: any;
async function main() {
  try {
    // Environment & config logs
    logger.info(`🌐 Environment: ${config.node_env || 'unknown'}`);
    logger.info(`🛠️ Debug Mode: ${config.node_env === 'development' ? 'ON' : 'OFF'}`);
    logger.info(`🔗 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

    mongoose.connect(config.database_url as string);
    logger.info('🚀 Database connected successfully');

    //Seed Super Admin after database connection is successful
    await seedSuperAdmin();

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);

    server = app.listen(port, config.ip_address as string, () => {
      logger.info(`♻️ Application listening on port:${config.port}`);
    });

    // Initialize Redis client and CacheHelper
    const redis = getRedisClient();
    const redisOk = await redisPing();
    const cache = CacheHelper.getInstance();

    //socket
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
      },
    });
    socketHelper.socket(io);
    //@ts-ignore
    global.io = io;

    // Startup Summary
    const summary = [
      `📝 Startup Summary:`,
      `      - DB connected ${mongoose.connection.readyState === 1 ? '✅' : '❌'}`,
      `      - Redis connected ${redisOk ? '✅' : '❌'}`,
      `      - CacheHelper initialized ${cache ? '✅' : '❌'}`,
      `      - RateLimit active ✅`,
      `      - Debug Mode ${config.node_env === 'development' ? 'ON ✅' : 'OFF ❌'}`,
    ].join('\n');
    logger.info(summary);
  } catch (error) {
    errorLogger.error('❌ Database connection failed');
    notifyCritical('Database Connection Failed', (error as Error)?.message || 'Unknown error');
  }

  //handle unhandleRejection
  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        errorLogger.error('❌ UnhandledRejection Detected');
        notifyCritical('Unhandled Rejection', (error as Error)?.message || 'Unknown error');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

main();

//SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVE');
  if (server) {
    server.close();
  }
});
