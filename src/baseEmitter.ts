import { ICommand, IDataEmitter, IDataEvent, IDataEventListener, IDataEventListenerFunc, IDisposable, IEmitterDescription, IExecutionResult, IFormatSettings, ISettings, IStatusChangeListener, IStatusChangeListenerFunc, IStatusEvent, ITraceableAction } from "./dataEmitter";
import { LoggerFacade, LogLevel } from "./loggerFacade";
import { ProviderSingleton } from "./provider";
import { decrypt, encrypt } from "./common";
import { IJsonSerializable, isJsonSerializable } from "./chronicler";



/**
 * 
 */
export class BaseStatusEvent implements IStatusEvent {
    emitter: IDataEmitter;
    connected: boolean;
    bit: boolean;
    timestamp: Date;

    /**
     * 
     * @param {boolean} connected 
     * @param {boolean} bit 
     * @param {IDataEmitter} emitter
     * @param {Date} timestamp 
     */
    constructor(connected: boolean, bit: boolean, emitter: IDataEmitter, timestamp?: Date) {
        this.connected = connected;
        this.bit = bit;
        this.emitter = emitter;
        this.timestamp = timestamp || new Date();
    }

    /**
     * @return {Record<string, unknown>}
     */
    toJSON(): Record<string, unknown> {
        return {
            connected: this.connected,
            bit: this.bit,
            timestamp: this.timestamp
        }
    }
    
}

/**
 * Create a base data event
 */
export class BaseDataEvent implements IDataEvent {
    readonly emitter: IDataEmitter;
    readonly timestamp: Date;
    readonly data: unknown;
    readonly meta: unknown;

    /**
     * Create a data event object
     * @param {IDataEmitter} emitter 
     * @param {unknown} data 
     * @param {unknown} meta 
     */
    constructor(emitter: IDataEmitter, data: unknown, meta: unknown) {
        this.emitter = emitter;
        this.data = data;
        this.timestamp = new Date();
        this.meta = meta;
    }

