import { uglify } from 'rollup-plugin-uglify';
import { dts } from 'rollup-plugin-dts';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
  // browser-friendly iife build
  {
    input: 'src/main.ts',
    output: {
      name: 'modeste',
      file: pkg.browser,
      format: 'iife'
    },
    plugins: [typescript(), uglify()]
  },

  {
    input: 'src/main.ts',
    plugins: [typescript()],
    output: { file: pkg.main, format: 'es' }
  },

  {
    input: 'src/main.ts',
    plugins: [dts()],
    output: { file: pkg.types, format: 'es' }
  }

  // {
  //   input: 'sandbox/test.ts',
  //   plugins: [typescript(), uglify()],
  //   output: {
  //     name: 'app',
  //     file: 'sandbox/test.js',
  //     format: 'iife'
  //   }
  // }
];
