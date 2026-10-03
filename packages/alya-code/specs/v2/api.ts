// @ts-nocheck

import { AlyaCode } from "@alya-code/core"
import { ReadTool } from "@alya-code/core/tools"

const alya-code = AlyaCode.make({})

alya-code.tool.add(ReadTool)

alya-code.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

alya-code.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

alya-code.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await alya-code.session.create({
  agent: "build",
})

alya-code.subscribe((event) => {
  console.log(event)
})

await alya-code.session.prompt({
  sessionID,
  text: "hey what is up",
})

await alya-code.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await alya-code.session.wait()

console.log(await alya-code.session.messages(sessionID))
