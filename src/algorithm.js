import { map, isArray } from "./transducers.js";
import { compose, curry, identity } from "./functions.js";
import * as dom from "./dom.js";

export default DomAlgorithm;

const identityXform = map(identity);

function DomAlgorithm() {
    let transducer = identityXform;
    let prototype = {};

    Object.keys(dom).forEach(key => prototype[key] = (...args) => {
        transducer = compose(map(curry(dom[key], ...args)), transducer);
        return prototype;
    });

    prototype.run = item => item instanceof Node || item === document ?
        into([], transducer, [item])[0] :
        isArray(item) ?
        into([], transducer, item) :
        item;

    return Object.freeze(prototype);
}
