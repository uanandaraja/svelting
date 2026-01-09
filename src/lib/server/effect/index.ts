// ─────────────────────────────────────────────────────────────
// Effect Module - Main Entry Point
// ─────────────────────────────────────────────────────────────

// Errors
export * from "./errors";

// Layers
export { ServicesLive } from "./layers";
export type { Services } from "./layers";

// Adapters for SvelteKit
export {
	effectQuery,
	effectQueryWithSchema,
	effectCommand,
	effectCommandWithSchema,
	runEffectInHandler,
} from "./adapters";

// Services (re-export everything)
export * from "./services";
