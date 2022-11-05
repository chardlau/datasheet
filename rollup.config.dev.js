import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';

export default {
  input: 'src/index.js',
  plugins: [commonjs(), resolve(), serve({ contentBase: ['example', 'dist'] })],
  output: {
    file: './dist/main.js',
    name: 'DataSheet',
    format: 'umd',
  },
};
