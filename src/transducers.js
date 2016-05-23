'use strict';

import { complement, compose } from './functions.js';

export {
    isString,
    isArray,
    isArrayLike,
    isIterable,
    isObject,
    compose,
    reduce,
    map,
    filter,
    remove,
    mapcat,
    take,
    takeWhile,
    takeNth,
    drop,
    dropWhile,
    replace,
    partitionBy,
    partitionAll,
    keep,
    keepIndexed,
    mapIndexed,
    distinct,
    interpose,
    dedupe,
    randomSample,
    transduce,
    into
};

function transduce(xform, reducer, coll, init) {
    reducer = typeof reducer === 'function' ? wrap(reducer) : reducer;
    xform = xform(reducer);
    init = init || xform.init();
    reduce(xform, init, coll);
}

function into(dest, xform, source) {
  return isString(dest) ?
    transduce(xform, append, source, dest) :
    isArray(dest) ?
    transduce(xform, push, source, dest) :
    isObject(dest) ?
    transduce(xform, set, source, dest) :
    dest;
}

function isString(x) {
    return typeof x === 'string';
}

function isArray(x) {
    return  x instanceof Array             ||
            isArrayLike(x)                 ||
            x instanceof Int8Array         ||
            x instanceof Uint8Array        ||
            x instanceof Uint8ClampedArray ||
            x instanceof Int16Array        ||
            x instanceof Uint16Array       ||
            x instanceof Int32Array        ||
            x instanceof Uint32Array       ||
            x instanceof Float32Array      ||
            x instanceof Float64Array;
}

function isArrayLike(x) {
    return Number.isInteger(x.length) && typeof x !== 'function';
}

function isIterable(x) {
    return typeof Symbol !== 'undefined' && Symbol.iterator in x;
}

function isObject(x) {
    return typeof x === 'object' && x !== null;
}

function reduce(fn, init, coll) {
    fn = typeof fn === 'function' ? wrap(fn) : fn;
    if( isString(coll) ) {
        return stringReduce(fn, init, coll);
    } else if( isArray(coll) ) {
        return arrayReduce(fn, init, coll);
    } else if( isObject(coll) ) {
        return objectReduce(fn, init, coll);
    } else if( isIterable(coll) ) {
        return iterableReduce(fn, init, coll);
    } else {
        throw coll + " is not a reducible collection";
    }
}

function stringReduce(fn, init, str) {
    for( let char of str ) {
        init = fn.step(init, char);
        if( isReduced(init) ) {
            init = deref(init);
            break;
        }
    }
    return fn.result(init);
}

function arrayReduce(fn, init, arr) {
    for( let item of arr ) {
        init = fn.step(init, item);
        if( isReduced(init) ) {
            init = deref(init);
            break;
        }
    }
    return fn.result(init);
}

function objectReduce(fn, init, obj) {
    let keys = Object.keys(obj);
    for( let key of keys ) {
        init = fn.step(init, obj[key]);
        if( isReduced(init) ) {
            init = deref(init);
            break;
        }
    }
    return fn.result(init);
}

function iterableReduce(fn, init, iter) {
    iter = iter[Symbol.iterator]();
    let step = iter.next();
    while( ! step.done ) {
        init = fn.step(init, step.value);
        if( isReduced(init) ) {
            init = deref(init);
            break;
        }
        step = iter.next();
    }
    return fn.result(init);
}

const reducedKey = Symbol('reduced');

function reduced(coll) {
    coll[reducedKey] = true;
}

function unreduced(coll) {
    return isReduced(coll) ? deref(coll) : coll;
}

function deref(coll) {
    coll[reducedKey] = false;
    return coll;
}

function isReduced(coll) {
    return coll[reducedKey];
}

function ensureReduced(coll) {
    return isReduced(coll) ? coll : reduced(coll);
}

function push(coll, elem) {
    coll.push(elem);
    return coll;
}

function reset(coll) {
    coll.length = 0;
}

function append(str, char) {
    return str + char;
}

function set(obj, pair) {
    obj[pair[0]] = pair[1];
}

function wrap(xf) {
    return Object.freeze({
        init() { throw new Error("There is no init call for a wrapped reducer") },
        result: (result) => result,
        step: xf
    });
}

function map(fn) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step: (result, input) =>  xf.step(result, fn(input))
    });
}

