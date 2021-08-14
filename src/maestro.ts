import {IDataEmitter, IDisposable} from "./dataEmitter";
import {IChronicler} from "./chronicler";

/**
 * Methods to start and stop a service,
 * this could be inside of a web application
 * or running directly in a process running in systemd
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
 * Maestro of emitters
 */
export interface IEmitterMaestro {
    /**
     * Add a emitter to the collection of
     * emitters managed by the maestro
     * @param {IDataEmitter} emitter
     */
    addEmitter(emitter:IDataEmitter): void;

    /**
     * Remove a emitter from the collection of
     * emitters managed by the maestro
     * @param {IDataEmitter} emitter
     */
    removeEmitter(emitter:IDataEmitter): void;

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
     * chroniclers managed by the maestro
     * @param {IChronicler} chronicler
     */
    addChronicler(chronicler:IChronicler): void;

    /**
     * Remove a chronicler from the collection of
     * chroniclers managed by the maestro
     * @param {IChronicler} chronicler
     */
    removeChronicler(chronicler:IChronicler): void;

    /**
     * Collection of chroniclers maintained by the maestro
     */
    chroniclers:Iterable<IChronicler>;
}

/**
 * Maestro that connects and manages instances of {IDataEmitter} and {IChronicler}
 */
export interface IMaestro extends IEmitterMaestro, IChroniclerMaestro {
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