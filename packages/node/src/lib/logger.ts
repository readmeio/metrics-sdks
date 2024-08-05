interface Log {
    args?: Record<string, unknown>;
    message: string;
}

type ErrorLog = Log & { err: Error }

export interface Logger {
    debug(log: Log): void;
    error(log: ErrorLog): void;
    trace(log: Log): void;
}

class DefaultLogger implements Logger {
    private static instance: Logger;

    static getInstance(): Logger {
        if (!DefaultLogger.instance) {
            DefaultLogger.instance = new DefaultLogger();
        } 
        return DefaultLogger.instance;
    }

    // eslint-disable-next-line class-methods-use-this
    private formatMessage(
        level: 'DEBUG' | 'ERROR' | 'TRACE',
        message: string
    ) {
        return [`${level} ${new Date().toISOString()} [readmeio] ${message}`]
    }

    trace({ message, args }: Log) {
        const params: unknown[] = this.formatMessage('TRACE', message)
        if (args) {
            params.push('\nArguments:', args)
        }
        console.debug(...params)
    }

    debug({ message, args }: Log) {
        const params: unknown[] = this.formatMessage('DEBUG', message)
        if (args) {
            params.push('\nArguments:', args)
        }
        console.debug(...params)    
    }

    error({ message, args, err }: ErrorLog) {
        const params: unknown[] = this.formatMessage('ERROR', message)
        if (args) {
            params.push('\nArguments:', args)
        }
        if (err) {
            params.push('\n', err);
        }
        console.error(...params)
    }
}

export const logger = DefaultLogger.getInstance();