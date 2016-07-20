'use strict';

import { into, transduce, filter } from './transducers.js';
import { dequeue, Buffer, SlidingBuffer, DroppingBuffer } from './impl/buffers.js';

export {
    Buffer,
    SlidingBuffer,
    DroppingBuffer,
    go,
    chan,
    take,
    put,
    alts,
    takeAsync,
    putAsync,
    altsAsync,
    timeout
};

function go(generator) {
    const machine = generator();
    const channel = chan();
    go_(channel, machine, machine.next());
    return channel;
}

function go_(channel, machine, step) {
    const [ state, value ] = step.value();

    if( state === 'park' ) {
        setImmediate(function() { go_(channel, machine, step); });
    } else if( state === 'resume' ) {
        if( step.done ) {
            if( value !== null ) {
                putAsync(channel, value).then(() => channel.close());
            } else {
                channel.close();
            }
            return;
        }
        go_(channel, machine, machine.next(value));
    }
}

function chan(n = 0, xform = null, exHandler = null) {
    const buffer = n === 0 ? Buffer(1) :
        typeof n === 'number' ? Buffer(n) :
        n;
    let isClosed = false;

    if( n === 0 && xform ) {
        xform = null;
    }

    return Object.freeze({
        take,
        put,
        canPut,
        canTake,
        close
    });

    function take() {
        let x = buffer.pop();
        return x;
    }

    function put(x) {
        if( x === null ) {
            throw new Error('Can\'t put null on a channel');
        }

        if( xform ) {
            transduce(xform, (_, input) => {
                buffer.unshift(input);
                return buffer;
            }, [x], []);
        } else {
            buffer.unshift(x);
        }
    }

    function canPut() {
        return !buffer.isFull();
    }

    function canTake() {
        return !buffer.isEmpty();
    }

    function close() {
        isClosed = true;
    }
}

function put(channel, x) {
    return () => {
        if( channel.isClosed() ) {
            return ['resume', false];
        } else if( channel.canPut() ) {
            channel.put(x);
            return ['resume', true];
        } else {
            return ['park', null];
        }
    }
}

function take(channel) {
    return () => {
        if( channel.canTake() ) {
            return ['resume', channel.take()];
        } else if( channel.isClosed() ) {
            return ['resume', null];
        } else {
            return ['park', null];
        }
    }
}

function alts(operations, { priority = false, defaultValue = null } = {}) {
    const xform = filter(channel => Array.isArray(channel) && channel[0].canPut() || channel.canTake());
    return () => {
        let ready = [];
        into(ready, xform, operations);

        if( ready.length ) {
            const chosen = priority ? 0 : Math.floor(Math.random() * ready.length);
            const channel = operations[chosen];
            if( Array.isArray(channel) ) {
                channel[0].put(channel[1]);
                return ['resume', [ channel, null ]];
            } else {
                return ['resume', [ channel, channel.take() ]];
            }
        } else if( defaultValue ) {
            return ['resume', [ null, defaultValue ]];
        } else {
            return ['park', null];
        }
    }
}

function putAsync(channel, x) {
    return new Promise(resolve => {
        tryPut();
        function tryPut() {
            if( channel.isClosed() ) {
                resolve(false);
            } else if( channel.canPut() ) {
                channel.put(x);
                resolve(true);
            } else {
                setImmediate(tryPut);
            }
        }
    });
}

function takeAsync(channel) {
    return new Promise(resolve => {
        tryTake();
        function tryTake() {
            if( channel.canTake() ) {
                resolve(channel.take());
            } else if( channel.isClosed() ) {
                resolve(null);
            } else {
                setImmediate(tryTake);
            }
        }
    });
}

function altsAsync(operations, { priority = false, defaultValue = null } = {}) {
    let done = false;
    return Promise.race(operations.map(channel => new Promise(resolve => {
        tryOp();
        function tryOp() {
            if( done ) {
                resolve();
            } else if( Array.isArray(channel) ) {
                if( channel[0].isClosed() ) {
                    resolve(false);
                } else if( channel[0].canPut() ) {
                    channel[0].put(channel[1]);
                    resolve(true);
                } else {
                    setImmediate(tryOp);
                }
            } else if( channel.canTake() ) {
                resolve(channel.take());
            } else if( channel.isClosed() ) {
                resolve(null);
            } else {
                setImmediate(tryOp);
            }
        }
    })));
}

function timeout(msec) {
    const c = chan();
    setTimeout(() => c.close(), msec);
    return c;
}
