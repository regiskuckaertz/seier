import { compose, map } from "./transducers.js";
import { curry } from "./functions.js";
import * as dom from "./dom.js";

export default Algo;

const identity = map((x) => x);

function Algo() {
    this.transducer = identity;
}

Algo.prototype.run = () => item instanceof Node ?
    into([], this.transducer, [item])[0] :
    into([], this.transducer, item);

let keys = Object.keys(dom);
for( let key of keys ) {
    Algo.prototype[key] = (...args) => {
        this.transducer = compose(map(curry(dom[key], ...args)), this.transducer);
        return this;
    }
}
