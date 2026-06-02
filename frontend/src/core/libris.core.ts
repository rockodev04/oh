// ============================================
// LIBRIS — Magic Core Validation & Security
// Sistema central de validación, seguridad y
// errores legibles para humanos.
// ============================================

import { magicRegistry } from './registry'

// ── Mensajes de error legibles para humanos ──
const errorMessages: Record<string, string> = {
  'article-id': 'This component needs to know which article to display. Add the attribute article-id="123".',
  'image': 'The card needs an image. Add the attribute image="your-image-url".',
  'title': 'The card needs a title. Add the attribute title="My Title".',
}

const getHumanError = (attr: string, tagName: string): { message: string, hint: string } => {
  return {
    message: `Component <${tagName}> cannot work without the "${attr}" attribute`,
    hint: errorMessages[attr] ?? `Add the attribute ${attr}="..." to your <${tagName}> component.`
  }
}

// ── Sanitización de texto para prevenir XSS ──
export const sanitizeText = (text: string): string => {
  const risky = /<(script|img|iframe|object|embed|svg|on\w+)[^>]*?>/gi
  if (risky.test(text)) {
    console.warn('[LIBRIS] ⚠️ Dangerous content detected and sanitized')
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  return text
}

// ── Hash de datos con SHA-256 ──
export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data))
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("")
}

// ── Renderizar error legible para humanos ──
const renderMagicError = (el: Element, attr: string, tagName: string) => {
  if (el.previousElementSibling?.tagName.toLowerCase() === 'magic-error') return

  const { message, hint } = getHumanError(attr, tagName)
  const descriptor = Array.from(el.attributes)
    .map(a => `${a.name}="${a.value}"`)
    .join(' ')

  const error = document.createElement('magic-error') as any
  error._message = message
  error._hint = hint
  error._descriptor = descriptor
  el.classList.add('magic-error-target')
  el.insertAdjacentElement('beforebegin', error)
}

// ── Limpiar error ──
const clearMagicError = (el: Element) => {
  if (el.previousElementSibling?.tagName.toLowerCase() === 'magic-error') {
    el.previousElementSibling.remove()
  }
  el.classList.remove('magic-error-target')
}

// ── Validar componente ──
const validateMagicComponent = (el: Element, requiredAttrs: string[], tagName: string) => {
  const missing = requiredAttrs.find(attr => !el.getAttribute(attr))
  if (missing) {
    renderMagicError(el, missing, tagName)
  } else {
    clearMagicError(el)
  }
}

// ── Observar cambios en componentes ──
const observeMagicComponents = (tagName: string, requiredAttrs: string[]) => {
  if (requiredAttrs.length === 0) return

  customElements.whenDefined(tagName).then(() => {
    const elements = document.querySelectorAll(tagName)
    elements.forEach(el => {
      const validate = () => validateMagicComponent(el, requiredAttrs, tagName)
      const observer = new MutationObserver(() => setTimeout(validate, 0))
      observer.observe(el, { attributes: true })
      setTimeout(validate, 0)
    })
  })
}

// ── Inicializar validaciones desde el registry auto-generado ──
Object.entries(magicRegistry).forEach(([tag, attrs]) => {
  observeMagicComponents(tag, attrs)
})

// ── Componente de error visual ──
customElements.define('magic-error', class extends HTMLElement {
  _message = ''
  _hint = ''
  _descriptor = ''

  connectedCallback() {
    this.setAttribute('role', 'alert')
    this.setAttribute('aria-live', 'assertive')

    this.style.cssText = `
      display: block;
      background: rgba(167, 139, 250, 0.08);
      color: #E6E6FA;
      border: 1px solid rgba(167, 139, 250, 0.3);
      border-left: 4px solid #a78bfa;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    `

    this.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <span style="font-size:1.2rem; flex-shrink:0;">🧙</span>
        <div>
          <strong style="color:#a78bfa; display:block; margin-bottom:4px;">
            Magic detected a problem
          </strong>
          <span style="color:#E6E6FA;">${this._message}</span>
          <br/>
          <small style="color:#9ca3af; margin-top:4px; display:block;">
            💡 ${this._hint}
          </small>
          ${this._descriptor ? `
            <code style="display:block; margin-top:8px; padding:6px 10px; background:rgba(0,0,0,0.3); border-radius:4px; font-size:0.8rem; color:#34d399;">
              ${this._descriptor}
            </code>
          ` : ''}
        </div>
      </div>
    `
  }
})

console.log(`🧙 LIBRIS initialized — ${Object.keys(magicRegistry).length} components registred`)