import { Layer } from "effect";
import { DatabaseLive } from "./services/Database";
import { AuthLive } from "./services/Auth";
import { ConversationLive } from "./services/Conversation";
import { MessageLive } from "./services/Message";

// ─────────────────────────────────────────────────────────────
// Layer Composition
// ─────────────────────────────────────────────────────────────
//
// This composes all service layers into a single layer that can
// be provided to Effects. The RequestContext layer is provided
// per-request in the adapters since it needs the SvelteKit event.
//
// Layer dependency graph:
//   DatabaseLive ─────────────────────────────────────────┐
//        │                                                │
//        ▼                                                │
//   AuthLive (needs RequestContext at runtime)            │
//        │                                                │
//        ▼                                                │
//   ConversationLive (needs Auth + Database)   ◄──────────┤
//        │                                                │
//        ▼                                                │
//   MessageLive (needs Conversation + Database) ◄─────────┘
//
// ─────────────────────────────────────────────────────────────

/**
 * All service layers merged together.
 * Note: RequestContext must be provided separately per-request.
 */
export const ServicesLive = Layer.mergeAll(
	DatabaseLive,
	AuthLive,
	ConversationLive,
	MessageLive,
);

/**
 * Type representing all services provided by ServicesLive
 */
export type Services = Layer.Layer.Success<typeof ServicesLive>;
