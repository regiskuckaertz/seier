import { compose, map } from "./transducers.js";
import { curry } from "./functions.js";
import * as dom from "./dom.js";

export default DomAlgorithm;

const identity = map((x) => x);

let prototype;

function DomAlgorithm() {
    let transducer = identity;

    if( !prototype ) {
        prototype = {};

        Object.keys(dom).forEach((key) => prototype[key] = (...args) => {
            transducer = compose(map(curry(dom[key], ...args)), transducer);
            return prototype;
        });

        prototype.run = (item) => item instanceof Node ?
            into([], transducer, [item])[0] :
            into([], transducer, item);

        Object.freeze(prototype);
    }

    return prototype;
}
