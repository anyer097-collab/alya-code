export * as PublicEventManifest from "./public-event-manifest"

import { Event } from "@alya-code/schema/event"
import { EventManifest } from "@alya-code/schema/event-manifest"

export const Definitions = EventManifest.ServerDefinitions
export const Latest = Event.latest(Definitions)
