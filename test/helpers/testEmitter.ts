import { BaseEmitter } from "../../src/baseEmitter";
import { ICommand, IExecutionResult, IStatusEvent, IDataEvent, IDataEmitter } from "../../src/dataEmitter";

/**
 * 
 */
export class TestEmitter extends BaseEmitter {

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
    public type = 'TestEmitter';

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
        return this.type;
    }
    
}