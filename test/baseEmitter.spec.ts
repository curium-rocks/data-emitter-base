import { describe, it} from 'mocha';
import { expect } from 'chai';
import { TestEmitter } from './helpers/testEmitter';
import { IDataEmitter, IFormatSettings } from '../src/dataEmitter';
import { ProviderSingleton } from '../src/provider';

/**
 * 
 * @param {IDataEmitter} original 
 * @param {string} stateData 
 * @param {IFormatSettings} formatSettings
 */
async function validateRecreate(original: IDataEmitter, stateData: string, formatSettings: IFormatSettings) : Promise<void> {
    const restoredEmitter = await ProviderSingleton.getInstance().recreateEmitter(stateData, formatSettings);
    expect(restoredEmitter).to.not.be.null;
    expect(restoredEmitter.name).to.eq(original.name);
    expect(restoredEmitter.description).to.eq(original.description);
    expect(restoredEmitter.id).to.eq(original.id);
}

/**
 * 
 * @param {IFormatSettings} formatSettings 
 */
async function validateStateRestoration(formatSettings:IFormatSettings) : Promise<void> {
    const emitter = new TestEmitter('test', 'test', 'test');
    const result = await emitter.serializeState(formatSettings);
    expect(result).to.not.be.null;
    await validateRecreate(emitter, result, formatSettings);
}

describe( 'BaseEmitter', function() {
    describe( 'serializeState()', function() {
        it( 'Should allow plain text serialization', async function() {
            await validateStateRestoration({
                encrypted: false,
                type: TestEmitter.TYPE
            });
        });
        it( 'Should allow aes gcm serialization', async function() {
            await validateStateRestoration({
                encrypted: true,
                type: TestEmitter.TYPE,
                algorithm: 'aes-256-gcm',
                key: 'test123123123',
                iv: 'adadadada',
                tag: 'adadadadad'
            });      
        });
    });
});