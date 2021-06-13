import { PollingEmitter } from '../../src/pollingEmitter';
import { IExecutionResult, ICommand } from '../../src/dataEmitter';

/**
 * Test class for polling emitter
 */
export class TestPollingEmitter extends PollingEmitter {

    private _shouldFault = false;

    /**
     *
     * @param {faulted} faulted
     */
    public setFaulted(faulted:boolean): void {
        this._shouldFault = faulted;
    }

    /**
     * Trigger a poll now
     * @return {Promise<void>}
     */
    public pollNow(): Promise<void> {
        return this.pollExecutor();
    }

    /**
     * Set the disconnection thresholds and check interval
     * to force a faster DC
     * @param {number} checkInterval
     * @param {number} threshold
     */
    public setDCSettings(checkInterval:number, threshold:number): void {
        this.setDCCheckInterval(checkInterval, threshold);
    }

    /**
     *
     * @return {Promise<unknown>}
     */
    poll(): Promise<unknown> {
        if(!this._shouldFault) return Promise.resolve('test');
        return Promise.reject(new Error("faulted"));
    }

    /**
     *
     * @param {ICommand} command
     * @return {Promise<IExecutionResult>}
     */
    sendCommand(command: ICommand): Promise<IExecutionResult> {
        return Promise.resolve({
            success: true,
            actionId: command.actionId
        })
    }

    /**
     * Test meta
     * @return {unknown}
     */
    getMetaData(): unknown {
        return "test-meta";
    }

}