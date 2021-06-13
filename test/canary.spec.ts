import { describe, it} from 'mocha';
import { should } from 'chai';

describe( 'Test', function() {
    describe( 'canary()', function() {
        it( 'Should allow assertions', function() {
            should().equal(true, true);
        });
    });
});