'use strict';

import {reduce, filter, into} from './transducers.js';
import {memoize, curry} from './functions.js';

export {
    get,
    getAll,
    getById,
    getByTag,
    getByClass,
    getProp,
    setProp,
    removeProp,
    getAttr,
    setAttr,
    removeAttr,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    setData,
    getData,
    removeData,
    getVal,
    setVal,
    getHtml,
    setHtml,
    getText,
    setText,
    after,
    before,
    append,
    prepend,
    afterElement,
    beforeElement,
    appendElement,
    prependElement,
    children,
    getStyles,
    getCss,
    setCss,
};

const cssRE = /^(?:[a-zA-Z_]|(-[a-zA-Z0-9_]))[a-zA-Z0-9_-]*$/;

const mapToKey = memoize((dataAttr) => dataAttr
    .replace(/^data-/, '')
    .replace(/(-[a-z])/g, ($1) => $1.charAt(1).toUpperCase())
);

function callMsg(msg, obj, param1, param2, ...rest) {
    switch( arguments.length ) {
        case 2: return obj[msg]();
        case 3: return obj[msg](param1);
        case 4: return obj[msg](param1, param2);
        default: return obj[msg](param1, param2, ...rest);
    }
}


/** Node selection */

/* get(String|Element: selector, Element?: root): Element */
function get(selector, root) {
    if( selector.charAt(0) === '#' && cssRE.test(selector.substring(1)) ) {
        return getById(selector);
    }
    root = root instanceof Element ? root : document;
    return root.querySelector(selector);
}

function getAll(selector, root) {
    root = root instanceof Element ? root : document;
    if( cssRE.test(selector) ) {
        return getByTag(selector, root);
    }
    if( cssRE.test(selector.substring(1)) ) {
        switch( selector.charAt(0) ) {
            case '#': return [getById(selector)];
            case '.': return getByClass(selector, root);
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

const normalisedProps = {
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

const multivalXform = map(curry(getProp, 'value'));

function getVal(el) {
    return el.tagName === 'SELECT' && el.multiple ?
        into([], multivalXform, el.selectedOptions) :
        getProp('value', el);
}

const setVal = curry(setProp, 'value');


/** Inner content manipulation */

const getHtml = curry(getProp, 'innerHtml');
const setHtml = curry(setProp, 'innerHtml');
const getText = curry(getProp, 'textContent');
const setText = curry(setProp, 'textContent');

function insertHtml(where) {
  return function(html, el) {
    el.insertAdjacentHTML(where, html);
    return target;
  }
}

const after = insertHtml('afterend');
const before = insertHtml('beforebegin');
const append = insertHtml('beforeend');
const prepend = insertHtml('afterbegin');

function insertElement(target, before, source, clone) {
  if( arguments.length === 2 || arguments.length === 3 ) {
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

const filterChildrenXForm = filter(function(el) {
  return el.matches(sel);
});

function filterChildren(el, sel) {
  return into([], filterChildrenXForm, el.children);
}

function children(el, sel) {
  return arguments.length === 1 ?
    el.children :
    filterChildren(el, sel);
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

function getHeight(el) {
    return el instanceof Window ? el.innerHeight :
        el instanceof Document ? el.body.clientHeight :
        el.clientHeight;
}

function getWidth(el) {
    return el instanceof Window ? el.innerWidth :
        el instanceof Document ? el.body.clientWidth :
        el.clientWidth;
}


/** Event manipulation */

function on(evt, fn, el) {
    el.addEventListener(evt, fn);
    return el;
}

function once(evt, fn, el) {
    var onceFn = function(e) {
        if( typeof fn.handleEvent === 'function' ) {
            fn.handleEvent(e);
        } else {
            fn(e);
        }
        off(evt, onceFn, el);
        onceFn = null;
    }
    on(evt, onceFn, el);
    return el;
}

function off(evt, fn, el) {
    el.removeEventListener(evt, el);
    return el;
}

function fire(evt, data, el) {
    var e = createEvent(evt);
    el.dispatchEvent(e)
    return el;
}

function createEvent(evt, data) {
    return isMouseEvent(evt) ? createMouseEvent(evt, data) :
        isKeyboardEvent(evt) ? createKeyboardEvent(evt, data) :
        isTouchEvent(evt) ? createTouchEvent(evt, data) :
        isUIEvent(evt) ? createUIEvent(evt, data) :
        createCustomEvent(evt, data);
}

const mouseEvts = [
    'click', 'dblclick',
    'mousedown', 'mouseup',
    'mouseenter', 'mouseleave',
    'mouseover', 'mouseout',
    'contextmenu', 'show'
];

function isMouseEvent(evt) {
    return mouseEvts.indexOf(evt) !== -1;
}

function createMouseEvent(evt, {
    screenX = 0,
    screenY = 0,
    clientX = 0,
    clientY = 0,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    button = 0,
    buttons = 0,
    relatedTarget = null,
    region = null
}) {
    return new MouseEvent(evt, arguments[1]);
}

const kbdEvts = ['keydown', 'keyup', 'keypress'];

function isKeyboardEvent(evt) {
    return kbdEvts.indexOf(evt) !== -1;
}

function createKeyboardEvent(evt, {
    key = '',
    code = '',
    location = 0,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    repeat = false,
    isComposing = false,
    charCode = 0,
    keyCode = 0,
    which = 0
}) {
    return new KeyboardEvent(evt, arguments[1]);
}

const touchEvts = [
    'touchenter', 'touchleave',
    'touchcancel', 'touchmove',
    'touchstart', 'touchend'
];

function isTouchEvent(evt) {
    return touchEvts.indexOf(evt) !== -1;
}

function createTouchEvent(evt, {
    touches = [],
    targetTouches = [],
    changedTouches = [],
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false
}) {
    return new TouchEvent(evt, arguments[1]);
}

const uiEvts = [
    'abort', 'error', 'load', 'resize',
    'scroll', 'select', 'unload'
];

function isUIEvent(evt) {
    return uiEvts.indexOf(evt.substring(3)) !== -1;
}

function createUIEvent(evt, {
    detail = 0,
    view = window
}) {
    return new UIEvent(evt, arguments[1]);
}

function createCustomEvent(evt, { detail = null }) {
    return new CustomEvent(evt, arguments[1]);
}
