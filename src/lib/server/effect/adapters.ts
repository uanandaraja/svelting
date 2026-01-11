import { Effect, Match, Layer, Cause, Runtime } from "effect";
import { error } from "@sveltejs/kit";
import { query, command, getRequestEvent } from "$app/server";
import type * as v from "valibot";
import { makeRequestContextLayer } from "./services/RequestContext";
import { ServicesLive } from "./layers";
import type { AppError } from "./errors";

// ─────────────────────────────────────────────────────────────
// Error Mapping
// ─────────────────────────────────────────────────────────────

/**
 * Maps Effect errors to HTTP status/message pairs.
 * Returns plain objects instead of throwing, so the error can be
 * thrown at the Promise boundary where SvelteKit's error() works correctly.
 */
const mapErrorToKit = (err: AppError): { status: number; message: string } => {
	return Match.value(err).pipe(
		Match.tag("UnauthorizedError", (e) => ({
			status: 401,
			message: e.message ?? "Unauthorized",
		})),
		Match.tag("NotFoundError", (e) => ({
			status: 404,
			message: `${e.resource} not found`,
		})),
		Match.tag("ValidationError", (e) => ({
			status: 400,
			message: e.message,
		})),
		Match.tag("ForbiddenError", (e) => ({
			status: 403,
			message: e.message ?? "Forbidden",
		})),
		Match.tag("DatabaseError", () => ({
			status: 500,
			message: "Internal server error",
		})),
		Match.exhaustive,
	);
};

// ─────────────────────────────────────────────────────────────
// Effect Runner
// ─────────────────────────────────────────────────────────────

/**
 * Runs an Effect with all services provided, handling errors
 * by converting them to SvelteKit errors at the Promise boundary.
 */
// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
const runEffect = <A, E extends AppError>(
	effect: Effect.Effect<A, E, any>,
): Promise<A> => {
	const event = getRequestEvent();
	const requestLayer = makeRequestContextLayer(event);
	const fullLayer = Layer.merge(requestLayer, ServicesLive);

	const program = effect.pipe(Effect.provide(fullLayer));

	// Catch at the Promise boundary where error() can throw correctly
	// biome-ignore lint/suspicious/noExplicitAny: Layer provides all requirements
	return Effect.runPromise(program as Effect.Effect<A, E, never>).catch((e) => {
		// Effect wraps errors in FiberFailure - extract the actual error
		let actualError = e;
		if (Runtime.isFiberFailure(e)) {
			const cause = e[Runtime.FiberFailureCauseId];
			const failureOpt = Cause.failureOption(cause);
			if (failureOpt._tag === "Some") {
				actualError = failureOpt.value;
			}
		}

		// Check if it's one of our typed errors by looking for _tag
		if (
			actualError &&
			typeof actualError === "object" &&
			"_tag" in actualError
		) {
			const { status, message } = mapErrorToKit(actualError as AppError);
			throw error(status, message);
		}
		// Unknown error - log and return 500
		console.error("Unexpected error in Effect:", e);
		throw error(500, "Internal server error");
	});
};

// ─────────────────────────────────────────────────────────────
// Query Wrappers
// ─────────────────────────────────────────────────────────────

/**
 * Creates a SvelteKit query that runs an Effect.
 *
 * @example
 * ```ts
 * export const getConversations = effectQuery(
 *   Effect.gen(function* () {
 *     const service = yield* ConversationService;
 *     return yield* service.getAll;
 *   })
 * );
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
export function effectQuery<A, E extends AppError>(
	effect: Effect.Effect<A, E, any>,
): () => Promise<A> {
	return query(async () => runEffect(effect));
}

/**
 * Creates a SvelteKit query with Valibot validation that runs an Effect.
 *
 * @example
 * ```ts
 * export const getConversation = effectQueryWithSchema(
 *   v.string(),
 *   (id) => Effect.gen(function* () {
 *     const service = yield* ConversationService;
 *     return yield* service.getById(id);
 *   })
 * );
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
export function effectQueryWithSchema<
	S extends v.BaseSchema<any, any, any>,
	A,
	E extends AppError,
>(
	schema: S,
	// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
	fn: (input: v.InferOutput<S>) => Effect.Effect<A, E, any>,
): (input: v.InferInput<S>) => Promise<A> {
	return query(schema, async (input) => runEffect(fn(input)));
}

// ─────────────────────────────────────────────────────────────
// Command Wrappers
// ─────────────────────────────────────────────────────────────

/**
 * Creates a SvelteKit command that runs an Effect.
 *
 * @example
 * ```ts
 * export const createConversation = effectCommand(
 *   Effect.gen(function* () {
 *     const service = yield* ConversationService;
 *     return yield* service.create;
 *   })
 * );
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
export function effectCommand<A, E extends AppError>(
	effect: Effect.Effect<A, E, any>,
): () => Promise<A> {
	return command(async () => runEffect(effect));
}

/**
 * Creates a SvelteKit command with Valibot validation that runs an Effect.
 *
 * @example
 * ```ts
 * export const deleteConversation = effectCommandWithSchema(
 *   v.string(),
 *   (id) => Effect.gen(function* () {
 *     const service = yield* ConversationService;
 *     return yield* service.delete(id);
 *   })
 * );
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
export function effectCommandWithSchema<
	S extends v.BaseSchema<any, any, any>,
	A,
	E extends AppError,
>(
	schema: S,
	// biome-ignore lint/suspicious/noExplicitAny: Effect types require flexibility here
	fn: (input: v.InferOutput<S>) => Effect.Effect<A, E, any>,
): (input: v.InferInput<S>) => Promise<A> {
	return command(schema, async (input) => runEffect(fn(input)));
}

// ─────────────────────────────────────────────────────────────
// Direct Runner (for +page.server.ts load functions)
// ─────────────────────────────────────────────────────────────

/**
 * Runs an Effect directly in a load function or request handler.
 * Use this when you need more control than effectQuery/effectCommand.
 *
 * @example
 * ```ts
 * export async function load({ params }) {
 *   return runEffectInHandler(
 *     Effect.gen(function* () {
 *       const service = yield* ConversationService;
 *       return yield* service.getWithMessages(params.id);
 *     })
 *   );
 * }
 * ```
 */
export const runEffectInHandler = runEffect;
