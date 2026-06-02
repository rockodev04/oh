import { watch } from 'fs';
import path from 'path';

const fs = require('fs');
const isProduction = Bun.argv.includes('--prod');
const outputDir = 'calvaria';
const port = 3000;

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

// ── Auto-genera el registro de componentes ──
const generateRegistry = () => {
  const componentDirs = fs.readdirSync('./src/components') as string[];

  // Atributos requeridos conocidos por componente
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
  // Genera el registry antes de compilar
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

      if (url.pathname === '/favicon.ico' || url.pathname.startsWith('/.well-known')) {
        return new Response(null, { status: 204 })
      }

      let pathName = `${outputDir}${url.pathname}`

      if (url.pathname.includes('.')) {
        try {
          return new Response(Bun.file(pathName))
        } catch {
          return new Response('404 Not Found', { status: 404 })
        }
      }

      return new Response(Bun.file(`${outputDir}/index.html`))
    }
  })

  console.log(`🧙 MAGIC Nexus running at http://localhost:${port} (${isProduction ? 'PROD' : 'DEV'})`)
}

// 🚀 Run everything
cleanOutput()
await buildMagic()
if (!isProduction) startWatcher()
startServer()