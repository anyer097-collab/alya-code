export * from "./client.js"
export * from "./server.js"

import { createAlyaCodeClient } from "./client.js"
import { createAlyaCodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createAlyaCode(options?: ServerOptions) {
  const server = await createAlyaCodeServer({
    ...options,
  })

  const client = createAlyaCodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
