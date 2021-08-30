import {IClassifier, IDataEmitter, IDisposable} from "./dataEmitter";
import {IChronicler} from "./chronicler";
import { IChroniclerDescription, IDisposableAsync, IEmitterDescription } from "./lib";

/**
 * Methods to start and stop a service,
 * this could be inside of a web application
 * or running directly in a process running in systemd. 
 * This can also be used for a service inside a program that has a started and stopped state
 */
export interface IService {
    /**
     * Starts the service
     * @returns {Promise<void>} resolved when start operation is finished
     */
    start(): Promise<void>;

    /**
     * Stops the service
     * @returns {Promise<void>} resolved when stop operation is finished
     */
    stop(): Promise<void>;
}

/**
 * Check if an object implements IService
 * @param {unknown} obj
 * @return {boolean}  
 */
export function isService(obj: unknown) : boolean {
    if (obj == null) return false;
    if(typeof obj == 'object') {
        const castedObj = obj as Record<string, unknown>;
        return typeof castedObj.stop == 'function' && typeof castedObj.start == 'function';
    }
    return false;
}



/**
 * Maestro of emitters
 */
export interface IEmitterMaestro {
    /**
     * Add a emitter to the collection of
     * emitters managed by the maestro, either from
     * an existing instance or provide a description
     * and the maestro will create the emitter if a factory is available
     * @param {IDataEmitter} emitter
     */
    addEmitter(emitter:IDataEmitter|IEmitterDescription): Promise<void>;

    /**
     * Remove a emitter from the collection of
     * emitters managed by the maestro, identified
     * either by providing the emitter instance
     * or the unique emitter id
     * @param {IDataEmitter|string} emitter
     */
    removeEmitter(emitter:IDataEmitter|string): Promise<void>;

    /**
     * Collection of emitters maintained by the maestro
     */
    emitters:Iterable<IDataEmitter>;
}

/**
 * Maestro of chroniclers
 */
export interface  IChroniclerMaestro {
    /**
     * Add a chronicler to the collection of
     * chroniclers managed by the maestro, this can be an
     * existing instance or a description and the maestro 
     * will attempt to create the chronicler from available facotires
     * @param {IChronicler|IChroniclerDescription} chronicler
     */
    addChronicler(chronicler:IChronicler|IChroniclerDescription): Promise<void>;

    /**
     * Remove a chronicler from the collection of
     * chroniclers managed by the maestro, this can either be the 
     * chronicler instance or unique chronicler id
     * @param {IChronicler|string} chronicler
     */
    removeChronicler(chronicler:IChronicler|string): Promise<void>;

    /**
     * Collection of chroniclers maintained by the maestro
     */
    chroniclers:Iterable<IChronicler>;
}

/**
 * Maestro that connects and manages instances of {IDataEmitter} and {IChronicler}
 */
export interface IMaestro extends IEmitterMaestro, IChroniclerMaestro, IClassifier, IService, IDisposableAsync {
    /**
     * connect the collection of emitters to the collection of chroniclers,
     * each emitter will save it's records to each of the chroniclers
     * @param {Iterable<IDataEmitter>} emitters
     * @param {Iterable<IChronicler>} chroniclers
     * @returns {IDisposable} Disposable link, if disposed cancels the connections
     */
    connect(emitters:Iterable<IDataEmitter>|IDataEmitter, chroniclers:Iterable<IChronicler>|IChronicler): IDisposable;


    /**
     * restore the state from the persisted state store
     * @returns {Promise<void>} resolves once the state has been restored
     */
    load(): Promise<void>;

    /**
     * save the state to the store
     * @returns {Promise<void>} resolve once save operation is complete
     */
    save(): Promise<void>;
}