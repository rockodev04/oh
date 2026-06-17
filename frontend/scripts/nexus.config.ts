import { watch } from 'fs';
import path from 'path';
const fs = require('fs');

const isProduction = Bun.argv.includes('--prod');
const outputDir = 'calvaria';
const port = 3000;

const SYSTEM_ROUTES = new Set([
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/robots.txt',
  '/sitemap.xml',
  '/.well-known/appspecific/com.chrome.devtools.json',
])

const cleanOutput = () => {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });
};

const copyFolder = (src: string, dest: string) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const copyStaticAssets = () => {
  fs.copyFileSync('./src/index.html', `${outputDir}/index.html`);
  copyFolder('./src/styles', `${outputDir}/styles`);
  copyFolder('./src/images', `${outputDir}/images`);
};

const generateRegistry = () => {
  const componentDirs = fs.readdirSync('./src/components') as string[];

  const knownRequiredAttrs: Record<string, string[]> = {
    'only-article': ['article-id'],
    'magic-card': ['image', 'title'],
  }

  const registry: Record<string, string[]> = {}
  componentDirs.forEach((name: string) => {
    registry[name] = knownRequiredAttrs[name] ?? []
  })

  const content = `// ============================================
// MAGIC REGISTRY — Auto-generado por Nexus
// No editar manualmente. Se regenera en cada build.
// ============================================
export const magicRegistry: Record<string, string[]> = ${JSON.stringify(registry, null, 2)}
`
  fs.writeFileSync('./src/core/registry.ts', content)
  console.log(`📋 Registry generado con ${componentDirs.length} componentes`)
}

const buildMagic = async () => {
  generateRegistry()

  const entrypoints = [
    'src/core/libris.core.ts',
    'src/core/app.module.ts',
  ]

  console.log('📦 Building entrypoints:', entrypoints)

  const result = await Bun.build({
    entrypoints,
    outdir: outputDir,
    root: 'src',
    target: 'browser',
    minify: isProduction
  })

  if (!result.success) {
    console.error('❌ Build failed:')
    result.logs.forEach(log => console.error(log))
    return
  }

  copyStaticAssets()
  console.log('✨ MAGIC build complete.')
}

const startWatcher = () => {
  watch('./src', { recursive: true }, async (_eventType, filename) => {
    if (!filename) {
      console.warn('🧐 fs.watch triggered but no filename was provided.')
      return
    }
    if (
      filename.endsWith('.ts') ||
      filename.endsWith('.html') ||
      filename.endsWith('.css')
    ) {
      console.log(`🔁 Change detected in: ${filename}`)
      await buildMagic()
    }
  })
  console.log('👁 fs.watch is running and listening for changes...')
}

const startServer = () => {
  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)

      if (SYSTEM_ROUTES.has(url.pathname) || url.pathname.startsWith('/.well-known')) {
        return new Response(null, { status: 204 })
      }

      if (url.pathname.includes('.')) {
        const filePath = `${outputDir}${url.pathname}`
        const file = Bun.file(filePath)
        if (await file.exists()) {
          return new Response(file)
        }
        return new Response('Not Found', { status: 404 })
      }

      return new Response(Bun.file(`${outputDir}/index.html`))
    }
  })
  console.log(`🧙 MAGIC Nexus running at http://localhost:${port} (${isProduction ? 'PROD' : 'DEV'})`)
}

cleanOutput()
await buildMagic()
if (!isProduction) startWatcher()
startServer()
