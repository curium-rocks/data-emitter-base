import { describe, it} from 'mocha';
import { expect } from 'chai';
import { TestPollingEmitter } from './helpers/testPollingEmitter';


describe( 'PollingEmitter', async ()=> {
    describe( 'onData', async () => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100);
        before(()=>{
            pollingEmitter.startPolling();
        })
        after(()=>{
            pollingEmitter.stopPolling();
            pollingEmitter.dispose();
        })
        it( 'Should provide data', (done) => {
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
    describe('onStatus', async () => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100);
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
                    clearTimeout(timeout);
                    disposable.dispose();
                    done();
                }
            })
            pollingEmitter.setFaulted(true);

        })
        it('Should send event on clear', (done) => {

            pollingEmitter.setFaulted(false);
            const timeout = setTimeout( ()=>{
                expect(true, "event timeout").to.be.eq(false);
                done();
            }, 500)
            let flipped = false;
            let evts = 0;
            const disposable = pollingEmitter.onStatus({
                onStatus: (evt) => {
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
            });
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
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100);
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
                commLink: 'new-link',
                actionId: '2',
                additional: {},
                interval: 100
            }).then((res)=>{
                expect(res.actionId).to.be.eq('2');
                expect(res.success).to.be.true;
                expect(res.failureReason).to.be.undefined;
                expect(pollingEmitter.commLinkDesc).to.be.eq('new-link');
                expect(pollingEmitter.name).to.be.eq('new-name');
                expect(pollingEmitter.id).to.be.eq('new-test');
                done();
            })
        });
    })
    describe('probeStatus', async() => {
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100);
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
        const pollingEmitter = new TestPollingEmitter('test-id', 'test-name', 'test-comm-desc', 100);
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
});