/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  alya-code — agregador del pool de Alya Servers                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * UNA sola URL pública que reparte entre todos los Alya Servers.
 *
 *   Alya Code (CLI)  →  alya-code  →  alya-serverN  →  Workers AI
 *                       (este)        (7 cuentas)
 *
 * POR QUÉ EXISTE
 *   Antes el repo tenía que listar las 7 URLs y actualizarse cada vez que se
 *   sumaba una cuenta. Ahora el repo solo conoce ESTA, y el pool se gestiona
 *   aquí con una variable de entorno. Añadir una cuenta no toca el repo.
 *
 * CONFIGURACIÓN (en Cloudflare, no en el código)
 *   ALYA_SERVERS   lista separada por comas de los Alya Servers
 *                  Settings > Variables > Add variable
 *
 * QUÉ HACE
 *   · API compatible con OpenAI: /v1/models y /v1/chat/completions
 *   · solo anuncia modelos del plan GRATUITO
 *   · reparte la carga y hace failover cuando una cuenta agota neuronas
 *   · streaming SSE transparente (se reenvía tal cual, sin bufferizar)
 *   · no consume neuronas: solo enruta (Workers free da 100.000 req/día)
 */

const VERSION = "1.0"

// Respaldo si no se define ALYA_SERVERS en el entorno.
const SERVIDORES_POR_DEFECTO = [
  "https://alya-server7.anyer-alya5.workers.dev",
  "https://alya-server6.anyer-alya4.workers.dev",
  "https://alya-server5.anyer-alya3.workers.dev",
  "https://alya-server4.anyer-alya2.workers.dev",
  "https://alya-server3.anyer-alya.workers.dev",
  "https://alya-server2.anyerjrsenior.workers.dev",
  "https://alya-server1.anyer097.workers.dev",
]

// Solo modelos disponibles en el plan gratuito de Workers AI.
const MODELOS = [
  { id: "alya", nombre: "Alya (Llama 4 Scout · multimodal + tools)" },
  { id: "alya-fast", nombre: "Alya Fast (Llama 3.3 70B)" },
  { id: "alya-vision", nombre: "Alya Vision" },
]

// Salud en memoria del aislado. Es efímera a propósito: si Cloudflare recicla
// el worker, se reintenta todo, que es el comportamiento seguro.
const salud = new Map() // url -> { hasta, motivo }
const COOLDOWN_CUOTA = 60 * 60 * 1000 // 1 h
const COOLDOWN_FALLO = 2 * 60 * 1000

let turno = 0 // reparto rotatorio para no quemar siempre la misma cuenta

function servidores(env) {
  const crudo = (env && env.ALYA_SERVERS) || ""
  const lista = crudo
    .split(/[,\s]+/)
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter((s) => s.startsWith("http"))
  return lista.length ? lista : SERVIDORES_POR_DEFECTO
}

function disponibles(env) {
  const todos = servidores(env)
  const ahora = Date.now()
  const sanos = todos.filter((u) => !(salud.get(u)?.hasta > ahora))
  // Si todos están en espera se usan igual: mejor reintentar que no responder.
  const base = sanos.length ? sanos : todos
  // Rotación: reparte el gasto en vez de agotar siempre el primero.
  const inicio = turno++ % base.length
  return [...base.slice(inicio), ...base.slice(0, inicio)]
}

function esCuota(status, texto) {
  const t = (texto || "").toLowerCase()
  return status === 429 || t.includes("neuron") || t.includes("cuota diaria") || t.includes("4006")
}

function apartar(url, motivo, cuota) {
  salud.set(url, { hasta: Date.now() + (cuota ? COOLDOWN_CUOTA : COOLDOWN_FALLO), motivo })
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, User-Agent",
  "X-Powered-By": "alya-code-router-v" + VERSION,
}

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  })

const error = (code, message) => json({ error: { code, message, type: "alya_router" } }, code)

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

    const ruta = new URL(request.url).pathname.replace(/\/+$/, "")

    if (ruta === "" || ruta === "/") {
      const ahora = Date.now()
      return json({
        service: "alya-code",
        role: "agregador del pool de Alya Servers",
        version: VERSION,
        openai_base_url: new URL(request.url).origin + "/v1",
        servers: servidores(env).map((u) => {
          const s = salud.get(u)
          return {
            url: u,
            estado: s && s.hasta > ahora ? "en espera" : "disponible",
            minutos: s && s.hasta > ahora ? Math.ceil((s.hasta - ahora) / 60000) : 0,
            motivo: s && s.hasta > ahora ? s.motivo : undefined,
          }
        }),
        models: MODELOS.map((m) => m.id),
      })
    }

    if (ruta === "/v1/models" || ruta === "/models") {
      return json({
        object: "list",
        data: MODELOS.map((m) => ({
          id: m.id,
          object: "model",
          created: 1735689600,
          owned_by: "alya",
          description: m.nombre,
        })),
      })
    }

    if (ruta === "/v1/chat/completions" || ruta === "/chat/completions") {
      if (request.method !== "POST") return error(405, "Usa POST.")
      return await reenviar(request, env, "/v1/chat/completions")
    }

    // El resto de tipos del Alya Server (image, embed, rerank, stt…) se
    // reenvían tal cual a la raíz, para no perder funcionalidad.
    if (ruta === "/api" && request.method === "POST") {
      return await reenviar(request, env, "")
    }

    return error(404, `Ruta '${ruta}' no encontrada. Usa /v1/chat/completions o /v1/models.`)
  },
}

/**
 * Reenvía la petición al primer servidor que responda, apartando los que
 * fallan. El streaming se devuelve tal cual, sin acumularlo en memoria.
 */
async function reenviar(request, env, sufijo) {
  let cuerpo
  try {
    cuerpo = await request.text()
  } catch {
    return error(400, "Cuerpo ilegible.")
  }

  const quiereStream = (() => {
    try {
      return JSON.parse(cuerpo).stream === true
    } catch {
      return false
    }
  })()

  const lista = disponibles(env)
  const fallos = []

  for (const base of lista) {
    try {
      const res = await fetch(base + sufijo, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: quiereStream ? "text/event-stream" : "application/json" },
        body: cuerpo,
      })

      if (res.ok) {
        salud.delete(base)
        // Se reenvía el cuerpo sin tocarlo: así el SSE llega en tiempo real.
        const h = new Headers(res.headers)
        Object.entries(CORS).forEach(([k, v]) => h.set(k, v))
        h.set("X-Alya-Server", base)
        return new Response(res.body, { status: res.status, headers: h })
      }

      const txt = await res.text()
      const cuota = esCuota(res.status, txt)
      apartar(base, cuota ? "sin cuota" : `HTTP ${res.status}`, cuota)
      fallos.push(`${etiqueta(base)}: ${cuota ? "SIN CUOTA" : "HTTP " + res.status}`)
    } catch (e) {
      apartar(base, String(e && e.message).slice(0, 60), false)
      fallos.push(`${etiqueta(base)}: ${String(e && e.message).slice(0, 40)}`)
    }
  }

  return error(
    503,
    `Ningún Alya Server disponible (${lista.length} probados).\n` + fallos.map((f) => "  · " + f).join("\n"),
  )
}

function etiqueta(url) {
  return url.replace(/^https?:\/\//, "").split(".workers.dev")[0]
}
