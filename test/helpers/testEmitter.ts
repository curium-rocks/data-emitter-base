import { BaseEmitter } from "../../src/baseEmitter";
import { ICommand, IExecutionResult, IStatusEvent, IDataEvent, IDataEmitter, IEmitterFactory, IEmitterDescription, IFormatSettings } from "../../src/dataEmitter";
import { LoggerFacade } from "../../src/loggerFacade";
import { ProviderSingleton } from "../../src/provider";

/**
 * 
 */
export class TestEmitter extends BaseEmitter {
    public static readonly TYPE = "TEST-EMITTER";

    /**
     * 
     */
    public commandResult: IExecutionResult = {
        success: false,
        actionId: "n/a"
    };

    public statusEvent: IStatusEvent = {
        connected: false,
        bit: true,
        timestamp: new Date()
    }

    public dataEvent: IDataEvent|undefined;

    public metaData: unknown = {

    };

    /**
     * 
     * @param {ICommand} command 
     * @return {Promise<IExecutionResult>}
     */
    sendCommand(command: ICommand): Promise<IExecutionResult> {
        return Promise.resolve(this.commandResult);
    }

    /**
     * @return {Promise<IStatusEvent>}
     */
    probeStatus(): Promise<IStatusEvent> {
        return Promise.resolve(this.statusEvent);
    }

    /**
     * @return {Promise<IDataEvent>}
     */
    probeCurrentData(): Promise<IDataEvent> {
        if(this.dataEvent != null)
            return Promise.resolve(this.dataEvent as IDataEvent);
        else 
            return Promise.reject(new Error("failed to get data event"));
    }

    /**
     * @return {unknown}
     */
    getMetaData(): unknown {
        return this.metaData;
    }

    /**
     * @return {string}
     */
    getType(): string {
        return TestEmitter.TYPE;
    }
    
}

/**
 * 
 */
export class TestEmitterFactory implements IEmitterFactory {
    private _loggerFacade?:LoggerFacade;

    /**
     * 
     * @param {IEmitterDescription} description 
     * @return {Promise<IDataEmitter>}
     */
    buildEmitter(description: IEmitterDescription): Promise<IDataEmitter> {
        return Promise.resolve(new TestEmitter(description.id, description.name, description.description, this._loggerFacade));
    }

    /**
     * 
     * @param {string} base64StateData 
     * @param {IFormatSettings} formatSettings
     * @return {Promise<IDataEmitter>} 
     */
    recreateEmitter(base64StateData: string, formatSettings: IFormatSettings): Promise<IDataEmitter> {
        return BaseEmitter.recreateEmitter(base64StateData, formatSettings);
    }

    /**
     * 
     * @param {LoggerFacade} loggerFacade 
     */
    setLoggerFacade(loggerFacade: LoggerFacade): void {
        this._loggerFacade = loggerFacade;
    }

}

ProviderSingleton.getInstance().registerEmitterFactory(TestEmitter.TYPE, new TestEmitterFactory());