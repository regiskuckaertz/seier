var seier = (function () { 'use strict';

    var babelHelpers = {};
    babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
    };
    babelHelpers;

    function transduce(xform, reducer, coll, init) {
        reducer = typeof reducer === 'function' ? wrap(reducer) : reducer;
        xform = xform(reducer);
        init = init || xform.init();
        reduce(xform, init, coll);
    }

    function into$1(dest, xform, source) {
        return isString(dest) ? transduce(xform, append, source, dest) : isArray(dest) ? transduce(xform, push, source, dest) : isObject(dest) ? transduce(xform, set, source, dest) : dest;
    }

    function isString(x) {
        return typeof x === 'string';
    }

    function isArray(x) {
        return x instanceof Array || isArrayLike(x) || x instanceof Int8Array || x instanceof Uint8Array || x instanceof Uint8ClampedArray || x instanceof Int16Array || x instanceof Uint16Array || x instanceof Int32Array || x instanceof Uint32Array || x instanceof Float32Array || x instanceof Float64Array;
    }

    function isArrayLike(x) {
        return Number.isInteger(x.length) && typeof x !== 'function';
    }

    function isIterable(x) {
        return typeof Symbol !== 'undefined' && Symbol.iterator in x;
    }

    function isObject(x) {
        return (typeof x === 'undefined' ? 'undefined' : babelHelpers.typeof(x)) === 'object' && x !== null;
    }

    function reduce(fn, init, coll) {
        fn = typeof fn === 'function' ? wrap(fn) : fn;
        if (isString(coll)) {
            return stringReduce(fn, init, coll);
        } else if (isArray(coll)) {
            return arrayReduce(fn, init, coll);
        } else if (isIterable(coll)) {
            return iterableReduce(fn, init, coll);
        } else if (isObject(coll)) {
            return objectReduce(fn, init, coll);
        } else {
            throw coll + " is not a reducible collection";
        }
    }

    function stringReduce(fn, init, str) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = str[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var char = _step.value;

                init = fn(init, char);
                if (isReduced(init)) {
                    init = deref(init);
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return fn.result(init);
    }

    function arrayReduce(fn, init, arr) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = arr[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var item = _step2.value;

                init = fn.step(init, item);
                if (isReduced(init)) {
                    init = deref(init);
                    break;
                }
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        return fn.result(init);
    }

    function iterableReduce(fn, init, iter) {
        iter = iter[Symbol.iterator]();
        var step = iter.next();
        while (!step.done) {
            init = fn.step(init, step.value);
            if (isReduced(init)) {
                init = deref(init);
                break;
            }
            step = iter.next();
        }
        return fn.result(init);
    }

    function objectReduce(fn, init, obj) {
        var keys = Object.keys(obj);
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = keys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var key = _step3.value;

                init = fn.step(init, obj[key]);
                if (isReduced(init)) {
                    init = deref(init);
                    break;
                }
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return fn.result(init);
    }

    var reducedKey = Symbol('reduced');

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

    function append(str, char) {
        return str + char;
    }

    function set(obj, pair) {
        obj[pair[0]] = pair[1];
    }

    function wrap(xf) {
        return Object.freeze({
            init: function init() {
                throw new Error("There is no init call for a wrapped reducer");
            },
            result: function result(_result) {
                return _result;
            },
            step: xf
        });
    }

    function map$1(fn) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result2) {
                    return xf.result(_result2);
                },
                step: function step(result, input) {
                    return xf.step(result, fn(input));
                }
            });
        };
    }

    function filter(pred) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result3) {
                    return xf.result(_result3);
                },
                step: function step(result, input) {
                    return pred(input) ? xf.result(result, input) : result;
                }
            });
        };
    }

    function complement(fn) {
        return function () {
            return !fn.apply(undefined, arguments);
        };
    }

    var remove = function remove(pred) {
        return filter(complement(pred));
    };

    function cat(xf) {
        return Object.freeze({
            init: function init() {
                return xf.init();
            },
            result: function result(_result4) {
                return xf.result(_result4);
            },
            step: function step(result, input) {
                return reduce(xf, result, input);
            }
        });
    }

    function compose(f, g) {
        for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            rest[_key - 2] = arguments[_key];
        }

        return rest.length === 0 ? function () {
            return f(g.apply(undefined, arguments));
        } : compose(f, compose.apply(undefined, [g].concat(rest)));
    }

    function mapcat(fn) {
        return compose(map$1(fn), cat);
    }

    function take(n) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result5) {
                    return xf.result(_result5);
                },
                step: function step(result, input) {
                    return n === 0 ? ensureReduced(result) : (n--, xf.step(result, input));
                }
            });
        };
    }

    function drop(n) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result6) {
                    return xf.result(_result6);
                },
                step: function step(result, input) {
                    return n === 0 ? xf.step(result, input) : (n--, result);
                }
            });
        };
    }

    function takeWhile(pred) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result7) {
                    return xf.result(_result7);
                },
                step: function step(result, input) {
                    return pred(input) ? xf.step(result, input) : ensureReduced(result);
                }
            });
        };
    }

    function dropWhile(pred) {
        return function (xf) {
            var dropping = true;
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result8) {
                    return xf.result(_result8);
                },
                step: function step(result, input) {
                    return dropping && pred(input) ? result : (dropping = false, xf.step(result, input));
                }
            });
        };
    }

    function takeNth(nth) {
        return function (xf) {
            var n = 0;
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result9) {
                    return xf.result(_result9);
                },
                step: function step(result, input) {
                    n++;
                    return n % nth === 0 ? xf.step(result, input) : result;
                }
            });
        };
    }

    function replace(smap) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result10) {
                    return xf.result(_result10);
                },
                step: function step(result, input) {
                    return xf.step(result, smap.hasOwnProperty(input) ? smap[input] : input);
                }
            });
        };
    }

    function partitionBy(fn) {
        return function (xf) {
            var arr = [];
            var pval = void 0;
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result11) {
                    if (arr.length) {
                        _result11 = unreduced(xf.step(_result11, arr));
                        arr = [];
                    }
                    return xf.result(_result11);
                },
                step: function step(result, input) {
                    var val = fn(input);
                    var pv = pval;
                    pval = val;
                    if (val === pv) {
                        arr.push(input);
                        return result;
                    } else {
                        var ret = xf.step(result, arr);
                        arr = [];
                        if (!isReduced(ret)) {
                            arr.push(input);
                        }
                        return ret;
                    }
                }
            });
        };
    }

    function partitionAll(n) {
        return function (xf) {
            var arr = [];
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result12) {
                    if (arr.length) {
                        _result12 = unreduced(xf.step(_result12, arr));
                        arr = [];
                    }
                    return xf.result(_result12);
                },
                step: function step(result, input) {
                    arr.push(input);
                    if (arr.length === n) {
                        result = xf.step(result, arr);
                        arr = [];
                    }
                    return result;
                }
            });
        };
    }

    function keep(fn) {
        return function (xf) {
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result13) {
                    return xf.result(_result13);
                },
                step: function step(result, input) {
                    return fn(input) == null ? result : xf.step(result, input);
                }
            });
        };
    }

    function keepIndexed(fn) {
        return function (xf) {
            var i = 0;
            Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result14) {
                    return xf.result(_result14);
                },
                step: function step(result, input) {
                    return fn(i++, input) == null ? result : xf.step(result, input);
                }
            });
        };
    }

    function mapIndexed(fn) {
        return function (xf) {
            var i = 0;
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result15) {
                    return xf.result(_result15);
                },
                step: function step(result, input) {
                    return xf.step(result, fn(i++, input));
                }
            });
        };
    }

    function distinct() {
        return function (xf) {
            var arr = [];
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result16) {
                    return xf.result(_result16);
                },
                step: function step(result, input) {
                    return arr.indexOf(input) === -1 ? (arr.push(input), xf.step(result, input)) : result;
                }
            });
        };
    }

    function interpose(sep) {
        return function (xf) {
            var first = true;
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result17) {
                    return xf.result(_result17);
                },
                step: function step(result, input) {
                    return first ? (first = false, xf.step(result, input)) : xf.step(xf.step(result, sep), input);
                }
            });
        };
    }

    function dedupe() {
        return function (xf) {
            var pv = void 0;
            return Object.freeze({
                init: function init() {
                    return xf.init();
                },
                result: function result(_result18) {
                    return xf.result(_result18);
                },
                step: function step(result, input) {
                    return pv !== input ? (pv = input, xf.step(result, input)) : result;
                }
            });
        };
    }

    function randomSample(prob) {
        return filter(function () {
            return Math.random() < prob;
        });
    }

    var transducers = Object.freeze({
        isString: isString,
        isArray: isArray,
        isArrayLike: isArrayLike,
        isIterable: isIterable,
        isObject: isObject,
        compose: compose,
        reduce: reduce,
        map: map$1,
        filter: filter,
        remove: remove,
        mapcat: mapcat,
        take: take,
        takeWhile: takeWhile,
        takeNth: takeNth,
        drop: drop,
        dropWhile: dropWhile,
        replace: replace,
        partitionBy: partitionBy,
        partitionAll: partitionAll,
        keep: keep,
        keepIndexed: keepIndexed,
        mapIndexed: mapIndexed,
        distinct: distinct,
        interpose: interpose,
        dedupe: dedupe,
        randomSample: randomSample,
        transduce: transduce,
        into: into$1
    });

    function memoize(fn, arity) {
        var memoized = {};
        arity || (arity = fn.length);
        return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var hash = reduce(function (res, arg) {
                return res + arg.toString();
            }, '', args);
            return memoized[hash] !== undefined ? memoized[hash] : memoized[hash] = fn.apply(undefined, args);
        };
    }

    function curry(fn) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
        }

        var len = fn.length - args.length;
        switch (len) {
            case 0:
                return function () {
                    return fn.apply(undefined, args);
                };
            case 1:
                return function (arg) {
                    return fn.apply(undefined, args.concat([arg]));
                };
            case 2:
                return function (arg1, arg2) {
                    return fn.apply(undefined, args.concat([arg1, arg2]));
                };
            case 3:
                return function (arg1, arg2, arg3) {
                    return fn.apply(undefined, args.concat([arg1, arg2, arg3]));
                };
            default:
                return function () {
                    for (var _len3 = arguments.length, sargs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                        sargs[_key3] = arguments[_key3];
                    }

                    return fn.apply(undefined, args.concat(sargs));
                };
        }
    }

    var cssRE = /^(?:[a-zA-Z_]|(-[a-zA-Z0-9_]))[a-zA-Z0-9_-]*$/;

    var mapToKey = memoize(function (dataAttr) {
        return dataAttr.replace(/^data-/, '').replace(/(-[a-z])/g, function ($1) {
            return $1.charAt(1).toUpperCase();
        });
    });

    /** Node selection */

    /* get(String|Element: selector, Element?: root): Element */
    function get(selector, root) {
        if (selector.charAt(0) === '#' && cssRE.test(selector.substring(1))) {
            return getById(selector);
        }
        root = root instanceof Element ? root : document;
        return root.querySelector(selector);
    }

    function getAll(selector, root) {
        root = root instanceof Element ? root : document;
        if (cssRE.test(selector)) {
            return getByTag(selector, root);
        }
        if (cssRE.test(selector.substring(1))) {
            switch (selector.charAt(0)) {
                case '#':
                    return [getById(selector)];
                case '.':
                    return getByClass(selector, root);
            }
        }
        return root.querySelectorAll(selector);
    }

    function getById(id) {
        return document.getElementById(id);
    }

    function getByTag(tn, root) {
        root = root instanceof Element ? root : document;
        return root.getElementsByTagName(selector);
    }

    function getByClass(cn, root) {
        root = root instanceof Element ? root : document;
        return root.getElementsByClassName(cn);
    }

    /** Object properties manipulation */

    var normalisedProps = {
        tabindex: 'tabIndex',
        for: 'htmlFor',
        class: 'className',
        readonly: 'readOnly',
        maxlength: "maxLength",
        cellspacing: "cellSpacing",
        cellpadding: "cellPadding",
        rowspan: "rowSpan",
        colspan: "colSpan",
        usemap: "useMap",
        frameborder: "frameBorder",
        contenteditable: "contentEditable"
    };

    function normaliseProp(prop) {
        return normalisedProps[prop] || prop;
    }

    function getProp(prop, obj) {
        return obj[normaliseProp(prop)];
    }

    function setProp(prop, val, obj) {
        obj[normaliseProp(prop)] = val;
        return obj;
    }

    function removeProp(prop, obj) {
        obj[normaliseProp(prop)] = void 0;
    }

    /** Node attributes manipulation */

    function getAttr(attr, el) {
        return el.getAttribute(attr);
    }

    function setAttr(attr, val, el) {
        el.setAttribute(attr, val);
        return obj;
    }

    function removeAttr(attr, el) {
        el.removeAttribute(attr);
        return obj;
    }

    /** Class manipulation */

    function addClass(cn, el) {
        el.classList.add(cn);
        return el;
    }

    function removeClass(cn, el) {
        el.classList.remove(cn);
        return el;
    }

    function toggleClass(cn, el) {
        el.classList.toggle(cn);
        return el;
    }

    function hasClass(cn, el) {
        return el.classList.contains(cn);
    }

    /** Dataset manipulation */

    function setData(data, val, el) {
        el.dataset[mapToKey(data)] = val;
        return el;
    }

    function getData(data, el) {
        return el.dataset[mapToKey(data)];
    }

    function removeData(data, el) {
        el.dataset[mapToKey(data)] = void 0;
        return el;
    }

    /** Input value manipulation */

    var multivalXform = map(curry(getProp, 'value'));

    function getVal(el) {
        return el.tagName === 'SELECT' && el.multiple ? into$1([], multivalXform, el.selectedOptions) : getProp('value', el);
    }

    var setVal = curry(setProp, 'value');

    /** Inner content manipulation */

    var getHtml = curry(getProp, 'innerHtml');
    var setHtml = curry(setProp, 'innerHtml');
    var getText = curry(getProp, 'textContent');
    var setText = curry(setProp, 'textContent');

    function insertHtml(where) {
        return function (html, el) {
            el.insertAdjacentHTML(where, html);
            return target;
        };
    }

    var after = insertHtml('afterend');
    var before = insertHtml('beforebegin');
    var append$1 = insertHtml('beforeend');
    var prepend = insertHtml('afterbegin');

    function insertElement(target, before, source, clone) {
        if (arguments.length === 2 || arguments.length === 3) {
            clone = source;
            source = before;
            before = null;
        }

        target.insertBefore(clone ? source.cloneNode(true) : source, before);
        return parent;
    }

    function afterElement(target, source, clone) {
        return insertElement(target.parentNode, target.nextSibling, source, clone);
    }

    function appendElement(target, source, clone) {
        return insertElement(target, source, clone);
    }

    function beforeElement(target, source, clone) {
        return insertElement(target.parentNode, target, source, clone);
    }

    function prependElement(target, source, clone) {
        return insertElement(target, target.firstChild, source, clone);
    }

    var filterChildrenXForm = filter(function (el) {
        return el.matches(sel);
    });

    function filterChildren(el, sel) {
        return into$1([], filterChildrenXForm, el.children);
    }

    function children(el, sel) {
        return arguments.length === 1 ? el.children : filterChildren(el, sel);
    }

    /** Computed styles manipulation */

    function getStyles(pseudo, el) {
        return window.getComputedStyle(el, pseudo);
    }

    function getCss(prop, pseudo, el) {
        var styles = getStyles(pseudo, el);
        return styles[prop];
    }

    function setCss(prop, value, el) {
        el.style[prop] = value;
    }



    var dom = Object.freeze({
        get: get,
        getAll: getAll,
        getById: getById,
        getByTag: getByTag,
        getByClass: getByClass,
        getProp: getProp,
        setProp: setProp,
        removeProp: removeProp,
        getAttr: getAttr,
        setAttr: setAttr,
        removeAttr: removeAttr,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        hasClass: hasClass,
        setData: setData,
        getData: getData,
        removeData: removeData,
        getVal: getVal,
        setVal: setVal,
        getHtml: getHtml,
        setHtml: setHtml,
        getText: getText,
        setText: setText,
        after: after,
        before: before,
        append: append$1,
        prepend: prepend,
        afterElement: afterElement,
        beforeElement: beforeElement,
        appendElement: appendElement,
        prependElement: prependElement,
        children: children,
        getStyles: getStyles,
        getCss: getCss,
        setCss: setCss
    });

    var identity = map$1(function (x) {
        return x;
    });

    var seier = {
        dom: dom,
        transducers: transducers
    };

    return seier;

})();