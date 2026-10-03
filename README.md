<div align="center">

```
                                      ▄
█▀▀█ █__█ █  █ █▀▀█ █▀▀▀ █▀▀█ █▀▀█ █▀▀▀
█▄▄█ █__█ ▀▄▄▀ █▄▄█ █    █  █ █  █ █▀▀
▀  ▀ ▀▀▀▀  ▀▀  ▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀
```

**Agente de programación para la terminal**

</div>

---

Alya Code es un agente de programación que vive en tu terminal: lee y escribe
ficheros, ejecuta comandos, navega por el código y trabaja con el modelo que
tú elijas.

Es un fork de [opencode](https://github.com/anomalyco/opencode) (MIT),
rebrandeado y en proceso de migración a infraestructura propia.

## Instalación

```bash
git clone https://github.com/anyer097-collab/alya-code
cd alya-code
bun install
bun dev
```

Requiere [Bun](https://bun.sh). Para que los temas se vean bien, la terminal
debe soportar **truecolor** (24 bits): comprueba con `echo $COLORTERM`.

## Tema Alya

Incluye el tema `alya`, una paleta sakura con rosa `#ff8fc7` de primario y
violeta `#c9a0ff` de acento, con variantes clara y oscura.

```
/theme alya
```

Hay 37 temas más heredados de upstream (tokyonight, catppuccin, gruvbox,
nord, kanagawa…).

## Configuración

| | |
|---|---|
| Fichero | `alya-code.json` |
| Config de usuario | `~/.config/alya-code/` |
| Variables | `ALYA_CODE_*` |
| Paquetes | `@alya-code/*` |

## Estado del rebrand

**Fase 1 — completada.** 40.073 sustituciones en 2.714 ficheros, 56 ficheros
y carpetas renombrados. Verificado con `bun install` y `bun run typecheck`
en GitHub Codespaces: **cero errores de sintaxis**. Los 3 errores de tipos que
quedan (`TS7006` en `stats-app`) vienen de upstream y están en ficheros que el
rebrand no tocó.

**Fase 2 — pendiente.** Quedan ~5.100 referencias a `opencode.ai`, que **no
son texto sino servicios reales**:

| Servicio | Para qué | Reemplazo previsto |
|---|---|---|
| `opencode.ai/config.json` | catálogo remoto de modelos | Worker propio |
| `opencode.ai/zen/v1/*` | pasarela LLM | Alya Servers |
| `api.opencode.ai` | autenticación | propio o eliminar |

Renombrarlas sin sustituir el servicio dejaría la app apuntando a un dominio
inexistente, así que se tratan aparte.

## Cosas que aprendimos rebrandeando

Tres bugs que un `sed` ciego habría dejado pasar y que solo aparecieron al
compilar:

1. **Paquetes npm de terceros.** `opencode-gitlab-auth`, `opencode-poe-auth` y
   `@gitlab/opencode-gitlab-auth` están publicados en npm con ese nombre. Al
   renombrarlos, `bun install` fallaba con 404.
2. **Espacios en identificadores.** `OpenCode` → `Alya Code` generaba
   `import { Alya Code }`, sintaxis inválida. Se corrige a `AlyaCode` solo en
   zonas de código, enmascarando antes cadenas y comentarios para no estropear
   el texto visible.
3. **Guiones en identificadores.** `const opencode = …` → `const alya-code = …`
   tampoco es válido. 306 casos en 76 ficheros.

El script está en `rebrand.py` (en el workspace del proyecto), es idempotente
y protege URLs y paquetes externos.

## Licencia

MIT, heredada de opencode. Ver [LICENSE](./LICENSE).

## Arquitectura

```
Alya Code (CLI)  →  alya-code  →  alya-serverN  →  Workers AI
                    agregador     7 cuentas
```

**`alya-code`** es un worker agregador: una sola URL pública que reparte entre
todos los Alya Servers y hace failover cuando una cuenta agota sus neuronas.

El pool vive en la variable `ALYA_SERVERS` de ese worker, **no en este repo**.
Sumar una cuenta es editar esa variable: ni se toca el repositorio ni hay que
publicar una versión nueva del cliente.

Cada **`alya-serverN`** ya hace de router por cuenta: elige modelo, cascada de
respaldo y solo expone modelos del plan gratuito.

```json
{
  "provider": {
    "alya": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Alya Server",
      "options": { "baseURL": "https://alya-code.anyer097.workers.dev/v1" }
    }
  },
  "model": "alya/alya"
}
```

### Catálogo que se actualiza solo

El endpoint está en [`alya-servers.json`](./alya-servers.json). Alya Code lo
descarga **una vez al día** y lo fusiona con los tuyos:

```
local    los que añadiste tú      ← siempre primero, nunca se pisan
remote   el catálogo del repo     ← refresco cada 24 h
builtin  respaldo empotrado       ← solo si no hay red ni caché
```

Para sumar una cuenta al pool **no hace falta tocar nada de esto**: se añade a
`ALYA_SERVERS` en el worker `alya-code` y entra al instante. El JSON solo se
edita si quieres cambiar el endpoint principal o añadir uno alternativo.

### Comandos

```bash
alya-code servers              # listar y ver de dónde sale cada uno
alya-code servers add <url>    # añadir uno solo en tu máquina
alya-code servers rm <url>     # quitarlo
alya-code servers refresh      # forzar la descarga del catálogo
alya-code servers check        # latencia y estado de cada uno
```

`add` rechaza una URL que no exponga `GET /v1/models`, así no se cuela un
servidor que no habla el protocolo.

### Salud y reparto

Cada cuenta de Cloudflare aporta 10.000 neuronas al día, así que siete suman
**70.000**. El agregador reparte en rotación para no agotar siempre la misma, y
cuando una se queda sin cuota la aparta **1 hora** (2 minutos si fue un fallo
puntual) y sigue con la siguiente. Si todas estuvieran en espera, reintenta
igual: mejor eso que no responder.

El agregador **no consume neuronas**, solo enruta. El plan gratuito de Workers
da 100.000 peticiones al día, de sobra.

La respuesta incluye la cabecera `X-Alya-Server` indicando qué cuenta atendió,
útil para depurar.
