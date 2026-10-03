import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["ALYA_CODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["ALYA_CODE_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("ALYA_CODE_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  ALYA_CODE_AUTO_HEAP_SNAPSHOT: truthy("ALYA_CODE_AUTO_HEAP_SNAPSHOT"),
  ALYA_CODE_GIT_BASH_PATH: process.env["ALYA_CODE_GIT_BASH_PATH"],
  ALYA_CODE_CONFIG: process.env["ALYA_CODE_CONFIG"],
  ALYA_CODE_CONFIG_CONTENT: process.env["ALYA_CODE_CONFIG_CONTENT"],
  ALYA_CODE_DISABLE_AUTOUPDATE: truthy("ALYA_CODE_DISABLE_AUTOUPDATE"),
  ALYA_CODE_ALWAYS_NOTIFY_UPDATE: truthy("ALYA_CODE_ALWAYS_NOTIFY_UPDATE"),
  ALYA_CODE_DISABLE_PRUNE: truthy("ALYA_CODE_DISABLE_PRUNE"),
  ALYA_CODE_DISABLE_TERMINAL_TITLE: truthy("ALYA_CODE_DISABLE_TERMINAL_TITLE"),
  ALYA_CODE_SHOW_TTFD: truthy("ALYA_CODE_SHOW_TTFD"),
  ALYA_CODE_DISABLE_AUTOCOMPACT: truthy("ALYA_CODE_DISABLE_AUTOCOMPACT"),
  ALYA_CODE_DISABLE_MODELS_FETCH: truthy("ALYA_CODE_DISABLE_MODELS_FETCH"),
  ALYA_CODE_DISABLE_MOUSE: truthy("ALYA_CODE_DISABLE_MOUSE"),
  ALYA_CODE_FAKE_VCS: process.env["ALYA_CODE_FAKE_VCS"],
  ALYA_CODE_SERVER_PASSWORD: process.env["ALYA_CODE_SERVER_PASSWORD"],
  ALYA_CODE_SERVER_USERNAME: process.env["ALYA_CODE_SERVER_USERNAME"],
  ALYA_CODE_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("ALYA_CODE_DISABLE_FFF"),

  // Experimental
  ALYA_CODE_EXPERIMENTAL_FILEWATCHER: Config.boolean("ALYA_CODE_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ALYA_CODE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("ALYA_CODE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ALYA_CODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("ALYA_CODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  ALYA_CODE_MODELS_URL: process.env["ALYA_CODE_MODELS_URL"],
  ALYA_CODE_MODELS_PATH: process.env["ALYA_CODE_MODELS_PATH"],
  ALYA_CODE_DB: process.env["ALYA_CODE_DB"],

  ALYA_CODE_WORKSPACE_ID: process.env["ALYA_CODE_WORKSPACE_ID"],
  ALYA_CODE_EXPERIMENTAL_WORKSPACES: enabledByExperimental("ALYA_CODE_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get ALYA_CODE_DISABLE_PROJECT_CONFIG() {
    return truthy("ALYA_CODE_DISABLE_PROJECT_CONFIG")
  },
  get ALYA_CODE_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("ALYA_CODE_EXPERIMENTAL_REFERENCES")
  },
  get ALYA_CODE_TUI_CONFIG() {
    return process.env["ALYA_CODE_TUI_CONFIG"]
  },
  get ALYA_CODE_CONFIG_DIR() {
    return process.env["ALYA_CODE_CONFIG_DIR"]
  },
  get ALYA_CODE_PURE() {
    return truthy("ALYA_CODE_PURE")
  },
  get ALYA_CODE_PERMISSION() {
    return process.env["ALYA_CODE_PERMISSION"]
  },
  get ALYA_CODE_PLUGIN_META_FILE() {
    return process.env["ALYA_CODE_PLUGIN_META_FILE"]
  },
  get ALYA_CODE_CLIENT() {
    return process.env["ALYA_CODE_CLIENT"] ?? "cli"
  },
}
