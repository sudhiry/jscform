import babel from '@rollup/plugin-babel';
import preactSignalsTransformer from '@preact/signals-react-transform'
import pkg from './package.json';
import {createRollupConfig} from './createRollupConfig';

const name = 'index';

const plugins = [
    babel({
        babelHelpers: 'bundled',
        plugins: [preactSignalsTransformer({ mode: 'all'})], // Include the signals transform plugin
        exclude: 'node_modules/**', // Exclude node_modules from Babel processing
    }),
];

const options = [
    {
        name,
        format: 'cjs',
        input: pkg.source,
        plugins,
    },
    {name, format: 'esm', input: pkg.source},
    {
        name: 'react-server',
        format: 'esm',
        input: 'src/index.react-server.ts',
        plugins,
    },
    {
        name,
        format: 'umd',
        input: pkg.source,
        plugins,
    },
];

export default options.map((option) => createRollupConfig(option));
