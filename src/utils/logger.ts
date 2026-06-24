export interface Logger {
  warn: (message: any, ...args: any[]) => void
  error: (message: any, ...args: any[]) => void
}

let activeLogger: Logger = {
  warn: (message, ...args) => console.warn(message, ...args),
  error: (message, ...args) => console.error(message, ...args),
}

export const logger = {
  warn(message: any, ...args: any[]) {
    activeLogger.warn(message, ...args)
  },
  error(message: any, ...args: any[]) {
    activeLogger.error(message, ...args)
  },
}

export function setLogger(customLogger: Partial<Logger>) {
  activeLogger = {
    warn:
      typeof customLogger.warn === 'function'
        ? customLogger.warn
        : (m, ...a) => console.warn(m, ...a),
    error:
      typeof customLogger.error === 'function'
        ? customLogger.error
        : (m, ...a) => console.error(m, ...a),
  }
}
