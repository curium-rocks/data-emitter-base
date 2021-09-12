import { describe, it} from 'mocha';
import { expect } from 'chai';
import { TestEmitter } from './helpers/testEmitter';
import { IDataEmitter, IFormatSettings } from '../src/dataEmitter';
import { ProviderSingleton } from '../src/provider';
import crypto from 'crypto';
import { isDataEvent, isJsonSerializable, isStatusEvent } from '../src/lib';

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
describe( 'isStatusEvent()', function() {
    it( 'Should return false for null', function() {
        expect(isStatusEvent(null)).to.be.false;
    });
    it( 'Should return false for a string', function() {
        expect(isStatusEvent('test')).to.be.false;
    });
    it( 'Should return true when all properties are met', function() {
        expect(isStatusEvent({
            emitter: {},
            connected: {},
            bit: {},
            timestamp: {}
        })).to.be.true;
    });
})
describe( 'isDataEvent()', function() {
    it( 'Should return false for null', function() {
        expect(isDataEvent(null)).to.be.false;
    });
    it( 'Should return false for a string', function() {
        expect(isDataEvent('test')).to.be.false;
    });
    it( 'Should return true when all properties are met', function() {
        expect(isDataEvent({
            emitter: {},
            meta: {},
            timestamp: {},
            data: {}
        })).to.be.true;
    });
})
describe( 'isJSONSerializable()', function() {
    it( 'Should return false for null', function() {
        expect(isJsonSerializable(null)).to.be.false;
    });
    it( 'Should return false for a string', function() {
        expect(isJsonSerializable('test')).to.be.false;
    });
    it( 'Should be false when toJSON is missing', function() {
        expect(isJsonSerializable({
            id: 'adada'
        })).to.be.false;
    });
})
describe( 'BaseEmitter', function() {
    describe( 'toJSON()', function() {
        it( 'Should return something that can be stringified', function() {
            const emitter = new TestEmitter('test-id', 'test-name', 'test-desc');
            const serializeSafeObject = emitter.toJSON();
            const string = JSON.stringify(serializeSafeObject);
            expect(string).to.not.be.null;
        });
        it( 'Should contain the name id and description', function() {
            const emitter = new TestEmitter('test-id', 'test-name', 'test-desc');
            const serializeSafeObject = emitter.toJSON();
            expect(serializeSafeObject.name).to.be.eq(emitter.name);
            expect(serializeSafeObject.id).to.be.eq(emitter.id);
            expect(serializeSafeObject.description).to.be.eq(emitter.description);
        })
    })
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
                key: crypto.randomBytes(32).toString('base64'),
                iv: crypto.randomBytes(32).toString('base64'),
                tag: 'adadadadad'
            });      
        });
    });
});