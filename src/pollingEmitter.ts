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

    protected _intervalTimer?: number;
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
    public applySettings(settings: ISettings & ITraceableAction & IPollingSettings): Promise<IExecutionResult> {
        this.setName(settings.name); 
        this.setId(settings.id);
        this.setCommLink(settings.commLink);
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