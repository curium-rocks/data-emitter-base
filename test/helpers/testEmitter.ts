import { BaseEmitter, BaseStatusEvent } from "../../src/baseEmitter";
import { ICommand, IExecutionResult, IStatusEvent, IDataEvent, IDataEmitter, IEmitterDescription } from "../../src/dataEmitter";
import { ProviderSingleton } from "../../src/provider";
import { BaseEmitterFactory } from "../../src/factory";
import { LoggerFacade } from "../../src/loggerFacade";

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

    public statusEvent: IStatusEvent;

    public dataEvent: IDataEvent|undefined;

    public metaData: unknown = {

    };

    /**
     * Test Data Emitter\
     * @param {string} id
     * @param {string} name
     * @param {string} desc
     * @param {LoggerFacade|undefined} logger
     */
    constructor(id: string, name: string, desc: string, logger?: LoggerFacade) {
        super(id, name, desc, logger);
        this.statusEvent = new BaseStatusEvent(false, true, this);
    }

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
export class TestEmitterFactory extends BaseEmitterFactory {

    /**
     * 
     * @param {IEmitterDescription} description 
     * @return {Promise<IDataEmitter>}
     */
    buildEmitter(description: IEmitterDescription): Promise<IDataEmitter> {
        return Promise.resolve(new TestEmitter(description.id, description.name, description.description, this.loggerFacade));
    }
}

ProviderSingleton.getInstance().registerEmitterFactory(TestEmitter.TYPE, new TestEmitterFactory());