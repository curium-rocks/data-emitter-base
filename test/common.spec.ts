import { describe, it} from 'mocha';
import { expect } from 'chai';
import { IFormatSettings } from '../src/lib';
import crypto from 'crypto';
import { decrypt, encrypt } from '../src/common';
import {isDisposable, isDisposableAsync, hasMethod} from "../src/common";

const rando32 = crypto.randomBytes(32).toString('base64');
const rando24 = crypto.randomBytes(24).toString('base64');
const rando16 = crypto.randomBytes(16).toString('base64');
const rando8 = crypto.randomBytes(8).toString('base64');

describe( 'common', function() {
    describe( 'isDisposableAsync()', function() {
        it( 'Should return false for null', function() {
            expect(isDisposableAsync(null)).to.be.false;
        });
        it( 'Should return false for string', function() {
            expect(isDisposableAsync('test')).to.be.false;
        });
        it( 'Should return false when disposeAsync is missing', function() {
            expect(isDisposableAsync({
                test: ()=>{
                    console.log('test');
                }
            })).to.be.false;
        });
        it( 'Should return true when diposeAsync is present', function() {
            expect(isDisposableAsync({
                disposeAsync: ()=>{
                    console.log('test');
                }
            })).to.be.true;
        });
    });
    describe( 'isDisposable()', function() {
        it( 'Should return false for null', function() {
            expect(isDisposable(null)).to.be.false;
        });
        it( 'Should return false for string', function() {
            expect(isDisposable({
                dispose: 'test'
            })).to.be.false;
        });
        it( 'Should return false when dispose is missing', function() {
            expect(isDisposable({
                test: ()=>{
                    console.log('test');
                }
            })).to.be.false;    });
        it( 'Should return true when dipose is present', function() {
            expect(isDisposable({
                dispose: ()=>{
                    console.log('test');
                }
            })).to.be.true;
        });
    });
    describe( 'crypto methods', function() {
        const theories = [{
            alg: 'aes-256-gcm',
            key: rando32,
            iv: rando16
        },{
            alg: 'aes-192-gcm',
            key: rando24,
            iv: rando16
        },{
            alg: 'des-cbc',
            key: rando8,
            iv: rando8
        }];
        theories.forEach((theory) => {
            it( `Should work with alg(${theory.alg})`, async function() {
                const testString = 'test-string';
                const formatSettings: IFormatSettings = {
                    encrypted: true,
                    algorithm: theory.alg,
                    key: theory.key,
                    iv: theory.iv,
                    type: 'TEST'
                }
                // encrypt string
                const result = await encrypt(testString, formatSettings);

                // decrypt string
                const plainText = await decrypt(result, formatSettings);

                // should be the same as the original
                expect(plainText).to.eq(testString);

            });
        });
    });
});