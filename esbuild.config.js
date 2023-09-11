import esbuild from 'esbuild'
import babel from 'esbuild-plugin-babel'

const context = await esbuild.context({
  entryPoints: ['src/index.ts', 'src/tests.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  plugins: [babel()],
  target: 'esnext'
})

await context.watch()
