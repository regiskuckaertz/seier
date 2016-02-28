import {reduce} from './transducers.js';

export {
    memoize,
    curry
};

function memoize(fn, arity) {
    let memoized = {};
    arity || (arity = fn.length);
    return function(...args) {
        var hash = reduce((res, arg) => res + arg.toString(), '', args);
        return memoized[hash] !== undefined ?
            memoized[hash] :
            (memoized[hash] = fn(...args));
    }
}

function curry(fn, ...args) {
    const len = fn.length - args.length;
    switch( len ) {
        case 0: return () => fn(...args);
        case 1: return (arg) => fn(...args, arg);
        case 2: return (arg1, arg2) => fn(...args, arg1, arg2);
        case 3: return (arg1, arg2, arg3) => fn(...args, arg1, arg2, arg3);
        default: return (...sargs) => fn(...args, ...sargs);
    }
}
