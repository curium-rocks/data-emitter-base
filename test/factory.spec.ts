import { describe, it} from 'mocha';
import { expect } from 'chai';
import { BaseChroniclerFactory } from '../src/factory';
import { BaseChronicler, IChronicler, IJsonSerializable } from '../src/chronicler';
import { IChroniclerDescription, IFormatSettings } from '../src/dataEmitter';
import crypto from 'crypto';

/**
 * 
 */
class TestChronicler extends BaseChronicler {
    static readonly TYPE = 'test';

    private readonly desc: IChroniclerDescription;

    /**
     * 
     * @param {IChroniclerDes} desc 
     */
    constructor(desc: IChroniclerDescription) {
        super(desc);
        this.desc = desc;
    }

    /**
     * 
     * @param {IJsonSerializable} record 
     */
    saveRecord(record: IJsonSerializable): Promise<void> {
        throw new Error('Method not implemented.');
    }
    /**
     * @return {unknown}
     */
    getChroniclerProperties(): unknown {
        return this.desc.chroniclerProperties;
    }
    /**
     * 
     * @return {string}
     */
    getType(): string {
        return TestChronicler.TYPE;
    }

    /**
     * 
     */
    dispose(): void {
        throw new Error('Method not implemented.');
    }
    
}

/**
 * 
 */
class TestChroniclerFactory extends BaseChroniclerFactory {
    /**
     * 
     * @param {IChroniclerDescription} description 
     * @return {Promise<IChronicler>}
     */
    buildChronicler(description: IChroniclerDescription): Promise<IChronicler> {
        return Promise.resolve(new TestChronicler(description));
    }
}

const factory = new TestChroniclerFactory();

const desc : IChroniclerDescription =  {
    id: 'test-id',
    name: 'test-name',
    description: 'test-desc',
    type: 'test',
    chroniclerProperties: {
        test: 'test-prop'
    }
}

describe( 'BaseChroniclerFactory', function() {
    describe( 'recreateChronicler()', function() {
        it( 'Should recreate to the same specifications', async function() {
            const chron = await factory.buildChronicler(desc);
            const fmt = {
                type: TestChronicler.TYPE,
                encrypted: false
            }
            const state = await chron.serializeState(fmt);

            const newChronicler = await factory.recreateChronicler(state, fmt);
            expect(newChronicler.description).to.be.eq(chron.description);
            expect(newChronicler.id).to.be.eq(chron.id);
            expect(newChronicler.name).to.be.eq(chron.name);

        });
        it( 'Should support aes-256-gcm states', async function() {
            const chron = await factory.buildChronicler(desc);
            const fmt:IFormatSettings = {
                type: TestChronicler.TYPE,
                encrypted: true,
                algorithm: 'aes-256-gcm',
                key: crypto.randomBytes(32).toString('base64'),
                iv: crypto.randomBytes(16).toString('base64')
            }
            const state = await chron.serializeState(fmt);

            const newChronicler = await factory.recreateChronicler(state, fmt);
            expect(newChronicler.description).to.be.eq(chron.description);
            expect(newChronicler.id).to.be.eq(chron.id);
            expect(newChronicler.name).to.be.eq(chron.name);
        });
    });
});