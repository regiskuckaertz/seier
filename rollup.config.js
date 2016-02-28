import babel from 'rollup-plugin-babel';

export default {
    format: 'iife',
    moduleName: 'seier',
    entry: 'src/seier.js',
    dest: 'build/seier.js',
    plugins: [ babel() ]
};
