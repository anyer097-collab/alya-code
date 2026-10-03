# @alya-code/sdk-next

Effect-native scoped Alya Code host for in-process applications. This transitional package will replace the existing generated `@alya-code/sdk` after its consumers migrate.

The SDK executes Server's assembled HTTP router in memory. It opens no listener and performs no network I/O, while preserving the same routing, middleware, handlers, codecs, and errors as the network client.

```ts
import { Alya Code } from "@alya-code/sdk-next"

const alya-code = yield * Alya Code.create()
const session = yield * alya-code.sessions.get({ sessionID })
```

It also exports `Tool` and exposes local-only `tools.register(...)`, replacing the former `@alya-code/core/public` facade. Registration uses Core's host-level `ApplicationTools` service shared by the host's Locations; each Location retains its own `ToolRegistry` for overlay, lookup, and settlement. Closing the owning Effect Scope releases router resources, location services, fibers, and scoped tool registrations.

`sessions.events({ sessionID, after })` replays durable events after the optional aggregate sequence, then emits newly committed durable events. `sessions.interrupt(...)` targets execution owned by this host, and `sessions.message(...)` retrieves one projected Session message.

The same constructor is available as a service Layer:

```ts
const program = Effect.gen(function* () {
  const alya-code = yield* Alya Code.Service
  return yield* alya-code.sessions.get({ sessionID })
})

yield * program.pipe(Effect.provide(Alya Code.layer))
```

`Alya Code.layer` adapts `Alya Code.create()` for dependency injection; it does not define another host implementation.
