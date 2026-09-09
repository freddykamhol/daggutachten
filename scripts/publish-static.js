import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = join(root, 'dist')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('Build fehlt: dist/index.html wurde nicht erzeugt.')
  process.exit(1)
}

const assets = join(root, 'assets')
if (existsSync(assets)) {
  for (const file of readdirSync(assets)) {
    if (/^index-.*\.(css|js)$/.test(file)) rmSync(join(assets, file))
  }
}

for (const entry of readdirSync(dist)) {
  const source = join(dist, entry)
  const target = join(root, entry)
  if (statSync(source).isDirectory()) {
    mkdirSync(target, { recursive: true })
    cpSync(source, target, { recursive: true, force: true })
  } else copyFileSync(source, target)
}
