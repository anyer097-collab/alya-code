import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registerAlyaCodeSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
