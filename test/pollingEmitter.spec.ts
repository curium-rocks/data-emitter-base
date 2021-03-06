import { describe, it} from 'mocha';
import { expect } from 'chai';
import { TestDeltaPollingEmitter, TestPollingEmitter } from './helpers/testPollingEmitter';
import { TestLogger } from './helpers/testLogger';
import { IDataEvent, IDisposable } from '../src/dataEmitter';

const logger = new TestLogger();

const sleep = (sleepMs:number) : Promise<void> => {
    return new Promise((resolve)=>{
        setTimeout(resolve, sleepMs);
    });
}

describe( 'PollingEmitter', async ()=> {
    describe( 'onData', async () => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        })
        it( 'Should provide data', async () => {
            let data:IDataEvent|null = null; 
            const disposable = pollingEmitter.onData({
                onData: (dataEvent) => {
                    data = dataEvent;
                }
            });
            try {
                await sleep(500);
                expect(data).to.not.be.null;
                if(data != null) {
                    const dataEvent = data as IDataEvent;
                    expect(dataEvent.data).to.be.eq('test')
                }
            } finally {
                disposable.dispose();
            }
        });
        it( 'Should provide data that can be serialized', async () => {
            let data:unknown = null;
            const disposable = pollingEmitter.onData({
                onData: (dataEvent) => {
                    data = dataEvent.toJSON();
                }
            });
            try {
                await sleep(500);
                expect(data).to.not.be.null;
            } finally {
                disposable.dispose();
            }
        });
    })
    describe('onStatus', async () => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        })
        it('Should send event on fault', (done) => {
            const timeout = setTimeout(()=>{
                expect(true).to.be.eq(false);
                done();
            }, 500)
            const disposable = pollingEmitter.onStatus({
                onStatus: (evt) => {
                    expect(evt.bit).to.be.true;
                    const serialized = evt.toJSON();
                    expect(serialized).to.not.be.null;
                    clearTimeout(timeout);
                    disposable.dispose();
                    done();
                }
            })
            pollingEmitter.setFaulted(true);

        });
        it('Should send event on clear', (done) => {

            pollingEmitter.setFaulted(false);
            const timeout = setTimeout( ()=>{
                expect(true, "event timeout").to.be.eq(false);
                done();
            }, 500)
            let flipped = false;
            let evts = 0;
            const disposable = pollingEmitter.onStatus((evt) => {
                    if(flipped) {
                        expect(evt.bit, "expecting fault").to.be.false;
                    } else {
                        expect(evt.bit, "expecting clear").to.be.true;
                    }
                    flipped = !flipped;
                    evts++;
                    pollingEmitter.setFaulted(flipped);
                    if(evts == 2) {
                        disposable.dispose();
                        clearTimeout(timeout);
                        done();
                    }
                }
            );
        })
        it('Should send event on connection changes',(done) => {
            pollingEmitter.stopPolling();
            pollingEmitter.setFaulted(true);
            // trigger fault now, this also stops updates
            pollingEmitter.pollNow().then(() => {
                pollingEmitter.setDCSettings(50, 100);
                const timeout = setTimeout(()=>{
                    expect(false, "timeout").to.be.true;
                    done();
                }, 500);
                let shouldbeConnected = false;
                const disposable = pollingEmitter.onStatus({
                    onStatus: (evt) => {
                        expect(evt.connected).to.be.eq(shouldbeConnected);
                        if(!shouldbeConnected) {
                            shouldbeConnected = true;
                            pollingEmitter.setFaulted(false);
                            pollingEmitter.pollNow();
                        } else {
                            clearTimeout(timeout);
                            disposable.dispose();
                            done();
                        }

                    }
                });
                return pollingEmitter.pollNow();
            })

        })
    })
    describe('applySettings', async () => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        })
        it( 'Should correctly apply settings', (done) => {
            pollingEmitter.applySettings({
                id: 'new-test',
                name: 'new-name',
                description: 'new-link',
                actionId: '2',
                additional: {},
                interval: 100
            }).then((res)=>{
                expect(res.actionId).to.be.eq('2');
                expect(res.success).to.be.true;
                expect(res.failureReason).to.be.undefined;
                expect(pollingEmitter.description).to.be.eq('new-link');
                expect(pollingEmitter.name).to.be.eq('new-name');
                expect(pollingEmitter.id).to.be.eq('new-test');
                done();
            })
        });
    })
    describe('probeStatus', async() => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        })
        it('Should provide connection information', async ()=>{
            pollingEmitter.setFaulted(false);
            await pollingEmitter.pollNow();
            const status = await pollingEmitter.probeStatus();
            expect(status.connected, "Should be connected").to.be.true;
            expect(status.bit, "Should not have bit failure").to.be.false;
            expect(status.timestamp, "Should have a timestamp").to.not.be.null;
        })
    })
    describe('probeCurrentData', async() => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        })
        it('Should provide latest data', async () =>{
            await pollingEmitter.pollNow();
            const data = await pollingEmitter.probeCurrentData();
            expect(data.data).to.not.be.null;
            expect(data.data).to.be.eq('test');
            expect(data.emitter).to.be.eq(pollingEmitter);
            expect(data.meta).to.not.be.null;
            expect(data.timestamp).to.not.be.null;
        })
    })
    describe('startPolling', function() {
        it('Start emitting data events', async function() {
            const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
            let emitCount = 0;
            const disposable = pollingEmitter.onData((dataEvt)=>{
                emitCount++;
            })
            await sleep(300);
            expect(emitCount).to.be.eq(0);
            pollingEmitter.startPolling();
            await sleep(300);
            expect(emitCount).to.be.greaterThan(0);
            pollingEmitter.dispose();
            disposable.dispose();
        })
    });
    describe('start()', function() {
        it('Should start emitting data events', async function() {
            const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
            let emitCount = 0;
            const disposable = pollingEmitter.onData((dataEvt)=>{
                emitCount++;
            })
            await sleep(300);
            expect(emitCount).to.be.eq(0);
            pollingEmitter.start();
            await sleep(300);
            expect(emitCount).to.be.greaterThan(0);
            pollingEmitter.dispose();
            disposable.dispose();
        })
    })
    describe('stop()', function(){
        it('Should stop timers emitting data', async function() {
            const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
            let emitCount = 0;
            const disposable = pollingEmitter.onData((dataEvt)=>{
                emitCount++;
            })
            pollingEmitter.startPolling();
            await sleep(300);
            expect(emitCount).to.be.greaterThan(0);
            pollingEmitter.stop();
            emitCount = 0;
            await sleep(300);
            expect(emitCount).to.be.eq(0);
            pollingEmitter.dispose();
            disposable.dispose();
        })
    })
    describe('stopPolling', function(){
        it('Should stop timers emitting data', async function() {
            const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
            let emitCount = 0;
            const disposable = pollingEmitter.onData((dataEvt)=>{
                emitCount++;
            })
            pollingEmitter.startPolling();
            await sleep(300);
            expect(emitCount).to.be.greaterThan(0);
            pollingEmitter.stopPolling();
            emitCount = 0;
            await sleep(300);
            expect(emitCount).to.be.eq(0);
            pollingEmitter.dispose();
            disposable.dispose();
        })
    })
    describe('dispose', function(){
        it('Should clean up any timers', async function() {
            const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
            let emitCount = 0;
            const onDataListener = pollingEmitter.onData((dataEvt)=>{
                emitCount++;
            })
            const onStatusListener = pollingEmitter.onStatus((statusEvt)=>{
                emitCount++;
            })
            pollingEmitter.startPolling();
            await sleep(300);
            expect(emitCount).to.be.greaterThan(0);
            pollingEmitter.dispose();
            emitCount = 0;
            await sleep(300);
            expect(emitCount).to.be.eq(0);
            onDataListener.dispose();
            onStatusListener.dispose();
        })
    })
});

describe('DeltaPollingEmitter',  function() {
    describe('onData', function() {
        const pollingEmitter = new TestDeltaPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100, logger);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        });
        it('should not emit without change', function(done) {
            pollingEmitter.setHasChanged(false);
            const timeout = setTimeout(()=>{
                disposable.dispose();
                done();
                clearTimeout(timeout);
            },500);
            const disposable = pollingEmitter.onData({
                onData: (dataEvent) => {
                    expect(true).to.be.false("Should not have received data");
                    done();
                    clearTimeout(timeout);
                }
            });
        });
        it( 'Should emit when changed', (done) => {
            pollingEmitter.setHasChanged(true);
            pollingEmitter.setData("test");
            const timeout = setTimeout(()=>{
                expect(false, "timeout").to.be.eq(true);
                disposable.dispose();
                done();
            },500);
            const disposable = pollingEmitter.onData({
                onData: (dataEvent) => {
                    expect(dataEvent).to.not.be.null;
                    expect(dataEvent.data).to.be.eq('test')
                    clearTimeout(timeout);
                    done();
                }
            });
        });
    })
})