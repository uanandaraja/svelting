import { Context, Layer, Effect } from "effect";
import { auth } from "$lib/server/auth";
import { RequestContext } from "./RequestContext";
import { UnauthorizedError } from "../errors";

// ─────────────────────────────────────────────────────────────
// Auth Service
// Handles session and user retrieval with typed errors
// ─────────────────────────────────────────────────────────────

// Infer types from better-auth
type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type User = Session["user"];

export interface AuthServiceShape {
	/**
	 * Get the current session or fail with UnauthorizedError
	 */
	readonly getSession: Effect.Effect<Session, UnauthorizedError, RequestContext>;

	/**
	 * Get the current user or fail with UnauthorizedError
	 */
	readonly getUser: Effect.Effect<User, UnauthorizedError, RequestContext>;
}

export class AuthService extends Context.Tag("AuthService")<AuthService, AuthServiceShape>() {}

// Internal helper for getting session (used to avoid circular ref)
const _getSession = Effect.gen(function* () {
	const { event } = yield* RequestContext;

	const session = yield* Effect.tryPromise({
		try: () => auth.api.getSession({ headers: event.request.headers }),
		catch: () => new UnauthorizedError({ message: "Failed to verify session" }),
	});

	if (!session) {
		return yield* Effect.fail(new UnauthorizedError({ message: "Not authenticated" }));
	}

	return session;
});

/**
 * Live implementation that uses better-auth
 */
export const AuthLive = Layer.succeed(
	AuthService,
	AuthService.of({
		getSession: _getSession,

		getUser: _getSession.pipe(Effect.map((session) => session.user)),
	}),
);

// ─────────────────────────────────────────────────────────────
// Convenience accessors (for use in other services)
// ─────────────────────────────────────────────────────────────

/**
 * Get session from the AuthService
 */
export const getSession = Effect.gen(function* () {
	const authService = yield* AuthService;
	return yield* authService.getSession;
});

/**
 * Get user from the AuthService
 */
export const getUser = Effect.gen(function* () {
	const authService = yield* AuthService;
	return yield* authService.getUser;
});
