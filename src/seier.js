import * as transducers from './transducers.js';
import * as dom from './dom.js';
import DomAlgorithm from './algorithm.js';

function seier() {
    return DomAlgorithm();
}

seier.dom = dom;
seier.coll = transducers;

export default seier;
