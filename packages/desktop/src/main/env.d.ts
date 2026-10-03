interface ImportMetaEnv {
  readonly ALYA_CODE_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:alya-code-server" {
  export namespace Server {
    export const listen: typeof import("../../../alya-code/dist/types/src/node").Server.listen
    export type Listener = import("../../../alya-code/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../alya-code/dist/types/src/node").Config.get
    export type Info = import("../../../alya-code/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../alya-code/dist/types/src/node").bootstrap
}
