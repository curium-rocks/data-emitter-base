import { describe, it} from 'mocha';
import { expect } from 'chai';
import { isDisposable, isDisposableAsync } from '../src/dataEmitter';

describe( 'isDisposable()', function() {
    it( 'Should return false for null', function() {
        expect(isDisposable(null)).to.be.false;
    });
    it( 'Should return false for string', function() {
        expect(isDisposable(null)).to.be.false;
    });
    it( 'Should return false when disposable is missing', function() {
        expect(isDisposable({
            test: ()=>{
                console.log('test');
            }
        })).to.be.false;    });
    it( 'Should return true when disposable is present', function() {
        expect(isDisposable({
            disposable: ()=>{
                console.log('test');
            }
        })).to.be.true;    
    });
});

describe( 'isDisposableAsync()', function() {
    it( 'Should return false for null', function() {
        expect(isDisposableAsync(null)).to.be.false;
    });
    it( 'Should return false for string', function() {
        expect(isDisposableAsync('test')).to.be.false;
    });
    it( 'Should return false when disposableAsync is missing', function() {
        expect(isDisposableAsync({
            test: ()=>{
                console.log('test');
            }
        })).to.be.false;
    });
    it( 'Should return true when disposableAsync is present', function() {
        expect(isDisposableAsync({
            disposableAsync: ()=>{
                console.log('test');
            }
        })).to.be.true;    
    });
});
