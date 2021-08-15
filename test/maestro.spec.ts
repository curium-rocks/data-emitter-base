import { describe, it} from 'mocha';
import { expect } from 'chai';
import { isService } from '../src/maestro';

describe( 'isService()', function() {
    it( 'Should return false for null', function() {
        expect(isService(null)).to.be.false;
    });
    it( 'Should return false for string', function() {
        expect(isService("test")).to.be.false;
    });
    it( 'Should return false for an object missing stop', function() {
        expect(isService({
            start: ()=>{
                console.log('test');
            }
        })).to.be.false;
    });
    it( 'Should return false for an ojbect missing start', function() {
        expect(isService({
            stop: () => {
                console.log('test');
            }
        })).to.be.false;
    });
    it ('Should return true when both stop and start are presenting', function() {
        expect(isService({
            start: ()=> {
                console.log('test start');
            },
            stop: () => {
                console.log('test stop');
            }
        })).to.be.true;
    });
});