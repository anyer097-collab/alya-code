import { registerCustomTheme } from "@pierre/diffs"
import { AlyaCodeTheme } from "./marked-theme"

let registered = false

export function registerAlyaCodeTheme() {
  if (registered) return
  registered = true
  registerCustomTheme("Alya Code", () => Promise.resolve(AlyaCodeTheme))
}
