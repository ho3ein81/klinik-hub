import winston from 'winston'
import path from 'path'
import { env } from '../config/env'

const LOG_DIR = path.join(process.cwd(), 'logs')

const isProduction = env.NODE_ENV === 'production'

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} ${level}: ${message}${metaStr}`
  }),
)

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
)

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
    }),
  ],
})
