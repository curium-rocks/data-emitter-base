import { ICommand, IDataEmitter, IDataEvent, IDataEventListener, IDisposable, IExecutionResult, ISettings, IStatusChangeListener, IStatusEvent, ITraceableAction } from "./dataEmitter";

/**
 * Abstract base class emitter that takes care of managing registrations of
 * listeners and cleanup on disposal
 */
export abstract class BaseEmitter implements IDataEmitter, IDisposable {
    /**
     * Listener collection for data change listeners
     */
    private readonly _dataListeners: Set<IDataEventListener> = new Set<IDataEventListener>();
    /**
     * Listener collection for status change listeners
     */
    private readonly _statusListeners: Set<IStatusChangeListener> = new Set<IStatusChangeListener>();

    /**
     * connected state
     */
    private _connected = false;

    /**
     * faulted state
     */
    private _faulted = false;

    /**
     * DC check interval handle
     * @private
     */
    private _dcInterval?: number;

    /**
     * amount of time between dc checks
     * @private
     */
    private _dcIntervalms?: number;

    /**
     * amount of time since successful message emission till we consider
     * the state to be disconnected
     * @private
     */
    private _dcThresholdMs = 60000;

    /**
     * The last time the source has successfully produced data
     * @private
     */
    private _dcLastHeardTime?: Date;

    /**
     * @return {string} unique id for emitter
     */
    public get id():string {
        return this._id;
    }

    /**
     * @return {string} emitter name
     */
    public get name():string {
        return this._name;
    }

    /**
     * @return {string} communication link description
     */
    public get commLinkDesc():string {
        return this._commLinkDesc;
    }


    /**
     * 
     * @param {string} _id 
     * @param {string} _name 
     * @param {string} _commLinkDesc 
     */
    constructor(private _id: string, private _name: string, private _commLinkDesc: string) {}

    /**
     * 
     * @param {IDataEvent} evt 
     */
    protected notifyDataListeners(evt:IDataEvent): void {
        this._dataListeners.forEach((listener)=>{
            listener.onData(evt);
        })
    }

    /**
     * 
     * @param {IDataEventListener} listener 
     * @return {IDisposable} 
     */
    onData(listener: IDataEventListener): IDisposable {
        this._dataListeners.add(listener);
        return {
            /**
             * remove the listener from the set
             */
            dispose: () => {
                this._dataListeners.delete(listener);
            }
        }
    }

    /**
     * 
     * @param {IStatusEvent} evt 
     */
    protected notifyStatusListeners(evt: IStatusEvent) : void  {
        this._statusListeners.forEach( (listener) => {
            listener.onStatus(evt);
        })
    }

    /**
     * 
     * @param {string} name 
     */
    protected setName(name:string): void {
        this._name = name;
    }

    /**
     * 
     * @param {string} commLink 
     */
    protected setCommLink(commLink: string) : void {
        this._commLinkDesc = commLink;
    }

    /**
     * 
     * @param {string} id 
     */
    protected setId(id: string) : void {
        this._id = id;
    }

    /**
     * 
     * @param {IStatusChangeListener} listener 
     * @return {IDisposable} 
     */
    onStatus(listener: IStatusChangeListener): IDisposable {
        this._statusListeners.add(listener);
        return {
            dispose: () => {
                this._statusListeners.delete(listener);
            }
        }
    }

    /**
     * Clear any faults and notify listeners of change if change
     */
    protected clearIfFaulted(): void {
        if(this._faulted) {
            this._faulted = false;
            this.notifyStatusListeners(this.buildStatusEvent());
        }
    }

    /**
     * faulted
     */
    protected faulted(): void {
        if(!this._faulted) {
            this._faulted = true;
            this.notifyStatusListeners(this.buildStatusEvent());
        }
    }

    /**
     * connected
     */
    protected connected(): void {
        if(!this._connected){
            this._connected = true;
            this.notifyStatusListeners(this.buildStatusEvent());
        }
    }

    /**
     * disconnected
     */
    protected disconnected(): void {
        if(this._connected) {
            this._connected = false;
            this.notifyStatusListeners(this.buildStatusEvent());
        }
    }

    /**
     * 
     * @return {IStatusEvent} 
     */
    protected buildStatusEvent(): IStatusEvent {
        return {
            connected: this._connected,
            timestamp: new Date(),
            bit: this._faulted
        }
    }

    /**
     * build a data event
     * @param {unknown} data
     * @return {IDataEvent}
     */
    protected buildDataEvent(data: unknown): IDataEvent {
        return {
            emitter: this,
            timestamp: new Date(),
            data: data,
            meta: this.getMetaData()
        }
    }

    /**
     * Sets how frequently the dc check is executed
     * @param {number} checkInterval
     * @param {number} threshold
     * @protected
     */
    protected setDCCheckInterval(checkInterval:number, threshold: number): void {
        if(this._dcInterval) clearInterval(this._dcInterval);
        this._dcIntervalms = checkInterval;
        this._dcThresholdMs = threshold;
        this._dcInterval = setInterval(this.dcHandler.bind(this), this._dcIntervalms);
    }

    /**
     * Execute logic to detect disconnections and notify listeners
     * @private
     */
    private dcHandler(): void {
        if(this._dcLastHeardTime == null) {
            this.disconnected();
            return;
        }
        const now = new Date();
        const last = this._dcLastHeardTime;
        const delta = now.getMilliseconds() - last.getMilliseconds();
        if(delta > this._dcThresholdMs) {
            this.disconnected();
        }
    }
    
    /**
     * 
     * @param {ISettings} settings 
     * @return {Promise<ITraceableAction}
     */
    abstract applySettings(settings: ISettings & ITraceableAction): Promise<IExecutionResult>;
    
    /**
     * 
     * @param {ITraceableAction} command
     * @return {Promise<IExecutionResult>} 
     */
    abstract sendCommand(command: ICommand): Promise<IExecutionResult>;

    /**
     * @return {Promise<ITraceableAction>} 
     */
    abstract probeStatus(): Promise<IStatusEvent>;
    
    /**
     * @return {Promise<IDataEvent>}
     */
    abstract probeCurrentData(): Promise<IDataEvent>;

    /**
     * @return {unknown}
     */
    abstract getMetaData(): unknown;

    /**
     * Cleanup any resources/timers
     */
    dispose(): void {
        if(this._dcInterval) clearInterval(this._dcInterval);
        this._dcInterval = undefined;
    }

}