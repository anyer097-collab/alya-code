export * as File from "./file"

import { Revert } from "@alya-code/schema/revert"

export const Diff = Revert.FileDiff
export type Diff = typeof Diff.Type
