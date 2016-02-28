import {
    compose,
    map
} from "./transducers.js";

import * as dom from "./dom.js";

const identity = map((x) => x);

function Algo() {
    this.transducer = identity;
}

for( let key in dom ) {
    Algo.prototype[key] = function(fn) {
        this.transducer = compose(map(fn), this.transducer);
        return this;
    }
}
