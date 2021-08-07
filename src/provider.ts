import { IChronicler } from "./chronicler";
import { IChroniclerDescription, IChroniclerFactory, IChroniclerProvider, IDataEmitter, IEmitterDescription, IEmitterFactory, IEmitterProvider, IFormatSettings } from "./dataEmitter";

/**
 * Central provider for emitters and chroniclers, factories are registered 
 * here with a coressponding type string which is used in the top level build
 * method to route to the correct factory. Does not support registering 
 * multiple factories with the same type string, last registered takes priority.
 */
class Provider implements IChroniclerProvider, IEmitterProvider {
    /**
     * 
     * @param {string} type 
     * @param {IEmitterFactory} factory 
     */
    registerEmitterFactory(type: string, factory: IEmitterFactory): void {
        throw new Error("Method not implemented.");
    }

    /**
     * 
     * @param {EmitterDescription} description 
     */
    buildEmitter(description: IEmitterDescription): Promise<IDataEmitter> {
        throw new Error("Method not implemented.");
    }

    /**
     * 
     * @param {string} base64StateData 
     * @param {IFormatSettings} formatSettings 
     */
    recreateEmitter(base64StateData: string, formatSettings: IFormatSettings): Promise<IDataEmitter> {
        throw new Error("Method not implemented.");
    }

    /**
     * 
     * @param {string} type 
     * @param {IChroniclerFactory} factory 
     */
    registerChroniclerFactory(type: string, factory: IChroniclerFactory): void {
        throw new Error("Method not implemented.");
    }

    /**
     * 
     * @param {IChroniclerDescription} description 
     */
    buildChronicler(description: IChroniclerDescription): Promise<IChronicler> {
        throw new Error("Method not implemented.");
    }
    
}

const provider = new Provider();

/**
 * Get the provider instance
 */
export class ProviderSingleton {

    

    // eslint-disable-next-line require-jsdoc, @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * 
     * @return {Provider}
     */
    public static getInstance(): Provider {
        return provider;
    }
}