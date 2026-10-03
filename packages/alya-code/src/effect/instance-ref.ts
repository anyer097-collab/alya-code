import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@alya-code/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~alya-code/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~alya-code/WorkspaceRef", {
  defaultValue: () => undefined,
})
