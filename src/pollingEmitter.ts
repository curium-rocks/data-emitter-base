import { BaseEmitter } from "./baseEmitter";
import { IDataEvent, IExecutionResult, ISettings, IStatusEvent, ITraceableAction } from "./dataEmitter";

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
     */
    constructor(id:string, name: string, desc: string, private _interval: number){
        super(id,name, desc);
    }

    /**
     * Execute the poll and emit the result
     * @return {Promise<void>}
     */
    protected pollExecutor(): Promise<void> {
        return this.poll().then( (res:unknown) => {
            this.connected();
            this.clearIfFaulted();
            this._lastDataEvent = this.buildDataEvent(res);
            this.notifyDataListeners(this._lastDataEvent);
        }).catch( () => { 
            this.faulted();
        });
    }

    /**
     * Start polling
     */
    public startPolling(): void {
        this.stopPolling();
        this._intervalTimer = setInterval(this.pollExecutor.bind(this), this._interval);
    }

    /**
     * Stop polling
     */
    public stopPolling(): void {
        if(this._intervalTimer) clearInterval(this._intervalTimer);
        this._intervalTimer = undefined;
    }

    /**
     * probe current data
     * @return {IDataEvent}
     */
    public probeCurrentData(): Promise<IDataEvent> {
        if(this._lastDataEvent) return Promise.resolve(this._lastDataEvent);
        return Promise.resolve(this.buildDataEvent(null));
    }

    /**
     * probe the status
     * @return {IStatusEvent}
     */
    public probeStatus(): Promise<IStatusEvent> {
        if(this._lastStatusEvent) return Promise.resolve(this._lastStatusEvent);
        return Promise.resolve(this.buildStatusEvent())
    }

    /**
     * set settings
     * @param {ISettings} settings 
     * @return {Promise<IExecutionResult>}
     */
    public async applySettings(settings: ISettings & ITraceableAction & IPollingSettings): Promise<IExecutionResult> {
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
        return this.poll().then( (res:unknown) => {
            this.connected();
            this.clearIfFaulted();
            const dataEvt = this.buildDataEvent(res);
            if(this.hasChanged(dataEvt)) {
                this._lastDataEvent = dataEvt;
                this.notifyDataListeners(this._lastDataEvent);
            }
        }).catch( () => { 
            this.faulted();
        });
    }

    /**
     * Check if the data event includes changes
     * @param {IDataEvent} evt 
     */
    abstract hasChanged(evt: IDataEvent): boolean;
}