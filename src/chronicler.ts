import { encrypt } from "./common";
import { IClassifier, IDisposable, IFormatSettings } from "./dataEmitter";
import { IChroniclerDescription, ISerializableState } from "./lib";

/**
 * Enforce the object providing controlled 
 * serialization to avoid circuler references
 */
export interface IJsonSerializable {
    /**
     * gets the object in record form to support
     * serialization and persistence
     * @return {Record<string, unknown>} 
     */
    toJSON(): Record<string, unknown>;
}

/**
 * Basic Chronicler interface that allows persist a
 * record of the provided object
 */
export interface IChronicler extends IDisposable, IClassifier, ISerializableState {
    /**
     * Save the provided object into a persistent store,
     * uses the 
     * @return {Promise<void>}
     * @param {IJsonSerializable> record 
     */
    saveRecord(record:IJsonSerializable): Promise<void>;
}

/**
 * Additional contract for a chronicler that
 * persists to a file
 */
export interface IFileChronicler extends IChronicler {
    /**
     * Gets the file name of the current file being used to persist records
     * @return {string} the active filename
     */
    getCurrentFilename(): string;
}

/**
 * Contracts for a chronicler that persists to rotating file stores
 */
export interface IRotatingFileChronicler extends IFileChronicler {
    /**
     * Find all uncompressed record files and compress them
     * @return {Promise<void>} 
     */
    compactLogs(): Promise<void>;
    /**
     * Create a new active record file to write to and compress
     * the old one
     * @return {Promise<void>}
     */
    rotateLog(): Promise<string>;
}

/**
 * Base chronicler
 */
export abstract class BaseChronicler implements IChronicler {
    protected _id: string;
    protected _name: string;
    protected _description: string;

    /**
     * Unique id of the chronicler
     */
    get id(): string {
        return this._id;
    }
    
    /**
     * Name of the chronicler
     */
    get name(): string {
        return this._name;
    }

    /**
     * Description of the chronicler
     */
    get description(): string  {
        return this._description;
    }

    /**
     * 
     * @param {IChroniclerDescription} desc 
     */
    constructor(desc: IChroniclerDescription) {
        this._id = desc.id;
        this._name = desc.name;
        this._description = desc.description;
    }


    /**
     * 
     * @param {IJsonSerializable} record
     * @return {Promise<void>} 
     */
    abstract saveRecord(record: IJsonSerializable): Promise<void>;

    /**
     * Get the chronicler properties for this instance
     */
    abstract getChroniclerProperties(): unknown;
    /**
     * Get the chronicler type for this instance
     */
    abstract getType(): string;

    /**
     * Dispose any resources that will not automatically be cleaned up
     */
    abstract dispose(): void;

    /**
     * Gets the chronicler description which is used to recreate the chronicler
     * @return {IChroniclerDescription}
     */
    protected getChronicerDescription(): IChroniclerDescription {
        return {
            name: this.name,
            description: this.description,
            id: this.id,
            type: this.getType(),
            chroniclerProperties: this.getChroniclerProperties()
        }
    }

    /**
     * 
     * @param {IFormatSettings} settings 
     * @return {Promise<string>}
     */
    async serializeState(settings: IFormatSettings): Promise<string> {
        if(settings.encrypted) {
            return Promise.resolve(await encrypt(JSON.stringify(this.getChronicerDescription()), settings));
        }
        return Promise.resolve(JSON.stringify(this.getChronicerDescription()));
    }
    
}