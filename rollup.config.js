import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

const input = 'src/index.ts'

const plugins = {
    base: [
        resolve(),
        typescript({ tsconfig: './tsconfig.json' })
    ],
    minified: [
        resolve(),
        typescript({ tsconfig: './tsconfig.json' }),
        terser()
    ]
}

export default [
    // ES Module build
    {
        input,
        output: {
            file: 'dist/xeval.esm.js',
            format: 'es',
            sourcemap: true
        },
        plugins: plugins.base
    },
    // CommonJS build
    {
        input,
        output: {
            file: 'dist/xeval.cjs.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'named'
        },
        plugins: plugins.base
    },
    // Minified build for CDN
    {
        input,
        output: {
            file: 'dist/xeval.min.js',
            format: 'es',
            sourcemap: false
        },
        plugins: plugins.minified
    }
]