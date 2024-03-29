import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  plugins: [commonjs(), resolve()],
  output: {
    file: './dist/main.js',
    name: 'DataSheet',
    format: 'umd',
  },
};
