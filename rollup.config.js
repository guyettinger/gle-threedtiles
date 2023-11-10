import dts from 'rollup-plugin-dts';

export default [
    {
        input: './src/entry.js',
        output: [{file: 'dist/threedtiles.d.ts', format: 'esm'}],
        plugins: [
            dts.default(),
        ],
    },
];