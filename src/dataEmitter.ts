import { IChronicler, IJsonSerializable } from "./chronicler";
import { ISerializableState } from "./common";
import { LoggerFacade } from "./loggerFacade";

/**
 * A action with a unique identifier, the identifier 
 * should be included in results such as {IExecutionResult}
 */
 export interface ITraceableAction {
    /**
     * Unique identifier, can be a UUID
     */
    readonly actionId: string;
}

/**
 * A settings object
 */
export interface ISettings {
    /**
     * Display name for a source
     */
    readonly name: string;
    /**
     * Unique identifier for a source, can be a UUID
     */
    readonly id: string;
    /**
     * A longer description of the source
     */
    readonly description: string;

    /**
     * additional settings that do not fit neatly for all sources
     */
    readonly additional: unknown;
}

/**
 * A command for the device, result should be traceable,
 * payload can be anything, specific to the emitter etc.
 */
export interface ICommand extends ITraceableAction {
    payload: unknown;
}
/**
 * The result of a requested action, could be from applying
 * settings, a command etc, should include the action id in the response
 */
export interface IExecutionResult extends ITraceableAction {
    success: boolean;
    failureReason?: string;
}

/**
 * Check if an object conforms to the IDataEvent interface
 * @param {uknown} obj
 * @return {boolean}
 */
 export function isDataEvent(obj: unknown) : boolean {
    if(obj == null) return false
    if(typeof obj != 'object') return false;
    const record = obj as Record<string, unknown>;
    return record.emitter != null && record.timestamp != null &&
     record.data != null && record.meta != null;
}

export interface IEmitterEvent extends IJsonSerializable {
    /**
     * Source of the event
     */
    readonly emitter: IDataEmitter;
}

/**
 * A data emission event
 */
export interface IDataEvent extends IEmitterEvent {
    /**
     * Time of data event
     */
    readonly timestamp: Date;
    /**
     * Data payload
     */
    readonly data: unknown;
    /**
     * Meta information 
     */
    readonly meta: unknown;
}

/**
 * Check if an object conforms to the IStatusEvent interface
 * @param {unknown} obj
 * @return {boolean}
 */
export function isStatusEvent(obj: unknown) : boolean {
    if(obj == null) return false;
    if(typeof obj != 'object') return false;
    const record = obj as Record<string, unknown>
    return record.connected != null && record.bit != null && record.timestamp != null;
}
/**
 * A status event, this include information about connection status changes, built in test failures (BIT) etc
 */
export interface IStatusEvent extends IEmitterEvent {

    /**
     * source connection state
     */
    readonly connected: boolean;
    /**
     * built in test pass/fail state
     */
    readonly bit: boolean;
    /**
     * timestamp of the event
     */
    readonly timestamp: Date;
}
/**
 * A listener that receives data events
 */
export interface IDataEventListener {
    /**
     * 
     * @param dataEvent 
     */
    onData(dataEvent:IDataEvent): void;
}

/**
 * A simple function interface where a inline function is preferrable 
 * to attaching to class function
 */
export interface IDataEventListenerFunc {
    (dataEvt:IDataEvent): void;
}
/**
 * A Listener that receives status change events
 */
export interface IStatusChangeListener {
    /**
     * 
     * @param statusEvent 
     */
    onStatus(statusEvent:IStatusEvent): void;
}

/**
 * Simplified pattern for providing inline function as a status change listener
 */
export interface IStatusChangeListenerFunc {
    (statusEvent:IStatusEvent): void;
}

/**
 * A disposable item, this is used for cleaning up resources such as timers, connections
 */
export interface IDisposable {
    /**
     * 
     */
    dispose(): void;
}

/**
 * For when a class needs to clean up resources asynchronously
 */
export interface IDisposableAsync {
    disposeAsync(): Promise<void>
}

export interface IClassifier {
    /**
     * unique id for a resource or entity
     */
     readonly id: string;

     /**
      * name for the resource or entity
      */
     readonly name: string;
 
     /**
      * Description of the resource or entity
      */
     readonly description: string;
}

/**
 * A data source emitter
 */
export interface IDataEmitter extends IJsonSerializable, IClassifier, ISerializableState {
    
    /**
     * Register a data listener that will receive events on new data
     * @param listener 
     */
    onData(listener: IDataEventListener|IDataEventListenerFunc): IDisposable;
    /**
     * Register a status listener that will receieve events on status change
     * @param listener 
     */
    onStatus(listener: IStatusChangeListener|IStatusChangeListenerFunc): IDisposable;
    /**
     * Apply settings for this data source/emitter
     * @param settings 
     */
    applySettings(settings:ISettings): Promise<IExecutionResult>;
    /**
     * Send a command to the emitter or data source
     * @param command 
     */
    sendCommand(command:ICommand): Promise<IExecutionResult>;
    /**
     * Probe the status of the data source/emitter
     */
    probeStatus(): Promise<IStatusEvent>;
    /**
     * Probe the latest data for the data source/emitter
     */
    probeCurrentData(): Promise<IDataEvent>;
}

export interface IFormatSettings {
    /**
     * Whether the state data is encrypted or not
     */
    encrypted: boolean;
    /**
     * Meta data about the encrypted data, such as an emitter, chronicler type
     */
    type: string;
    /**
     * The algorithm of encryption, such as aes-256-gcm
     */
    algorithm?: string;
    /**
     * Initialization vector to use if available
     */
    iv?: string;
    /**
     * Tag to use if available/applicable
     */
    tag?: string;
    /**
     * key to use
     */
    key?: string;
    /**
     * When using a key store, the name of the key to use
     */
    keyName?: string;
}

/**
 *  A interface that describes a composite data source that takes several related 
 * emitters and combines it into one
 */
export interface ICompoundDataEmitter extends IDataEmitter {
    /**
     * Used to pull out specified emitter instances
     * @param id 
     */
    getIndividualEmitter(id: string): IDataEmitter;
    /**
     * Get the complete list of emitters
     */
    getEmitters(): Array<IDataEmitter>;
}

export interface IEmitterProvider extends IEmitterFactory {
    registerEmitterFactory(type: string, factory: IEmitterFactory): void;
    hasEmitterFactory(type: string): boolean;
    getEmitterFactoryTypes(): Array<string>;
}
export interface IEmitterFactory {
    buildEmitter(description:IEmitterDescription) : Promise<IDataEmitter>;
    recreateEmitter(base64StateData:string, formatSettings: IFormatSettings): Promise<IDataEmitter>;
    setLoggerFacade(loggerFacade: LoggerFacade): void;
}

export interface IChroniclerProvider extends IChroniclerFactory {
    registerChroniclerFactory(type: string, factory: IChroniclerFactory): void;
    hasChroniclerFactory(type: string): boolean;
    getChroniclerFactoryTypes(): Array<string>;
}

export interface IChroniclerFactory {
    buildChronicler(description:IChroniclerDescription) : Promise<IChronicler>;
    recreateChronicler(base64StateData: string, formatSettings: IFormatSettings) : Promise<IChronicler>;
    setLoggerFacade(loggerFacade: LoggerFacade): void;
}

export interface IEmitterDescription {
    emitterProperties: unknown;
    type: string;
    name: string;
    id: string;
    description: string;
}

export interface IChroniclerDescription {
    chroniclerProperties: unknown;
    type: string;
    name: string;
    id: string;
    description: string;
}
