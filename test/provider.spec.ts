import { describe, it} from 'mocha';
import { expect } from 'chai';
import { ProviderSingleton } from '../src/provider';
import { IEmitterDescription, IFormatSettings } from '../src/dataEmitter';
import { TestEmitter } from './helpers/testEmitter';
import { IJsonSerializable } from '../src/chronicler';

const emitterDescription = {
    id: 'test',
    name: 'test',
    description: 'test',
    type: 'test',
    emitterProperties: {}
}
const chroniclerDescription = {
    id: 'test',
    name: 'test',
    description: 'test',
    type: 'test',
    chroniclerProperties: {}
}
const chronicler = {
    saveRecord: (evt: IJsonSerializable) => {
        return Promise.resolve();
    },
    dispose: () => {
        throw new Error("Not Implemented");
    }
}
const testEmitter = new TestEmitter('test', 'test', 'test');
const emitterFactory = {
    recreateEmitter: (data:string, settings:IFormatSettings) => {
        return Promise.resolve(testEmitter);
    },
    buildEmitter: (desc: IEmitterDescription) => {
        return Promise.resolve(testEmitter);
    }
}

describe( 'Provider', function() {
    describe( 'registerEmitterFactory()', function() {
        it( 'Should result in factory calls when using that type', async function() {
            const myEmitter = new TestEmitter('test', 'test', 'test');
            ProviderSingleton.getInstance().registerEmitterFactory('test', emitterFactory);
            const returnedEmitter = await ProviderSingleton.getInstance().buildEmitter(emitterDescription);
            expect(returnedEmitter).to.be.eq(myEmitter);    
        });
    });
    describe( 'registerChroniclerFactory()', function() {
        it( 'Should result in factory calls when using that type',async function() {
            let callCount = 0;
            ProviderSingleton.getInstance().registerChroniclerFactory('test', {
                buildChronicler: () => {
                    callCount++;
                    return Promise.resolve(chronicler);
                }
            });
            const returnedChronicler = await ProviderSingleton.getInstance().buildChronicler({
                id: 'test',
                name: 'test',
                description: 'test',
                type: 'test',
                chroniclerProperties: {}
            });
            expect(callCount).to.be.eq(1);
            expect(returnedChronicler).to.be.eq(returnedChronicler);
        });
    });
    describe( 'recreateEmitter()', function() {
        it( 'Should create a previous emitter with the same state', async function() {
            const emitter = await ProviderSingleton.getInstance().buildEmitter(emitterDescription);
            const state = await emitter.serializeState({
                encrypted: false
            });
            const recreateEmitter = await ProviderSingleton.getInstance().recreateEmitter(state, {
                encrypted: false
            });
            expect(recreateEmitter.id).to.be.eq(emitter.id);
            expect(recreateEmitter.description).to.be.eq(emitter.description);
            expect(recreateEmitter.name).to.be.eq(emitter.name);
        });
    });
    describe( 'buildEmitter()', function() {
        it( 'Should build an emitter to expected specifications', async function() {
            const emitter = await ProviderSingleton.getInstance().buildEmitter(emitterDescription);
            expect(emitter.description).to.be.eq(emitterDescription.description);
            expect(emitter.name).to.be.eq(emitterDescription.name);
            expect(emitter.id).to.be.eq(emitter.id);
            expect(emitter).to.be.instanceOf(TestEmitter);

        });
    });
    describe( 'buildChronicler()', function() {
        it( 'Should build an chronicler to expected specifications', async function() {
            const result = await ProviderSingleton.getInstance().buildChronicler(chroniclerDescription);
            expect(result).to.not.be.null;
            expect(result).to.be.eq(chronicler);
        });
    });
});