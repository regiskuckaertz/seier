import { compose, map } from "./transducers.js";
import { curry } from "./functions.js";
import * as dom from "./dom.js";

export default Algo;

const identity = map((x) => x);

function Algo() {
    let transducer = identity;
    let proto = {};

    function run(item) {
        return item instanceof Node ?
            into([], transducer, [item])[0] :
            into([], transducer, item);
    }

    Object.keys(dom).forEach((key) => proto[key] = (...args) => {
        transducer = compose(map(curry(dom[key], ...args)), transducer);
        return this;
    });

    proto.run = run;

    return Object.freeze(proto);
}
