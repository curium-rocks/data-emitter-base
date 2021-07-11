# data-emitter-base
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_data-emitter-base&metric=coverage)](https://sonarcloud.io/dashboard?id=curium-rocks_data-emitter-base)[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_data-emitter-base&metric=security_rating)](https://sonarcloud.io/dashboard?id=curium-rocks_data-emitter-base)

Contains a set of base classes and interfaces to minimize
boilerplate code when integrating data sources.

## IDataEmitter
This is the primary interface that all emitters implement. 

### Usage

#### Subscribe to events
```typescript
import {IDataEmitter} from '@curium.rocks/data-emitter-base';

// replace new ADataEmitterImplementation() with your code
// to get a object IDataEmitter that implements 
// the IDataEmitter interface
const emitter: IDataEmitter = new ADataEmitterImplementation();
const onDataListener = emitter.onData({
    onData: (evt) => {
        if(evt.data instanceof string){
            console.log(`data: ${evt.data}`)
        }
    }
})
const onStatusListener = emitter.onStatus({
    onStatus: (evt) => {
        if(evt.bit) {
            console.log("emitter is in a failed state");
        } else {
            console.log("emitter is in a healthy state");
        }
        if(evt.connected) {
            console.log("emitter is connected to it's data source");
        } else {
            console.log("emitter is disconnected from it's data source");
        }
    }
})

// when finished with the emitter, call dispose to unregister
// the event listener
onDataListener.dispose();
onStatusListener.dispose();
```

#### On demand fetch

```typescript
import {IDataEmitter} from '@curium.rocks/data-emitter-base';
import {IDataEvent, IStatusEvent} from "./dataEmitter";

// replace new ADataEmitterImplementation() with your code
// to get a object IDataEmitter that implements 
// the IDataEmitter interface
const emitter: IDataEmitter = new ADataEmitterImplementation();

const latestData: IDataEvent = await emitter.probeCurrentData();
const latestStatus: IStatusEvent = await emitter.probeStatus();

if (latestData.data instanceof string) {
    console.log(`data: ${latestData.data}`)
}

if(latestStatus.bit) {
    console.log("emitter in failed state");
} else {
    console.log("emitter in healthy state");
}

if(latestStatus.connected) {
    console.log("emitter connected");
} else {
    console.log("emitter disconnected");
}
```

## BaseEmitter
The BaseEmitter class provides an optional implementation 
of the generic portions of the IDataEmitter class to reduce 
repetitive code across emitters.

### Usage

#### Extending to wrap event emitter

```typescript
import {
    BaseEmitter,
    ICommand,
    IDataEvent,
    IExecutionResult,
    ISettings,
    IStatusEvent,
    ITraceableAction
} from "@curium.rocks/data-emitter-base";

/**
 * Simple wrapper around process signal handler wrap the signal
 * and emit in a generic way
 */
class SignalEmitter extends BaseEmitter {
    private lastDataEvent?: IDataEvent;

    /**
     *
     * @param {string} id unique identifier of the emitter
     * @param {string} name short human readable name of the emitter
     * @param {string} desc long description of emitter
     */
    constructor(id: string, name: string, desc: string) {
        super(id, name, desc);


        process.on("SIGINT", ()=>{
            this.lastDataEvent = this.buildDataEvent("SIGINT");
            this.notifyDataListeners(this.lastDataEvent)
        });

    }

    /**
     * Use this to apply any settings such as intervals, which gpio pin to use etc
     * @param {ISettings} settings
     * @return {Promise<IExecutionResult>}
     */
    applySettings(settings: ISettings & ITraceableAction): Promise<IExecutionResult> {
        return Promise.reject(new Error("Not Implemented"));
    }

    /**
     * Probe the latest or current data
     * @return {Promise<IDataEvent>}
     */
    probeCurrentData(): Promise<IDataEvent> {
        if(!this.lastDataEvent) return Promise.reject(new Error("data unavailable"));
        return Promise.resolve(this.lastDataEvent);
    }

    /**
     * Probe the current status of the device,
     * this information contains the connection, and BIT (Built In Test)
     * status
     * @return {Promise<IStatusEvent>}
     */
    probeStatus(): Promise<IStatusEvent> {
        return Promise.reject(new Error("Not implemented"));
    }

    /**
     * Can be used to send information/commands to the wrapped integration,
     * this could send a HTTP post somewhere, write to a socket, broadcast over a radio
     * @param {ICommand} command
     * @return {Promise<IExecutionResult>}
     */
    sendCommand(command: ICommand): Promise<IExecutionResult> {
        return Promise.reject(new Error("Not Implemented"));
    }

    /**
     * Return meta information about the emitter, could be a map, string, array,
     * etc. The purpose of this is to provide a mechanism to get more information
     * about the emitter beyond id, name, description that isn't uniform across
     * emitters
     */
    getMetaData(): unknown {
        throw new Error("Not Implemented");
    }

}
```
## PollingEmitter
The PollingEmitter provides a common point for all emitters 
that require timed polling to fetch data.

### Usage
#### Extending to watch a file
```typescript
import {ICommand, IExecutionResult, PollingEmitter} from "@curium.rocks/data-emitter-base"
import fs from 'fs';

/**
 * Test class for polling emitter
 */
class FilePollingEmitter extends PollingEmitter {


    /**
     * Poll function
     * @return {Promise<unknown>}
     */
    poll(): Promise<unknown> {
        return new Promise((resolve, reject)=>{
            fs.readFile('./test.txt', 'utf8' , (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            })
        });

    }

    /**
     * Execute sending a command
     * @param {ICommand} command information
     * @return {Promise<IExecutionResult>}
     */
    sendCommand(command: ICommand): Promise<IExecutionResult> {
        return Promise.resolve({
            success: true,
            actionId: command.actionId
        })
    }

    /**
     * return meta information
     * @return {unknown}
     */
    getMetaData(): unknown {
        return {
            example: "example-val"
        }
    }

}
```

## Integrations
Check [here](https://www.npmjs.com/search?q=%40curium.rocks) for more integrations that implement these interfaces.