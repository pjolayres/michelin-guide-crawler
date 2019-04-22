import winston from 'winston';
import moment from 'moment';
import fs from 'fs';

const date = moment();
const timestamp = date.format('YYYY-MM-DD_HH-mm-ss');
const defaultConsoleLogLevel = 'debug';
const defaultFileLogLevel = 'error';

fs.mkdir('./logs', () => { /* no-op */ });

const logger = winston.createLogger();

if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.splat(),
      winston.format.printf(info => `${new Date(info.timestamp).toISOString()} ${info.level}: ${info.message}`)
    ),
    level: process.env.LOG_LEVEL || defaultConsoleLogLevel
  }));

  logger.log('info', `Console logger initialized to "${process.env.LOG_LEVEL || `${defaultConsoleLogLevel} (default)`}"`);
}

logger.add(new winston.transports.File({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.printf(info => `${new Date(info.timestamp).toISOString()} - ${info.level}: ${info.message}`)
  ),
  filename: `./logs/${timestamp}_log.log`,
  level: process.env.LOG_LEVEL || defaultFileLogLevel,
  maxsize: 1024 * 1024 * 10 // 10 MB rolling log files
}));

logger.log('info', `File logger initialized to "${process.env.LOG_LEVEL || `${defaultFileLogLevel} (default)`}"`);

/*
Logging levels are as follows:
  error: 0
  warn: 1
  info: 2
  verbose: 3
  debug: 4
  silly: 5
*/

export default {
  debug: (...args) => {
    logger.log('debug', ...args);
  },
  verbose: (...args) => {
    logger.log('verbose', ...args);
  },
  info: (...args) => {
    logger.log('info', ...args);
  },
  warn: (...args) => {
    logger.log('warn', ...args);
  },
  error: (...args) => {
    logger.log('error', ...args);
  }
};
