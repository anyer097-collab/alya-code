/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeAlyaCodeContent from "./skill/customize-alya-code.md" with { type: "text" }

export const CustomizeAlyaCodeContent = customizeAlyaCodeContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-alya-code",
            description:
              "Use ONLY when the user is editing or creating alya-code's own configuration: alya-code.json, alya-code.jsonc, files under .alya-code/, or files under ~/.config/alya-code/. Also use when creating or fixing alya-code agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring alya-code itself.",
            location: AbsolutePath.make("/builtin/customize-alya-code.md"),
            content: CustomizeAlyaCodeContent,
          }),
        }),
      )
    })
  }),
})
