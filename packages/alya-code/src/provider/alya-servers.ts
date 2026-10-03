/**
 * Pool de Alya Servers.
 *
 * Los servidores viven en `alya-servers.json`, en la raíz del repositorio.
 * Alya Code lo descarga UNA VEZ AL DÍA y lo fusiona con los que tengas en
 * local, así que sumar un servidor al pool es tan simple como añadirlo al
 * fichero del repo: todos los clientes lo recogen al día siguiente.
 *
 * Diseño:
 *   · caché en disco con marca de tiempo → una petición de red al día
 *   · si la red falla, se usa la caché; si no hay caché, la lista empotrada
 *   · los servidores locales del usuario SIEMPRE ganan y nunca se pisan
 *   · salud por servidor: el que falla se aparta un rato en vez de reintentarse
 */

export const REMOTE_URL =
  "https://raw.githubusercontent.com/anyer097-collab/alya-code/main/alya-servers.json"

/**
 * Respaldo si no hay red ni caché.
 *
 * Es UNA sola URL a propósito: `alya-code` es un agregador que ya reparte
 * entre todas las cuentas y hace failover por dentro. Añadir una cuenta al
 * pool se hace en la variable ALYA_SERVERS de ese worker, sin tocar el repo
 * ni publicar una versión nueva del cliente.
 */
export const BUILTIN_SERVERS = ["https://alya-code.anyer097.workers.dev"]

export interface AlyaServer {
  id: string
  url: string
  region?: string
  enabled?: boolean
  source?: "remote" | "local" | "builtin"
}

interface Catalogo {
  version?: number
  updated?: string
  refresh_hours?: number
  servers?: AlyaServer[]
}

interface Cache {
  fetchedAt: number
  catalog: Catalogo
}

const DIA_MS = 24 * 60 * 60 * 1000
const COOLDOWN_CUOTA_MS = 60 * 60 * 1000 // 1 h: la cuota se renueva cada ~24 h
const COOLDOWN_FALLO_MS = 2 * 60 * 1000

const salud = new Map<string, { hasta: number; motivo: string }>()

function normalizar(u: string) {
  return u.trim().replace(/\/+$/, "")
}

/** ¿El error indica cuota agotada de Workers AI? */
export function esErrorDeCuota(status: number, mensaje: string) {
  const m = (mensaje || "").toLowerCase()
  return status === 429 || m.includes("neuron") || m.includes("cuota diaria") || m.includes("4006")
}

export function marcarCaido(url: string, motivo: string, sinCuota = false) {
  salud.set(normalizar(url), {
    hasta: Date.now() + (sinCuota ? COOLDOWN_CUOTA_MS : COOLDOWN_FALLO_MS),
    motivo,
  })
}

export function marcarSano(url: string) {
  salud.delete(normalizar(url))
}

/** Servidores ordenados: primero los sanos, al final los que están en espera. */
export function ordenarPorSalud(urls: string[]) {
  const ahora = Date.now()
  const sanos: string[] = []
  const esperando: string[] = []
  for (const u of urls) {
    const s = salud.get(normalizar(u))
    if (s && s.hasta > ahora) esperando.push(u)
    else sanos.push(u)
  }
  // Si TODOS están en espera, se reintenta igual: mejor eso que no responder.
  return [...sanos, ...esperando]
}

export function estadoSalud() {
  const ahora = Date.now()
  return [...salud.entries()].map(([url, s]) => ({
    url,
    enEspera: s.hasta > ahora,
    minutos: Math.max(0, Math.ceil((s.hasta - ahora) / 60000)),
    motivo: s.motivo,
  }))
}

async function leerCache(ruta: string): Promise<Cache | null> {
  try {
    const f = Bun.file(ruta)
    if (!(await f.exists())) return null
    return (await f.json()) as Cache
  } catch {
    return null
  }
}

async function escribirCache(ruta: string, c: Cache) {
  try {
    await Bun.write(ruta, JSON.stringify(c, null, 2))
  } catch {
    /* la caché es un lujo, no una necesidad */
  }
}

/**
 * Descarga el catálogo remoto como mucho una vez al día.
 * `force` salta la caché (lo usa `alya-code servers refresh`).
 */
export async function obtenerCatalogo(cacheDir: string, force = false): Promise<Catalogo> {
  const ruta = `${cacheDir}/servers-cache.json`
  const cache = await leerCache(ruta)
  const refrescoMs = (cache?.catalog?.refresh_hours ?? 24) * 60 * 60 * 1000
  const fresco = cache && Date.now() - cache.fetchedAt < (refrescoMs || DIA_MS)

  if (fresco && !force) return cache!.catalog

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(REMOTE_URL, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const catalog = (await res.json()) as Catalogo
    if (Array.isArray(catalog.servers)) {
      await escribirCache(ruta, { fetchedAt: Date.now(), catalog })
      return catalog
    }
    throw new Error("catálogo sin 'servers'")
  } catch {
    // Sin red: la caché vieja vale más que nada, y si tampoco hay, el respaldo.
    if (cache?.catalog) return cache.catalog
    return { servers: BUILTIN_SERVERS.map((url, i) => ({ id: `builtin-${i + 1}`, url })) }
  }
}

/**
 * Lista final de URLs a usar.
 *
 * Orden de prioridad:
 *   1. los que el usuario añadió en local (nunca se pisan ni se reordenan)
 *   2. los del catálogo remoto que estén `enabled`
 *   3. el respaldo empotrado, solo si lo anterior quedó vacío
 */
export async function resolverServidores(opts: {
  cacheDir: string
  locales?: string[]
  force?: boolean
}): Promise<AlyaServer[]> {
  const vistos = new Set<string>()
  const salida: AlyaServer[] = []

  const añadir = (url: string, source: AlyaServer["source"], id?: string) => {
    const u = normalizar(url)
    if (!u || vistos.has(u)) return
    vistos.add(u)
    salida.push({ id: id ?? u, url: u, source })
  }

  for (const u of opts.locales ?? []) añadir(u, "local")

  const cat = await obtenerCatalogo(opts.cacheDir, opts.force)
  for (const s of cat.servers ?? []) {
    if (s?.url && s.enabled !== false) añadir(s.url, "remote", s.id)
  }

  if (salida.length === 0) for (const u of BUILTIN_SERVERS) añadir(u, "builtin")

  return salida
}

/** Comprueba que un servidor responde y habla la API OpenAI. */
export async function comprobar(url: string, timeoutMs = 15000) {
  const u = normalizar(url)
  const t0 = Date.now()
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(`${u}/v1/models`, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) return { ok: false, ms: Date.now() - t0, error: `HTTP ${res.status}` }
    const j: any = await res.json()
    const modelos = (j?.data ?? []).map((m: any) => m.id)
    return { ok: modelos.length > 0, ms: Date.now() - t0, modelos }
  } catch (e: any) {
    return { ok: false, ms: Date.now() - t0, error: e?.message ?? String(e) }
  }
}
