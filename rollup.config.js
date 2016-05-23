import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
    format: 'iife',
    moduleName: 'seier',
    entry: 'src/seier.js',
    dest: 'build/seier.js',
    plugins: [ uglify(), babel() ]
};
