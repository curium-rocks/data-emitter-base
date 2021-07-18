/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LoggerFacade {
    trace(msg: string, ...params:any) : void;
    debug(msg: string, ...params:any) : void;
    info(msg: string, ...params:any) : void;
    warn(msg: string, ...params:any) : void;
    error(msg: string, ...params:any) : void;
    critical(msg: string, ...params:any) : void;
}

export enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    CRITICAL
}