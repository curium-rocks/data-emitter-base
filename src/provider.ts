import { IChronicler } from "./chronicler";
import { IChroniclerDescription, IChroniclerFactory, IChroniclerProvider, IDataEmitter, IEmitterDescription, IEmitterFactory, IEmitterProvider, IFormatSettings } from "./dataEmitter";
import { LoggerFacade } from "./loggerFacade";

/**
 * Central provider for emitters and chroniclers, factories are registered 
 * here with a coressponding type string which is used in the top level build
 * method to route to the correct factory. Does not support registering 
 * multiple factories with the same type string, last registered takes priority.
 */
class Provider implements IChroniclerProvider, IEmitterProvider {
    
    private readonly _emitterFactories: Map<string, IEmitterFactory> = new Map<string, IEmitterFactory>();
    private readonly _chroncilerFactories: Map<string, IChroniclerFactory> = new Map<string, IChroniclerFactory>();

    /**
     * 
     * @param {string} type 
     * @param {IEmitterFactory} factory 
     */
    registerEmitterFactory(type: string, factory: IEmitterFactory): void {
        this._emitterFactories.set(type.toLowerCase(), factory);
    }

    /**
     * 
     * @param {EmitterDescription} description 
     * @return {Promise<IDataEmitter>}
     */
    buildEmitter(description: IEmitterDescription): Promise<IDataEmitter> {
        const key = description.type.toLowerCase();
        const factory = this._emitterFactories.get(key);
        if(factory != null) {
            return factory.buildEmitter(description);
        } else {
            return Promise.reject(new Error(`No emitter factory available for ${key}`));   
        }
    }

    /**
     * 
     * @param {string} base64StateData 
     * @param {IFormatSettings} formatSettings 
     * @return {Promise<IDataEmitter>}
     */
    recreateEmitter(base64StateData: string, formatSettings: IFormatSettings): Promise<IDataEmitter> {
        const key = formatSettings.type.toLowerCase();
        const factory = this._emitterFactories.get(key);
        if(factory != null) {
            return Promise.resolve(factory.recreateEmitter(base64StateData, formatSettings));
        } else {
            return Promise.reject(new Error(`No emitter factory found for ${key}`))
        }
    }

    /**
     * 
     * @param {string} stateData if encrypted, base64 encoded cipher text, otherwise a json string 
     * @param {IFormatSettings} formatSettings the format settings describing the state data is encrypted
     * and if so what cipher type etc.
     * @return {IChronicler}
     */
    recreateChronicler(stateData: string, formatSettings: IFormatSettings) : Promise<IChronicler> {
        const key = formatSettings.type.toLowerCase();
        const factory = this._chroncilerFactories.get(key);
        if(factory != null) {
            return Promise.resolve(factory.recreateChronicler(stateData, formatSettings));
        } else {
            return Promise.reject(new Error(`No chronicler factory found for ${key}`))
        }
    }

    /**
     * 
     * @param {string} type 
     * @param {IChroniclerFactory} factory 
     */
    registerChroniclerFactory(type: string, factory: IChroniclerFactory): void {
        this._chroncilerFactories.set(type.toLowerCase(), factory);
    }

    /**
     * 
     * @param {IChroniclerDescription} description 
     * @return {Promise<IChronicler>}
     */
    buildChronicler(description: IChroniclerDescription): Promise<IChronicler> {
        const key = description.type.toLowerCase();
        const factory = this._chroncilerFactories.get(key);
        if(factory != null) {
            return factory.buildChronicler(description);
        } else {
            return Promise.reject(new Error(`No chronicler factory available for ${key}`));   
        }
    }

    /**
     * 
     * @param {string} type 
     */
    removeChroniclerFactory(type: string): void {
        const key = type.toLowerCase();
        if(this._chroncilerFactories.has(key)) this._chroncilerFactories.delete(key);
    }

    /**
     * 
     * @param {string} type 
     * @return {boolean}
     */
    hasChroniclerFactory(type: string): boolean {
        return this._chroncilerFactories.has(type.toLowerCase());
    }

    /**
     * 
     * @return {Array<string>}
     */
    getChroniclerFactoryTypes(): string[] {
        return Array.from(this._chroncilerFactories.keys());
    }

    /**
     * 
     * @param {string} type 
     */
    removeEmitterFactory(type: string): void {
        const key = type.toLowerCase();
        if(this._emitterFactories.has(key)) this._emitterFactories.delete(key);
    }

    /**
     * 
     * @param {string} type 
     * @return {boolean} 
     */
    hasEmitterFactory(type: string): boolean {
        return this._emitterFactories.has(type.toLowerCase());
    }

    /**
     * 
     * @return {Array<string>} 
     */
    getEmitterFactoryTypes(): string[] {
        return Array.from(this._emitterFactories.keys());
    }
    
    /**
     * 
     * @param {LoggerFacade} loggerFacade 
     */
    setLoggerFacade(loggerFacade: LoggerFacade): void {
        this._emitterFactories.forEach((val) => {
            val.setLoggerFacade(loggerFacade);
        });
        this._chroncilerFactories.forEach((val) => {
            val.setLoggerFacade(loggerFacade);
        });
    }
}

const provider = new Provider();

/**
 * Get the provider instance
 */
export class ProviderSingleton {

    

    // eslint-disable-next-line require-jsdoc, @typescript-eslint/no-empty-function
    private constructor() {
        // This is intentional
    }

    /**
     * 
     * @return {Provider}
     */
    public static getInstance(): Provider {
        return provider;
    }
}