import { $ } from "bun"
import { downloadCliToResources } from "./utils"

await $`bun run install-electron`

await $`bun ./scripts/copy-icons.ts ${process.env.ALYA_CODE_CHANNEL ?? "dev"}`

await $`cd ../alya-code && bun script/build-node.ts`
await downloadCliToResources()
