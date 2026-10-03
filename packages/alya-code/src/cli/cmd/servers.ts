/**
 * `alya-code servers` — gestión del pool de Alya Servers.
 *
 *   servers            lista los servidores y de dónde salen
 *   servers add <url>  añade uno solo en tu máquina
 *   servers rm <url>   quita uno de los tuyos
 *   servers refresh    fuerza la descarga del catálogo (salta la caché diaria)
 *   servers check      comprueba cuáles responden y con qué latencia
 */
import path from "path"
import os from "os"
import {
  resolverServidores, comprobar, estadoSalud, REMOTE_URL,
} from "../../provider/alya-servers"

const DIR = path.join(os.homedir(), ".config", "alya-code")
const LOCAL = path.join(DIR, "servers-local.json")

async function leerLocales(): Promise<string[]> {
  try {
    const f = Bun.file(LOCAL)
    if (!(await f.exists())) return []
    const d = await f.json()
    return Array.isArray(d) ? d : (d.servers ?? [])
  } catch {
    return []
  }
}

async function guardarLocales(urls: string[]) {
  await Bun.write(LOCAL, JSON.stringify([...new Set(urls)], null, 2))
}

export async function servers(args: string[]) {
  const [sub, valor] = args
  const locales = await leerLocales()

  if (sub === "add") {
    if (!valor) return console.error("uso: alya-code servers add <url>")
    const url = valor.trim().replace(/\/+$/, "")
    const r = await comprobar(url)
    if (!r.ok) {
      console.error(`✗ no responde como Alya Server: ${(r as any).error ?? "sin modelos"}`)
      console.error("  debe exponer GET /v1/models")
      return
    }
    await guardarLocales([...locales, url])
    console.log(`✓ añadido (${r.ms} ms) · modelos: ${(r as any).modelos?.join(", ")}`)
    return
  }

  if (sub === "rm" || sub === "remove") {
    if (!valor) return console.error("uso: alya-code servers rm <url>")
    const u = valor.trim().replace(/\/+$/, "")
    await guardarLocales(locales.filter((x) => x !== u))
    console.log(locales.includes(u) ? `✓ quitado ${u}` : `no estaba en tus locales`)
    return
  }

  const force = sub === "refresh"
  const lista = await resolverServidores({ cacheDir: DIR, locales, force })
  if (force) console.log(`catálogo actualizado desde ${REMOTE_URL}\n`)

  if (sub === "check") {
    console.log("comprobando…\n")
    const res = await Promise.all(lista.map(async (s) => ({ s, r: await comprobar(s.url) })))
    let vivos = 0
    for (const { s, r } of res) {
      vivos += r.ok ? 1 : 0
      console.log(`  ${r.ok ? "🟢" : "🔴"} ${s.url.padEnd(48)} ${r.ok ? `${r.ms} ms` : (r as any).error}`)
    }
    console.log(`\n  ${vivos}/${lista.length} operativos`)
    return
  }

  const enEspera = new Map(estadoSalud().map((e) => [e.url, e]))
  console.log(`${lista.length} servidores en el pool\n`)
  for (const s of lista) {
    const e = enEspera.get(s.url)
    const marca = e?.enEspera ? `⏳ ${e.minutos} min (${e.motivo})` : ""
    console.log(`  ${(s.source ?? "").padEnd(8)} ${s.url.padEnd(48)} ${marca}`)
  }
  console.log(`\n  local   = añadidos por ti (${LOCAL})`)
  console.log(`  remote  = del catálogo del repo, se refresca cada 24 h`)
  console.log(`  builtin = respaldo si no hay red`)
}
