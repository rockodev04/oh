import { watch } from 'fs'
import path from 'path'
const fs = require('fs')

const isProduction = Bun.argv.includes('--prod')
const outputDir = 'calvaria'
const port = 3000

const SYSTEM_ROUTES = new Set([
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/robots.txt',
  '/sitemap.xml',
  '/.well-known/appspecific/com.chrome.devtools.json',
])

const fileCache = new Map<string, { content: Uint8Array, type: string }>()

const getMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  const types: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }
  return types[ext] ?? 'application/octet-stream'
}

const scanStyles = (stylesDir: string): string[] => {
  if (!fs.existsSync(stylesDir)) return []
  return fs.readdirSync(stylesDir)
    .filter((f: string) => f.endsWith('.css'))
    .map((f: string) => `/styles/${f}`)
}

const injectAssets = (html: string, styles: string[], scripts: string[]): string => {
  const styleLinks = styles
    .map(s => `<link rel="stylesheet" href="${s}" />`)
    .join('\n')
  const scriptTags = scripts
    .map(s => `<script type="module" src="${s}"></script>`)
    .join('\n')
  return html.replace('</head>', `${styleLinks}\n${scriptTags}\n</head>`)
}

const cleanOutput = () => {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
  }
  fs.mkdirSync(outputDir, { recursive: true })
}

const copyFolder = (src: string, dest: string) => {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyFolder(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

const generateRegistry = () => {
  const componentDirs = fs.readdirSync('./arche/components') as string[]
  const knownRequiredAttrs: Record<string, string[]> = {
    'only-article': ['article-id'],
    'magic-card': ['image', 'title'],
  }
  const registry: Record<string, string[]> = {}
  componentDirs.forEach((name: string) => {
    registry[name] = knownRequiredAttrs[name] ?? []
  })
  const content = `export const magicRegistry: Record<string, string[]> = ${JSON.stringify(registry, null, 2)}\n`
  fs.writeFileSync('./arche/core/registry.ts', content)
  console.log(`📋 Registry generado con ${componentDirs.length} componentes`)
}

const loadDevCache = async () => {
  fileCache.clear()

  const buildResult = await Bun.build({
    entrypoints: [
      'arche/core/libris.core.ts',
      'arche/core/app.module.ts',
    ],
    outdir: './.magic-dev',
    target: 'browser',
    minify: false,
  })

  if (!buildResult.success) {
    console.error('❌ Build failed:')
    buildResult.logs.forEach(log => console.error(log))
    return false
  }

  const loadFolder = async (folderPath: string, urlBase: string) => {
    if (!fs.existsSync(folderPath)) return
    for (const item of fs.readdirSync(folderPath)) {
      const fullPath = path.join(folderPath, item)
      const urlPath = `${urlBase}/${item}`
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        await loadFolder(fullPath, urlPath)
      } else {
        const file = Bun.file(fullPath)
        const content = new Uint8Array(await file.arrayBuffer())
        fileCache.set(urlPath, { content, type: getMimeType(fullPath) })
      }
    }
  }

  await loadFolder('./.magic-dev', '/core')
  await loadFolder('./arche/styles', '/styles')
  await loadFolder('./arche/images', '/images')

  const styles = scanStyles('./arche/styles')
  const scripts = buildResult.outputs
    .filter(o => o.path.endsWith('.js'))
    .map(o => `/core/${path.basename(o.path)}`)

  const rawHtml = await Bun.file('./arche/index.html').text()
  const injectedHtml = injectAssets(rawHtml, styles, scripts)

  fileCache.set('/', {
    content: new TextEncoder().encode(injectedHtml),
    type: 'text/html'
  })

  console.log(`✨ MAGIC dev build complete. (${styles.length} styles, ${scripts.length} scripts injected)`)
  return true
}

const buildProduction = async () => {
  generateRegistry()

  const result = await Bun.build({
    entrypoints: [
      'arche/core/libris.core.ts',
      'arche/core/app.module.ts',
    ],
    outdir: `${outputDir}/core`,
    root: 'arche',
    target: 'browser',
    minify: true,
  })

  if (!result.success) {
    console.error('❌ Build failed:')
    result.logs.forEach(log => console.error(log))
    return
  }

  copyFolder('./arche/styles', `${outputDir}/styles`)
  copyFolder('./arche/images', `${outputDir}/images`)

  const styles = scanStyles('./arche/styles')
  const scripts = result.outputs
    .filter(o => o.path.endsWith('.js'))
    .map(o => `/core/${path.basename(o.path)}`)

  const rawHtml = await Bun.file('./arche/index.html').text()
  const injectedHtml = injectAssets(rawHtml, styles, scripts)

  fs.writeFileSync(`${outputDir}/index.html`, injectedHtml)
  console.log(`✨ MAGIC production build complete. (${styles.length} styles, ${scripts.length} scripts injected)`)
}

const buildMagic = async () => {
  generateRegistry()
  if (isProduction) {
    await buildProduction()
  } else {
    await loadDevCache()
  }
}

const startWatcher = () => {
  watch('./arche', { recursive: true }, async (_eventType, filename) => {
    if (!filename) return
    if (
      filename.endsWith('.ts') ||
      filename.endsWith('.html') ||
      filename.endsWith('.css')
    ) {
      console.log(`🔁 Change detected in: ${filename}`)
      try {
        generateRegistry()
        await loadDevCache()
      } catch (err) {
        console.error('❌ Build error (watcher continuing):', err)
      }
    }
  })
  console.log('👁 Watching arche/ for changes...')
}

const startServer = () => {
  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)

      if (SYSTEM_ROUTES.has(url.pathname) || url.pathname.startsWith('/.well-known')) {
        return new Response(null, { status: 204 })
      }

      if (isProduction) {
        if (url.pathname.includes('.')) {
          const filePath = `${outputDir}${url.pathname}`
          const file = Bun.file(filePath)
          if (await file.exists()) return new Response(file)
          return new Response('Not Found', { status: 404 })
        }
        return new Response(Bun.file(`${outputDir}/index.html`))
      }

      if (!url.pathname.includes('.')) {
        const cached = fileCache.get('/')
        if (cached) {
          return new Response(cached.content, {
            headers: { 'Content-Type': 'text/html' }
          })
        }
      }

      const cached = fileCache.get(url.pathname)
      if (cached) {
        return new Response(cached.content, {
          headers: { 'Content-Type': cached.type }
        })
      }

      return new Response('Not Found', { status: 404 })
    }
  })
  console.log(`🧙 MAGIC Nexus running at http://localhost:${port} (${isProduction ? 'PROD' : 'DEV'})`)
}

if (isProduction) cleanOutput()
await buildMagic()
if (!isProduction) startWatcher()
startServer()
