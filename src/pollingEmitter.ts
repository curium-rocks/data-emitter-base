import { BaseEmitter } from "./baseEmitter";
import { IDataEvent, IExecutionResult, ISettings, IStatusEvent, ITraceableAction } from "./dataEmitter";
import { LoggerFacade, LogLevel } from "./loggerFacade";

export interface IPollingSettings {
    interval: number
}

/**
 * A base class that handles the scheduling of a polled fetch
 * to collect information and emit it
 */
export abstract class PollingEmitter extends BaseEmitter {
    protected _intervalTimer?: ReturnType<typeof setInterval>;
    protected _lastDataEvent?: IDataEvent;
    protected _lastStatusEvent?: IStatusEvent;

    /**
     * 
     * @param {string} id 
     * @param {string} name 
     * @param {string} desc 
     * @param {number} interval
     * @param {LoggerFacade|undefined} logger
     */
    constructor(id:string, name: string, desc: string, protected _interval: number, logger:LoggerFacade|undefined = undefined){
        super(id,name, desc, logger);
        this.log(LogLevel.DEBUG, "Creating PollingEmitter");
    }

    /**
     * Execute the poll and emit the result
     * @return {Promise<void>}
     */
    protected pollExecutor(): Promise<void> {
        this.log(LogLevel.DEBUG, `polling data source`);
        return this.poll().then( (res:unknown) => {
            this.log(LogLevel.DEBUG,`finished polling data source, result = ${res}`);
            this.connected();
            this.clearIfFaulted();
            this._lastDataEvent = this.buildDataEvent(res);
            this.notifyDataListeners(this._lastDataEvent);
        }).catch( (err) => { 
            this.log(LogLevel.ERROR, `Error while polling data source, error = ${err}`);
            this.faulted();
        });
    }

    /**
     * Start polling
     */
    public startPolling(): void {
        this.log(LogLevel.DEBUG, "Starting Polling");
        this.stopPolling();
        this._intervalTimer = setInterval(this.pollExecutor.bind(this), this._interval);
    }

    /**
     * Stop polling
     */
    public stopPolling(): void {
        if(this._intervalTimer != null) {
            this.log(LogLevel.DEBUG, "Stopping Polling");
            clearInterval(this._intervalTimer);
        }
        this._intervalTimer = undefined;
    }

    /**
     * probe current data
     * @return {IDataEvent}
     */
    public probeCurrentData(): Promise<IDataEvent> {
        this.log(LogLevel.DEBUG, "Probe current data");
        if(this._lastDataEvent) return Promise.resolve(this._lastDataEvent);
        return Promise.resolve(this.buildDataEvent(null));
    }

    /**
     * probe the status
     * @return {IStatusEvent}
     */
    public probeStatus(): Promise<IStatusEvent> {
        this.log(LogLevel.DEBUG, "Probe current status");
        if(this._lastStatusEvent) return Promise.resolve(this._lastStatusEvent);
        return Promise.resolve(this.buildStatusEvent())
    }

    /**
     * set settings
     * @param {ISettings} settings 
     * @return {Promise<IExecutionResult>}
     */
    public async applySettings(settings: ISettings & ITraceableAction & IPollingSettings): Promise<IExecutionResult> {
        this.log(LogLevel.DEBUG, "Applying Settings");
        const result = await super.applySettings(settings);
        if(!result.success) return result;
        this._interval = settings.interval;
        this.startPolling();
        return Promise.resolve({
            actionId: settings.actionId,
            success: true
        })
    }

    /**
     * Poll the resource 
     */
    abstract poll(): Promise<unknown>;

    /**
     * Clean up timers used for polling
     */
    public override dispose(): void {
        this.log(LogLevel.DEBUG, "Disposing");
        super.dispose();
        if(this._intervalTimer != null) clearInterval(this._intervalTimer);
    }
}

/**
 * Polls a data source but only emits data events
 * when the data changes
 */
export abstract class DeltaPollingEmitter extends PollingEmitter {

    /**
     * Execute the poll and emit the result if there has been a change
     * @return {Promise<void>}
     */
     protected pollExecutor(): Promise<void> {
        this.log(LogLevel.DEBUG, "Polling");
        return this.poll().then( (res:unknown) => {
            this.log(LogLevel.DEBUG, "Retrieved result from data source");
            this.connected();
            this.clearIfFaulted();
            const dataEvt = this.buildDataEvent(res);
            if(this.hasChanged(dataEvt)) {
                this.log(LogLevel.DEBUG, "Publishing event");
                this._lastDataEvent = dataEvt;
                this.notifyDataListeners(this._lastDataEvent);
            } else {
                this.log(LogLevel.DEBUG, "Data has not changed");
            }
        }).catch( (err) => {
            this.log(LogLevel.ERROR, `Error while fetching data ${err}`);
            this.faulted();
        });
    }

    /**
     * Check if the data event includes changes
     * @param {IDataEvent} evt 
     */
    abstract hasChanged(evt: IDataEvent): boolean;
}