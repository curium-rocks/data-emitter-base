import { ICommand, IDataEmitter, IDataEvent, IDataEventListener, IDataEventListenerFunc, IDisposable, IExecutionResult, ISettings, IStatusChangeListener, IStatusChangeListenerFunc, IStatusEvent, ITraceableAction } from "./dataEmitter";

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
    private _dcInterval?: ReturnType<typeof setInterval>;

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
    public get description():string {
        return this._description;
    }


    /**
     * 
     * @param {string} _id 
     * @param {string} _name 
     * @param {string} _description 
     */
    constructor(private _id: string, private _name: string, private _description: string) {}

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
    onData(listener: IDataEventListener|IDataEventListenerFunc): IDisposable {
        if(typeof listener == 'function') listener = this.wrapDataListener(listener);
        this._dataListeners.add(listener);
        return {
            /**
             * remove the listener from the set
             */
            dispose: () => {
                this._dataListeners.delete(listener as IDataEventListener);
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
     * @param {string} description 
     */
    protected setDescription(description: string) : void {
        this._description = description;
    }

    /**
     * Set the unique identifier for the emitter
     * @param {string} id 
     */
    protected setId(id: string) : void {
        this._id = id;
    }
    /**
     * Takes a simple function listener parameter and turns it into the listener interface
     * format
     * @param {IStatusChangeListenerFunc} listener 
     * @return {IStatusChangeListener} 
     */
    protected wrapStatusListener(listener:IStatusChangeListenerFunc): IStatusChangeListener {
        return {
            onStatus: listener
        }
    }

    /**
     * Wrap a data listener function into a {IDataEventListener}
     * @param {IDataEventListenerFunc} listener 
     * @return {IDataEventListener}
     */
    protected wrapDataListener(listener:IDataEventListenerFunc): IDataEventListener {
        return {
            onData: listener
        }
    }

    /**
     * 
     * @param {IStatusChangeListener} listener 
     * @return {IDisposable} 
     */
    onStatus(listener: IStatusChangeListener|IStatusChangeListenerFunc): IDisposable {
        if(typeof listener == 'function') listener = this.wrapStatusListener(listener);
        this._statusListeners.add(listener);
        return {
            dispose: () => {
                this._statusListeners.delete(listener as IStatusChangeListener);
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
     * build a status event
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
     * Apply settings to the emitter, this could be emitter settings
     * such as poll intervel, d/c threshold, or use the additional 
     * property to apply settings to the underlying source
     * @param {ISettings} settings 
     * @return {Promise<IExecutionResul>}
     */
    public applySettings(settings: ISettings & ITraceableAction): Promise<IExecutionResult> {
        this.setName(settings.name); 
        this.setId(settings.id);
        this.setDescription(settings.description);
        return Promise.resolve({
            actionId: settings.actionId,
            success: true
        })
    }

    /**
     * Send a command to the emitter, this could change emitter behavior,
     * write something directly the unlderying source etc.
     * @param {ITraceableAction} command
     * @return {Promise<IExecutionResult>} 
     */
    abstract sendCommand(command: ICommand): Promise<IExecutionResult>;

    /**
     * Fetch the latest state information such as connectivity
     * from the emitter, this could be cached from last event emission or generated
     * each time
     * @return {Promise<ITraceableAction>} 
     */
    abstract probeStatus(): Promise<IStatusEvent>;
    
    /**
     * Probe the current data, this could return the
     * last emitted data for event based streams,
     * or actually trigger fetching the latest from the 
     * source
     * @return {Promise<IDataEvent>}
     */
    abstract probeCurrentData(): Promise<IDataEvent>;

    /**
     * Get meta data associated with this emitter, this varies
     * per emitter implementation
     * @return {unknown}
     */
    abstract getMetaData(): unknown;

    /**
     * Cleanup any resources/timers managed by the 
     * emitter
     */
    dispose(): void {
        if(this._dcInterval) clearInterval(this._dcInterval);
        this._dcInterval = undefined;
    }

}