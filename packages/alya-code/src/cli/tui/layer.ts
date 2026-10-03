import { run as runTui, type TuiInput } from "@alya-code/tui"
import { Global } from "@alya-code/core/global"
import { AppNodeBuilder } from "@alya-code/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
