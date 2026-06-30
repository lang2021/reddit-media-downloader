import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(repoRoot, 'dist')

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

const commonBuildOptions = {
  bundle: true,
  platform: 'browser' as const,
  target: ['chrome120'],
  sourcemap: false,
  logLevel: 'info' as const,
}

await build({
  ...commonBuildOptions,
  entryPoints: [join(repoRoot, 'src/content/reddit-content-script.ts')],
  outfile: join(distDir, 'reddit-content-script.js'),
  format: 'iife',
})

await build({
  ...commonBuildOptions,
  entryPoints: [join(repoRoot, 'src/background/service-worker.ts')],
  outfile: join(distDir, 'service-worker.js'),
  bundle: true,
  format: 'esm',
})

copyFileSync(join(repoRoot, 'src/manifest.json'), join(distDir, 'manifest.json'))

console.log(`built dry-run extension in ${distDir}`)
