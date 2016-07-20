export {
    memoize,
    curry,
    debounce,
    throttle,
    complement,
    compose,
    identity
};

function memoize(fn, arity) {
    const memoized = new WeakMap();
    arity || (arity = fn.length);
    return (...args) => {
        if( !memoized.has(args) ) {
            memoized(args).set(fn(...args));
        }
        return memoized.get(args);
    }
}

function curry(fn, ...args) {
    return fn.bind(undefined, ...args);
}

function debounce(fn, wait = 0, leading = false) {
    let timer;
    let shouldCall = false;
    let first = leading;
    return (...args) => {
        if( !timer ) {
            if( leading && first ) {
                fn(...args);
                first = false;
            }
        } else {
            shouldCall = true;
            window.clearTimeout(timer);
        }
        timer = window.setTimeout(() => {
            if( !leading || shouldCall ) {
                fn(...args);
                shouldCall = false;
            }
            timer = null;
        }, wait);
    }
}

function throttle(fn, wait = 0, leading = true) {
    let timer;
    let shouldCall = false;
    return (...args) => {
        if( !timer ) {
            if( leading ) {
                fn(...args);
            }
            timer = window.setTimeout(() => {
                if( !leading || shouldCall ) {
                    fn(...args);
                    shouldCall = false;
                }
                timer = null;
            });
        } else {
            shouldCall = true;
        }
    }
}

function complement(fn) {
    return (...args) => !fn(...args);
}

function compose(f, g, ...rest) {
    return rest.length === 0 ?
        (...args) => f(g(...args)) :
        compose(f, compose(g, ...rest));
}

function identity(x) {
    return x;
}
