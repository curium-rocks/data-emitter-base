/**
 * 
 */
export interface ITraceableAction {
    /**
     * 
     */
    readonly actionId: string;
}

/**
 * 
 */
export interface ISettings extends ITraceableAction {
    /**
     * 
     */
    readonly name: string;
}

export type ICommand = ITraceableAction
export type IExecutionResult = ITraceableAction

/**
 * A data emission event
 */
export interface IDataEvent {
    /**
     *  Source of the event
     */
    readonly emitter: IDataEmitter;
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
 * 
 */
export interface IStatusEvent {
    /**
     * 
     */
    readonly connected: boolean;
    /**
     * 
     */
    readonly bit: boolean;
    /**
     * 
     */
    readonly timestamp: Date;
}
/**
 * 
 */
export interface IDataEventListener {
    /**
     * 
     * @param dataEvent 
     */
    onData(dataEvent:IDataEvent): void;
}
/**
 * 
 */
export interface IStatusChangeListener {
    /**
     * 
     * @param statusEvent 
     */
    onStatus(statusEvent:IStatusEvent): void;
}
/**
 * 
 */
export interface IDisposable {
    /**
     * 
     */
    dispose(): void;
}

/**
 * A data source
 */
export interface IDataEmitter {
    /**
     * 
     */
    readonly id: string; 
    /**
     * 
     */
    readonly name: string;
    /**
     * 
     */
    readonly commLinkDesc: string;
    
    /**
     * 
     * @param listener 
     */
    onData(listener: IDataEventListener): IDisposable;
    /**
     * 
     * @param listener 
     */
    onStatus(listener: IStatusChangeListener): IDisposable;
    /**
     * 
     * @param settings 
     */
    applySettings(settings:ISettings): Promise<IExecutionResult>;
    /**
     * 
     * @param command 
     */
    sendCommand(command:ICommand): Promise<IStatusEvent>;
    /**
     * 
     */
    probeStatus(): Promise<IExecutionResult>;
    /**
     * 
     */
    probeCurrentData(): Promise<IDataEvent>;
}

export interface ICompoundDataEmitter extends IDataEmitter {
    getIndividualEmitter(id: string): IDataEmitter;
    getEmitters(): Array<IDataEmitter>;
}