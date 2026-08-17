const { createApp } = require('./src/app');
const { config } = require('./src/config/env');
const { initOraclePool, closeOraclePool } = require('./src/db/oracle');
const { logger } = require('./src/utils/logger');

async function bootstrap() {
  try {
    await initOraclePool();

    const app = createApp();

    // IMPORTANT for IIS/iisnode
    const port = process.env.PORT || config.port || 3000;

    const server = app.listen(port, '0.0.0.0', () => {
      logger.info(
        {
          port,
          env: config.nodeEnv,
          processPort: process.env.PORT
        },
        'Server started'
      );
    });

    server.on('error', async (error) => {
      logger.error(
        {
          err: error,
          port,
          processPort: process.env.PORT
        },
        'Server failed to start'
      );

      await closeOraclePool();
      process.exit(1);
    });

    const shutdown = async (signal) => {
      logger.info({ signal }, 'Shutting down gracefully');

      server.close(async () => {
        await closeOraclePool();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error(
      {
        err: error,
        message: error?.message,
        stack: error?.stack
      },
      'Failed to start server'
    );

    console.error('SERVER STARTUP ERROR:', error);

    process.exit(1);
  }
}

bootstrap();