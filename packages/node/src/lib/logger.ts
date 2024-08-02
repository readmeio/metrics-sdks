interface Log {
    message: string;
    args?: Record<string, unknown>;
}

type ErrorLog = Log & { err: Error }

function formatMessage(
    level: 'TRACE' | 'DEBUG' | 'ERROR',
    message: string
) {
    return [`${level} ${new Date().toISOString()} [readmeio] ${message}`]
}

export interface Logger {
    trace(log: Log): void;
    debug(log: Log): void;
    error(log: ErrorLog): void;
}

export default class ConsoleLogger {
    trace({ message, args }: Log) {
        const params: unknown[] = formatMessage('TRACE', message)
        if (args) {
            params.push('\nArguments:', args)
        }
        console.debug(...params)
    }
    debug({ message, args }: Log) {
        const params: unknown[] = formatMessage('DEBUG', message)
        if (args) {
            params.push('\nArguments:', args)
        }
        console.debug(...params)    
    }
    error({ message, args, err }: ErrorLog) {
        const params: unknown[] = formatMessage('ERROR', message)
        if (args) {
            params.push('\nArguments:', args)
        }
        if (err) {
            params.push('\n', err);
        }
        console.error(...params)
    }
}