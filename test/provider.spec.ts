import { describe, it} from 'mocha';
import { expect } from 'chai';
import { ProviderSingleton } from '../src/provider';
import { IChroniclerFactory, IEmitterDescription, IFormatSettings } from '../src/dataEmitter';
import { TestEmitter } from './helpers/testEmitter';
import { IChronicler, IJsonSerializable } from '../src/chronicler';
import { LoggerFacade } from '../src/loggerFacade';


const chroniclerFactory: IChroniclerFactory = {
    buildChronicler: () => {
        return Promise.resolve(chronicler);
    },
    setLoggerFacade: (facade:LoggerFacade) => {
        console.log('logger facade set');
    },
    recreateChronicler: (stateData: string, settings: IFormatSettings) => {
        return Promise.resolve(chronicler);
    }
}
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
const chronicler: IChronicler = {
    id: 'test',
    name: 'test-name',
    description: 'test-description',
    saveRecord: (evt: IJsonSerializable) => {
        return Promise.resolve();
    },
    disposeAsync: () : Promise<void> => {
        return Promise.reject(Error("Not Implemented"));
    },
    serializeState: (settings: IFormatSettings) => {
        return Promise.resolve("");
    }
}
const testEmitter = new TestEmitter('test', 'test', 'test');
const emitterFactory = {
    recreateEmitter: (data:string, settings:IFormatSettings) => {
        return Promise.resolve(testEmitter);
    },
    buildEmitter: (desc: IEmitterDescription) => {
        return Promise.resolve(testEmitter);
    },
    setLoggerFacade: (facade:LoggerFacade) => {
        console.log('logger facade set');
    }
}

describe( 'Provider', function() {
    describe( 'registerEmitterFactory()', function() {
        it( 'Should result in factory calls when using that type', async function() {
            ProviderSingleton.getInstance().registerEmitterFactory('test', emitterFactory);
            const returnedEmitter = await ProviderSingleton.getInstance().buildEmitter(emitterDescription);
            expect(returnedEmitter).to.be.eq(testEmitter);    
        });
    });
    describe( 'registerChroniclerFactory()', function() {
        it( 'Should result in factory calls when using that type',async function() {
            ProviderSingleton.getInstance().registerChroniclerFactory('test', chroniclerFactory);
            const returnedChronicler = await ProviderSingleton.getInstance().buildChronicler({
                id: 'test',
                name: 'test',
                description: 'test',
                type: 'test',
                chroniclerProperties: {}
            });
            expect(returnedChronicler).to.be.eq(returnedChronicler);
        });
    });
    describe( 'recreateEmitter()', function() {
        it( 'Should create a previous emitter with the same state', async function() {
            const emitter = await ProviderSingleton.getInstance().buildEmitter(emitterDescription);
            const state = await emitter.serializeState({
                encrypted: false,
                type: 'test'
            });
            const recreateEmitter = await ProviderSingleton.getInstance().recreateEmitter(state, {
                encrypted: false,
                type: 'test'
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
    describe( 'recreateChronicler()', function() {
        it('Should build a chronicler to the same state as before', async function() {
            const chronicler = await ProviderSingleton.getInstance().buildChronicler(chroniclerDescription);
            const state = await chronicler.serializeState({
                encrypted: false,
                type: 'test'
            });
            const recreateChronicler = await ProviderSingleton.getInstance().recreateChronicler(state, {
                encrypted: false,
                type: 'test'
            });
            expect(recreateChronicler.id).to.be.eq(chronicler.id);
            expect(recreateChronicler.description).to.be.eq(chronicler.description);
            expect(recreateChronicler.name).to.be.eq(chronicler.name);
        });
    });
    describe('hasChroniclerFactory()', function() {
        it('Should return false when missing a factory', function() {
            expect(ProviderSingleton.getInstance().hasChroniclerFactory('adadadadada')).to.be.false;
        });
        it('Should return true when factory is present', function() {
            ProviderSingleton.getInstance().registerChroniclerFactory('my-test-instance', chroniclerFactory)
            expect(ProviderSingleton.getInstance().hasChroniclerFactory('my-test-instance')).to.be.true;
        });
    });
    describe('removeChroniclerFactory()', function() {
        it('Should allow removal of factory', function() {
            ProviderSingleton.getInstance().registerChroniclerFactory('test-removal', chroniclerFactory);
            expect(ProviderSingleton.getInstance().hasChroniclerFactory('test-removal')).to.be.true;
            ProviderSingleton.getInstance().removeChroniclerFactory('test-removal');
        });
    });
    describe('getChroniclerFactories()', function() {
        it('Should return the list of factories registered', function() {
            ProviderSingleton.getInstance().registerChroniclerFactory('test-list-1', chroniclerFactory);
            ProviderSingleton.getInstance().registerChroniclerFactory('test-list-2', chroniclerFactory);
            expect(ProviderSingleton.getInstance().getChroniclerFactoryTypes()).contains('test-list-1');
            expect(ProviderSingleton.getInstance().getChroniclerFactoryTypes()).contains('test-list-2');
        });
    });
    describe('hasEmitterFactory()', function() {
        it('Should return false when missing a factory', function() {
            expect(ProviderSingleton.getInstance().hasEmitterFactory('adadadadada')).to.be.false;
        });
        it('Should return true when factory is present', function() {
            ProviderSingleton.getInstance().registerEmitterFactory('my-test-instance', emitterFactory)
            expect(ProviderSingleton.getInstance().hasEmitterFactory('my-test-instance')).to.be.true;
        });
    });
    describe('removeEmitterFactory()', function() {
        it('Should allow removal of factory', function() {
            ProviderSingleton.getInstance().registerEmitterFactory('test-removal', emitterFactory);
            expect(ProviderSingleton.getInstance().hasEmitterFactory('test-removal')).to.be.true;
            ProviderSingleton.getInstance().removeEmitterFactory('test-removal');
        });
    });
    describe('getEmitterFactories()', function() {
        it('Should return the list of factories registered', function() {
            ProviderSingleton.getInstance().registerEmitterFactory('test-list-1', emitterFactory);
            ProviderSingleton.getInstance().registerEmitterFactory('test-list-2', emitterFactory);
            expect(ProviderSingleton.getInstance().getEmitterFactoryTypes()).contains('test-list-1');
            expect(ProviderSingleton.getInstance().getEmitterFactoryTypes()).contains('test-list-2');
        });
    });
});