    /**
     * Converts the object into a JSON friendly object
     * @return {Record<string, unknown>}
     */
    toJSON(): Record<string, unknown> {
        const ret = {
            emitter: this.emitter.toJSON(),
            timestamp: this.timestamp,
            data: this.data,
            meta: this.meta
        }
        if(isJsonSerializable(this.data)) {
            ret.data = (this.data as IJsonSerializable).toJSON();
        }
        if(isJsonSerializable(this.meta)) {
            ret.meta = (this.meta as IJsonSerializable).toJSON();
        }
        return ret;
    }
    
}

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
     * @param {LoggerFacade|undefined} _logger 
     */
    constructor(private _id: string, private _name: string, private _description: string, protected _logger:LoggerFacade|undefined = undefined) {
        this.log(LogLevel.DEBUG, "Creating BaseEmitter");
    }

    /**
     * serialize the important data that is needed to be able to recreate this emitter in it's current state
     * @param {IFormatSettings} settings used to specify expected format of the serialization
     * @return {Promise<string>}
     */
    serializeState(settings: IFormatSettings): Promise<string> {
        if(!settings.encrypted) {
            return Promise.resolve(JSON.stringify(this.getEmitterDescription()));
        } else {
            return encrypt(JSON.stringify(this.getEmitterDescription()), settings);
        }
    }
    
    /**
     * Control serialized properties when JSON.stringify is called
     * @return {Record<string, unknown>}
     */
    public toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            description: this.description,
            id: this.id
        }
    }

    /**
     * 
     * @param {IDataEvent} evt 
     */
    protected notifyDataListeners(evt:IDataEvent): void {
        this.log(LogLevel.TRACE, "Notifying data listeners");
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
        this.log(LogLevel.DEBUG, "adding data listener");
        if(typeof listener == 'function') listener = this.wrapDataListener(listener);
        this._dataListeners.add(listener);
        return {
            /**
             * remove the listener from the set
             */
            dispose: () => {
                this.log(LogLevel.DEBUG, "Removing data listener");
                this._dataListeners.delete(listener as IDataEventListener);
            }
        }
    }

    /**
     * 
     * @param {IStatusEvent} evt 
     */
    protected notifyStatusListeners(evt: IStatusEvent) : void  {
        this.log(LogLevel.DEBUG, `Notifying ${this._statusListeners.size} listeners of a status change`)
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
        this.log(LogLevel.DEBUG, "Adding status listener");
        if(typeof listener == 'function') listener = this.wrapStatusListener(listener);
        this._statusListeners.add(listener);
        return {
            dispose: () => {
                this.log(LogLevel.DEBUG, "Removing status listener");
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
        return new BaseStatusEvent(this._connected, this._faulted, this);
    }

    /**
     * build a data event
     * @param {unknown} data
     * @return {IDataEvent}
     */
    protected buildDataEvent(data: unknown): IDataEvent {
        return new BaseDataEvent(this, data, this.getMetaData());
    }

    /**
     * Sets how frequently the dc check is executed
     * @param {number} checkInterval
     * @param {number} threshold
     * @protected
     */
    protected setDCCheckInterval(checkInterval:number, threshold: number): void {
        this.log(LogLevel.DEBUG, `setting the d/c check interval to ${checkInterval}ms with a threshold of ${threshold}ms`);
        if(this._dcInterval != null) clearInterval(this._dcInterval);
        this._dcIntervalms = checkInterval;
        this._dcThresholdMs = threshold;
        this._dcInterval = setInterval(this.dcHandler.bind(this), this._dcIntervalms);
    }

    /**
     * Execute logic to detect disconnections and notify listeners
     * @private
     */
    private dcHandler(): void {
        this._logger?.debug('checking if emitter is disconnected');
        if(this._dcLastHeardTime == null) {
            this.log(LogLevel.DEBUG, 'no message from emitter yet, marking disconnected');
            this.disconnected();
            return;
        }
        const now = new Date();
        const last = this._dcLastHeardTime;
        const delta = now.getMilliseconds() - last.getMilliseconds();
        if(delta > this._dcThresholdMs) {
            this.log(LogLevel.DEBUG, `it has been ${delta}ms since we last heard from emitter, marking disconnected`);
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
        this.log(LogLevel.DEBUG, "Applying Settings");
        this.setName(settings.name); 
        this.setId(settings.id);
        this.setDescription(settings.description);
        return Promise.resolve({
            actionId: settings.actionId,
            success: true
        })
    }

    /**
     * Prefix a log message with information about the emitter
     * @param {string} msg 
     * @return {string} 
     */
    protected prefixLogMessage(msg: string) : string {
        return `${this.getType()}|${this.name}|${this.id}| ${msg}`;
    }

    /** 
     * Log information
     * @param {LogLevel} level 
     * @param {String} msg 
     * @return {void}
     */
    protected log(level: LogLevel, msg: string) : void {
        if(this._logger != null) {
            switch(level) {
                case LogLevel.TRACE:
                    return this._logger.trace(this.prefixLogMessage(msg));
                case LogLevel.DEBUG:
                    return this._logger.debug(this.prefixLogMessage(msg));
                case LogLevel.INFO:
                    return this._logger.info(this.prefixLogMessage(msg));
                case LogLevel.WARN:
                    return this._logger.warn(this.prefixLogMessage(msg));
                case LogLevel.ERROR:
                    return this._logger.error(this.prefixLogMessage(msg));
                case LogLevel.CRITICAL:
                    return this._logger.critical(this.prefixLogMessage(msg));
            }
        }
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
     * Get the emitter type for this emitter
     */
    abstract getType(): string;

    /**
     * Gets the emitter description which is used to recreate the emitter
     * @return {IEmitterDescription}
     */
    protected getEmitterDescription(): IEmitterDescription {
        return {
            type: this.getType(),
            name: this.name,
            description: this.description,
            id: this.id,
            emitterProperties: this.getEmitterProperties()
        }
    }

    /**
     * 
     * @return {unknown} 
     */
    protected getEmitterProperties(): unknown {
        return {};
    }

    /**
     * 
     * @param {string} stateData 
     * @param {IFormatSettings} settings 
     */
    public static async recreateEmitter(stateData: string, settings:IFormatSettings) : Promise<IDataEmitter> {
        let description:string;
        if(settings.encrypted) {
            description = await decrypt(stateData, settings);
        } else {
            description = stateData;
        }
        const emitterDescription:IEmitterDescription = JSON.parse(description) as IEmitterDescription;
        return ProviderSingleton.getInstance().buildEmitter(emitterDescription);
    }



    /**
     * Cleanup any resources/timers managed by the 
     * emitter
     */
    dispose(): void {
        this.log(LogLevel.DEBUG, "Disposing");
        if(this._dcInterval != null) clearInterval(this._dcInterval);
        this._dcInterval = undefined;
    }

}