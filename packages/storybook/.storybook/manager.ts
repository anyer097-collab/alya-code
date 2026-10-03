import { addons, types } from "storybook/manager-api"
import { ThemeTool } from "./theme-tool"

addons.register("alya-code/theme-toggle", () => {
  addons.add("alya-code/theme-toggle/tool", {
    type: types.TOOL,
    title: "Theme",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: ThemeTool,
  })
})
