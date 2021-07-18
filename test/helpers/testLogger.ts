import { LoggerFacade } from "../../src/loggerFacade";

const shouldLog = process.env.shouldLog;
/**
 * Maps to console
 */
export class TestLogger implements LoggerFacade {

    /**
     * 
     * @return {number}
     */
    getTime(): number {
        return new Date().getTime();
    }
    /**
     * 
     * @param {string} msg 
     * @param {never} params 
     */
    trace(msg: string, ...params: never): void {
        if(shouldLog) console.debug(`${this.getTime()}|TRACE|${msg}`);
    }
    /**
     * 
     * @param {string} msg 
     * @param {never} params 
     */
    debug(msg: string, ...params: never): void {
        if(shouldLog) console.debug(`${this.getTime()}|DEBUG|${msg}`);
    }
    /**
     * 
     * @param {string}  msg 
     * @param {never} params 
     */
    info(msg: string, ...params: never): void {
        if(shouldLog) console.log(`${this.getTime()}|INFO|${msg}`);
    }
    /**
     * 
     * @param {string} msg 
     * @param {never} params 
     */
    warn(msg: string, ...params: never): void {
        if(shouldLog) console.warn(`${this.getTime()}|WARN|${msg}`);
    }
    /**
     * 
     * @param {string} msg 
     * @param {never} params 
     */
    error(msg: string, ...params: never): void {
        if(shouldLog) console.error(`${this.getTime()}|ERROR|${msg}`);
    }
    /**
     * 
     * @param {string} msg 
     * @param {string} params 
     */
    critical(msg: string, ...params: never): void {
        if(shouldLog) console.error(`${this.getTime()}|CRITICAL|${msg}`);
    }

}