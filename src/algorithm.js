import { compose, map, isArray } from "./transducers.js";
import { curry } from "./functions.js";
import * as dom from "./dom.js";

export default DomAlgorithm;

const identity = map((x) => x);

function DomAlgorithm() {
    let transducer = identity;
    let prototype = {};

    Object.keys(dom).forEach((key) => prototype[key] = (...args) => {
        transducer = compose(map(curry(dom[key], ...args)), transducer);
        return prototype;
    });

    prototype.run = (item) => item instanceof Node || item === document ?
        into([], transducer, [item])[0] :
        isArray(item) ?
        into([], transducer, item) :
        item;

    return Object.freeze(prototype);
}
