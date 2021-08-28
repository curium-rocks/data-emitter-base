import { BaseEmitter } from "./baseEmitter";
import { IChronicler } from "./chronicler";
import { decrypt } from "./common";
import { IChroniclerDescription, IChroniclerFactory, IDataEmitter, IEmitterDescription, IEmitterFactory, IFormatSettings } from "./dataEmitter";
import { LoggerFacade } from "./loggerFacade";

/**
 * 
 */
export abstract class BaseFactory {
    
    protected loggerFacade?:LoggerFacade;

    /**
     * 
     * @param {LoggerFacade} loggerFacade 
     */
    setLoggerFacade(loggerFacade: LoggerFacade): void {
        this.loggerFacade = loggerFacade;
    }
}
/**
 * 
 */
export abstract class BaseEmitterFactory extends BaseFactory implements IEmitterFactory {

    /**
     * 
     * @param description {IEmitterDescription}
     * @return {Promise<IDataEmitter}
     */
    abstract buildEmitter(description: IEmitterDescription): Promise<IDataEmitter>;

    /**
     * 
     * @param {string} stateData either base64 encoded ciphertext if encrypted, or a json string
     * @param {IFormatSettings} formatSettings 
     * @return {Promise<IDataEmitter>}
     */
    recreateEmitter(stateData: string, formatSettings: IFormatSettings): Promise<IDataEmitter> {
        return BaseEmitter.recreateEmitter(stateData, formatSettings);
    }
}
/**
 * 
 */
export abstract class BaseChroniclerFactory extends BaseFactory implements IChroniclerFactory {


    /**
     * 
     * @param {IChroniclerDescription} description 
     */
    abstract buildChronicler(description: IChroniclerDescription): Promise<IChronicler>;

    /**
     * 
     * @param {string} stateData either base64 encoded ciphertext if encrypted, or a json string
     * @param {IFormatSettings} formatSettings
     * @return {Promise<IChronicler>} 
     */
    async recreateChronicler(stateData: string, formatSettings: IFormatSettings): Promise<IChronicler> {
        let jsonStr: string;
        if(formatSettings.encrypted) {
            jsonStr = await decrypt(stateData, formatSettings);
        } else {
            jsonStr = stateData;
        }
        const description:IChroniclerDescription = JSON.parse(jsonStr);
        return this.buildChronicler(description);
    }
}