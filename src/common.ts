import { IFormatSettings } from "./lib";
import crypto, { CipherGCMTypes } from 'crypto';

export interface ISerializableState {
    /**
     * Serialize the state of the object in a base64 string,
     * depending on formating settings this could be an encrypted state
     */
     serializeState(settings:IFormatSettings): Promise<string>;
}

/**
 *
 * @param {unknown} obj
 * @param {string} methodName
 * @return {boolean}
 */
export function hasMethod(obj: unknown, methodName: string) : boolean {
    if(obj == null) return false;
    if(typeof obj == 'object') {
        const val = obj as Record<string, unknown>;
        return typeof val[methodName] == 'function';
    }
    return false;
}

/**
 * Check if a object implements IDisposableAsync interface
 * @param {unknown} obj
 * @return {boolean}
 */
export function isDisposableAsync(obj: unknown) : boolean {
    return hasMethod(obj, 'disposeAsync');
}

/**
 * Checks if an object implements the IDisposable interface
 * @param {unknown} obj
 * @return {boolean}
 */
export function isDisposable(obj: unknown) : boolean {
    return hasMethod(obj, 'dispose');
}

/**
 * 
 * @param {string} json 
 * @param {IFormatSettings} settings 
 */
export async function encrypt(json:string, settings:IFormatSettings) : Promise<string> {
    if((settings.algorithm as string).toLowerCase().indexOf('gcm') != -1) {
        const gcmCipher = crypto.createCipheriv(settings.algorithm as CipherGCMTypes, Buffer.from(settings.key as string, 'base64'), Buffer.from(settings.iv as string, 'base64'), {
            authTagLength: 16
        });
        const cipherBuffer = Buffer.concat([gcmCipher.update(json, 'utf-8'), gcmCipher.final(), gcmCipher.getAuthTag()]);
        return Promise.resolve(cipherBuffer.toString('base64'))
    } else {
        const cipher = crypto.createCipheriv(settings.algorithm as string, Buffer.from(settings.key as string, 'base64'), Buffer.from(settings.iv as string, 'base64'));
        const cipherBuffer = Buffer.concat([cipher.update(json, 'utf-8'), cipher.final()]);
        return Promise.resolve(cipherBuffer.toString('base64'))
    }
}

/**
 * 
 * @param {string} base64CipherText
 * @param {IFormatSettings} settings
 * @return {Promise<void>}
 */
export async function decrypt(base64CipherText:string, settings:IFormatSettings): Promise<string> {
    if((settings.algorithm as string).toLowerCase().indexOf('gcm') != -1) {
        const gcmCipher = crypto.createDecipheriv(settings.algorithm as CipherGCMTypes, Buffer.from(settings.key as string, 'base64'), Buffer.from(settings.iv as string, 'base64'))
        const buffer = Buffer.from(base64CipherText, 'base64');
        const authTag = buffer.slice(buffer.length-16);
        const cipher = buffer.slice(0, buffer.length-16);
        gcmCipher.setAuthTag(authTag);
        let plainText = gcmCipher.update(cipher, undefined, 'utf-8');
        plainText += gcmCipher.final('utf-8');
        return Promise.resolve(plainText);
    } else {
        const decipher = crypto.createDecipheriv(settings.algorithm as string, Buffer.from(settings.key as string, 'base64'), Buffer.from(settings.iv as string, 'base64'));
        let plainText = decipher.update(base64CipherText, 'base64', 'utf-8');
        plainText += decipher.final('utf-8');
        return Promise.resolve(plainText);
    }
}