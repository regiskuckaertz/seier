import * as transducers from './transducers.js';
import * as dom from './dom.js';
import * as functions from './functions.js';
import * as async from './async.js';
import DomAlgorithm from './algorithm.js';

function seier(selector) {
    return dom.getAll(selector);
}

seier.do = () => DomAlgorithm();
seier.dom = dom;
seier.xform = transducers;
seier.fn = functions;
seier.async = async;

export default seier;
