import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number.parseInt(process.env.PORT || '3000', 10)

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
}

function sendFile(response, filePath) {
  const extension = extname(filePath).toLowerCase()
  response.writeHead(200, {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff'
  })
  createReadStream(filePath).pipe(response)
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)

  if (pathname === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end('ok')
    return
  }

  const requestedPath = normalize(pathname).replace(/^([/\\])+/, '')
  let filePath = join(root, requestedPath || 'index.html')

  if (relative(root, filePath).startsWith('..')) {
    response.writeHead(403).end('Forbidden')
    return
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html')

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    if (request.method === 'HEAD') {
      response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream' })
      response.end()
    } else sendFile(response, filePath)
    return
  }

  if (pathname.startsWith('/assets/') || extname(pathname)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end('Not found')
    return
  }

  sendFile(response, join(root, 'index.html'))
}).listen(port, '0.0.0.0', () => {
  process.stdout.write(`DAG Gutachten läuft auf Port ${port}\n`)
})
