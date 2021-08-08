import { BaseEmitter } from "./baseEmitter";
import { IChronicler } from "./chronicler";
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
     * @param {string} base64StateData 
     * @param {IFormatSettings} formatSettings 
     * @return {Promise<IDataEmitter>}
     */
    recreateEmitter(base64StateData: string, formatSettings: IFormatSettings): Promise<IDataEmitter> {
        return BaseEmitter.recreateEmitter(base64StateData, formatSettings);
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
}