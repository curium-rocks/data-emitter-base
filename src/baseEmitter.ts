import { IDataEmitter, IDataEvent, IDataEventListener, IDisposable, ISettings, IStatusChangeListener, IStatusEvent, ITraceableAction } from "./dataEmitter";

/**
 * Abstract base class emitter that takes care of managing registrations of
 * listeners and cleanup on disposal
 */
export abstract class BaseEmitter implements IDataEmitter {
    /**
     * Listener collection for data change listeners
     */
    private readonly _dataListeners: Set<IDataEventListener> = new Set<IDataEventListener>();
    /**
     * Listener collection for status change listeners
     */
    private readonly _statusListeners: Set<IStatusChangeListener> = new Set<IStatusChangeListener>();

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
     * 
     * @param {ISettings} settings 
     * @return {Promise<ITraceableAction}
     */
    abstract applySettings(settings: ISettings): Promise<ITraceableAction>;
    
    /**
     * 
     * @param {ITraceableAction} command
     * @return {Promise<IStatusEvent>} 
     */
    abstract sendCommand(command: ITraceableAction): Promise<IStatusEvent>;

    /**
     * @return {Promise<ITraceableAction>} 
     */
    abstract probeStatus(): Promise<ITraceableAction>;
    
    /**
     * @return {Promise<IDataEvent>}
     */
    abstract probeCurrentData(): Promise<IDataEvent>;

}