function filter(pred) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step: (result, input) => pred(input) ? xf.result(result, input) : result
    });
}

const remove = pred => filter(complement(pred));

function cat(xf) {
    return Object.freeze({
        init: xf.init,
        result: xf.result,
        step: (result, input) => reduce(xf, result, input)
    });
}

function mapcat(fn) {
    return compose(map(fn), cat);
}

function take(n) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step(result, input) {
            if( n === 0 ) {
                return ensureReduced(result);
            }
            n -= 1;
            return xf.step(result, input);
        }
    });
}

function drop(n) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step(result, input) {
            if( n === 0 ) {
                return xf.step(result, input);
            }
            n -= 1;
            return result;
        }
    });
}

function takeWhile(pred) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step: (result, input) => pred(input) ? xf.step(result, input) : ensureReduced(result)
    });
}

function dropWhile(pred) {
    return (xf) => {
        let dropping = true;
        return Object.freeze({
            init: xf.init,
            result: xf.result,
            step(result, input) {
                if( dropping && pred(input) ) {
                    return result;
                }
                dropping = false;
                return xf.step(result, input);
            }
        });
    };
}

function takeNth(nth) {
    return (xf) => {
        let n = 0;
        return Object.freeze({
            init: xf.init,
            result: xf.result,
            step(result, input) {
                n++;
                return n % nth === 0 ?
                    xf.step(result, input) :
                    result;
            }
        });
    };
}

function replace(smap) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step: (result, input) => xf.step(result, smap.hasOwnProperty(input) ? smap[input] : input)
    });
}

function partitionBy(fn) {
  return (xf) => {
      let arr = [];
      let pval = void 0;
      return Object.freeze({
         init: xf.init,
         result(result) {
             if( arr.length ) {
                 result = unreduced(xf.step(result, arr));
                 arr = [];
             }
             return xf.result(result);
         },
         step(result, input) {
             let val = fn(input);
             let pv = pval;
             pval = val;
             if( val === pv ) {
                 arr.push(input);
                 return result;
             } else {
                 let ret = xf.step(result, arr);
                 arr = [];
                 if( !isReduced(ret) ) {
                     arr.push(input);
                 }
                 return ret;
             }
         }
     });
  };
}

function partitionAll(n) {
    return (xf) => {
        let arr = [];
        return Object.freeze({
            init: xf.init,
            result(result) {
                if( arr.length ) {
                    result = unreduced(xf.step(result, arr));
                    arr = [];
                }
                return xf.result(result);
            },
            step(result, input) {
                arr.push(input);
                if( arr.length === n ) {
                    result = xf.step(result, arr);
                    arr = [];
                }
                return result;
            }
        });
    };
}

function keep(fn) {
    return (xf) => Object.freeze({
        init: xf.init,
        result: xf.result,
        step: (result, input) => fn(input) == null ? result : xf.step(result, input)
    });
}

function keepIndexed(fn) {
    return (xf) => {
        let i = 0;
        Object.freeze({
            init: xf.init,
            result: xf.result,
            step: (result, input) => fn(i++, input) == null ? result : xf.step(result, input)
        });
    };
}

function mapIndexed(fn) {
    return (xf) => {
        let i = 0;
        return Object.freeze({
            init: xf.init,
            result: xf.result,
            step: (result, input) => xf.step(result, fn(i++, input))
        });
    };
}

function distinct() {
    return (xf) => {
        let arr = [];
        return Object.freeze({
            init: xf.init,
            result: xf.result,
            step: (result, input) => arr.indexOf(input) === -1 ?
                (arr.push(input), xf.step(result, input)) :
                result
        });
    };
}

function interpose(sep) {
    return (xf) => {
        let first = true;
        return Object.freeze({
            init: xf.init,
            result: xf.result,
            step(result, input) {
                if( first ) {
                    first = false;
                    return xf.step(result, input);
                }
                return xf.step(xf.step(result, sep), input);
            }
        });
    };
}

function dedupe() {
    return (xf) => {
        let pv = void 0;
        return Object.freeze({
            init: xf.init,
            result: xf.result,
            step(result, input) {
                if( pv !== input ) {
                    pv = input;
                    return xf.step(result, input);
                }
                return result;
            }
        });
    }
}

function randomSample(prob) {
  return filter(() => Math.random() < prob);
}
