import { AgentV2 } from "@alya-code/core/agent"
import { AISDK } from "@alya-code/core/aisdk"
import { Catalog } from "@alya-code/core/catalog"
import { CommandV2 } from "@alya-code/core/command"
import { Credential } from "@alya-code/core/credential"
import { AppNodeBuilder } from "@alya-code/core/effect/app-node-builder"
import { LayerNodePlatform } from "@alya-code/core/effect/app-node-platform"
import { LayerNode } from "@alya-code/core/effect/layer-node"
import { EventV2 } from "@alya-code/core/event"
import { FileSystem } from "@alya-code/core/filesystem"
import { FSUtil } from "@alya-code/core/fs-util"
import { Integration } from "@alya-code/core/integration"
import { Location } from "@alya-code/core/location"
import { Npm } from "@alya-code/core/npm"
import { PluginV2 } from "@alya-code/core/plugin"
import { Reference } from "@alya-code/core/reference"
import { SkillV2 } from "@alya-code/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
