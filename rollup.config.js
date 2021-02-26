import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';

const babelrc = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: '>0.3%, not dead',
        loose: true,
        bugfixes: true,
      }
    ]
  ],
  plugins: ["@babel/plugin-proposal-class-properties"]
};

export default [
  {
    input: 'src/RosLib.js',
    plugins: [
      nodePolyfills(),
      nodeResolve({ preferBuiltins: false, browser: true }),
      commonjs({
        include: ["node_modules/**"],
      }),
      json(),
      webWorkerLoader(),
      babel( {
        babelHelpers: 'bundled',
        compact: false,
        babelrc: false,
        ...babelrc
      } ),
    ],
    output: [
      {
        format: 'umd',
        name: 'ROSLIB',
        file: 'build/roslib.js',
        indent: '\t'
      }
    ]
  },
  {
    input: 'src/RosLib.js',
    plugins: [
      nodePolyfills(),
      nodeResolve({ preferBuiltins: false, browser: true }),
      commonjs({
        include: ["node_modules/**"],
      }),
      json(),
      webWorkerLoader(),
      babel( {
        babelHelpers: 'bundled',
        babelrc: false,
        ...babelrc
      } ),
      terser(),
    ],
    output: [
      {
        format: 'umd',
        name: 'ROSLIB',
        file: 'build/roslib.min.js'
      }
    ]
  },
  {
    input: 'src/RosLib.js',
    plugins: [
      nodePolyfills(),
      nodeResolve({ preferBuiltins: false, browser: true }),
      commonjs({
        include: ["node_modules/**"],
      }),
      json(),
      webWorkerLoader(),
    ],
    output: [
      {
        format: 'esm',
        file: 'build/roslib.module.js'
      }
    ]
  }
];
