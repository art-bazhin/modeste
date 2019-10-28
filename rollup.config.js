import { uglify } from 'rollup-plugin-uglify';
import ts from 'rollup-plugin-ts';
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
    plugins: [
      ts({
        tsconfig: {
          target: 'ES5',
          module: 'es2015',
          strict: true
        }
      }),
      uglify()
    ]
  },

  {
    input: 'src/main.ts',
    plugins: [
      ts({
        tsconfig: {
          target: 'ES2015',
          module: 'es2015',
          declaration: true,
          strict: true
        }
      })
    ],
    output: { file: pkg.main, format: 'es' }
  }
];
