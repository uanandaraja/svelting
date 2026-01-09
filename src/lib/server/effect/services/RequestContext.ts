import { Context, Layer } from "effect";
import type { RequestEvent } from "@sveltejs/kit";

// ─────────────────────────────────────────────────────────────
// RequestContext Service
// Captures the SvelteKit request event so services can access headers
// ─────────────────────────────────────────────────────────────

export interface RequestContextShape {
	readonly event: RequestEvent;
}

export class RequestContext extends Context.Tag("RequestContext")<
	RequestContext,
	RequestContextShape
>() {}

/**
 * Creates a layer that provides the RequestContext for a specific request.
 * This is called per-request in the adapter.
 */
export const makeRequestContextLayer = (event: RequestEvent) =>
	Layer.succeed(RequestContext, { event });
