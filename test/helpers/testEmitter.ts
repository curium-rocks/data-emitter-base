import { BaseEmitter } from "../../src/baseEmitter";
import { ICommand, IExecutionResult, IStatusEvent, IDataEvent, IDataEmitter, IEmitterDescription } from "../../src/dataEmitter";
import { ProviderSingleton } from "../../src/provider";
import { BaseEmitterFactory } from "../../src/factory";

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