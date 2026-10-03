import { Context, Effect } from "effect"

export interface Interface {
  readonly run: Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@alya-code/InstanceBootstrap") {}

export * as InstanceBootstrap from "./bootstrap-service"
