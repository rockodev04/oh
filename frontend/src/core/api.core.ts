// ============================================
// api.core.ts — Magic API Client
// Fetch wrapper global con manejo automático
// de errores HTTP sin repetir código.
// ============================================

const IS_PRODUCTION = window.location.hostname !== 'localhost'

// ✅ URL base centralizada — sin hardcodear en cada componente
export const API_URL = IS_PRODUCTION
  ? 'https://tu-dominio-de-produccion.com'  // ← cambiar al hacer deploy
  : 'http://localhost:3001'

// ── Tipos ──
type ApiOptions = RequestInit & {
  auth?: boolean  // true = agrega el token automáticamente
}

type ApiError = {
  status: number
  message: string
}

// ── Manejo automático de errores HTTP ──
const handleApiError = (status: number): void => {
  // Importación dinámica para evitar dependencia circular con router
  import('./router.core').then(({ navigateToError }) => {
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('role')
      localStorage.removeItem('membership')
      navigateToError('401')
    } else if (status === 403) {
      navigateToError('403')
    } else if (status === 404) {
      navigateToError('404')
    } else if (status >= 500) {
      navigateToError('500')
    }
  })
}

// ── Fetch wrapper global ──
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<{ data: T | null, error: ApiError | null, ok: boolean }> {
  const { auth = true, ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers ?? {})

  if (auth) {
    const token = localStorage.getItem('token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers
    })

    // ✅ Errores manejados automáticamente
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Error desconocido' }))
      const message = body?.error ?? `Error ${res.status}`

      // Solo navega a página de error en errores críticos
      // 409 (conflict) y 422 (validation) los maneja cada componente
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status >= 500) {
        handleApiError(res.status)
      }

      return { data: null, error: { status: res.status, message }, ok: false }
    }

    const data: T = await res.json()
    return { data, error: null, ok: true }

  } catch {
    // Error de red — servidor caído
    return {
      data: null,
      error: { status: 0, message: 'No se pudo conectar con el servidor' },
      ok: false
    }
  }
}
