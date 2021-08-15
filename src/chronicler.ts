import { IClassifier, IDisposable } from "./dataEmitter";

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
export interface IChronicler extends IDisposable, IClassifier {
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