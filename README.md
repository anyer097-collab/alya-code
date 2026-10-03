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
