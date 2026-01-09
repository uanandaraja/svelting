import { Data } from "effect";

// ─────────────────────────────────────────────────────────────
// Tagged Error Classes
// These integrate with SvelteKit's error() function via adapters
// ─────────────────────────────────────────────────────────────

/**
 * Unauthorized - maps to SvelteKit error(401)
 * Thrown when user is not authenticated
 */
export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
	readonly message?: string;
}> {}

/**
 * NotFound - maps to SvelteKit error(404)
 * Thrown when a resource doesn't exist or user doesn't have access
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	readonly resource: string;
	readonly id: string;
}> {}

/**
 * Validation - maps to SvelteKit error(400)
 * Thrown when input validation fails
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly message: string;
	readonly field?: string;
}> {}

/**
 * Forbidden - maps to SvelteKit error(403)
 * Thrown when user is authenticated but not authorized
 */
export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
	readonly message?: string;
}> {}

/**
 * Database - maps to SvelteKit error(500)
 * Thrown when database operations fail
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
	readonly cause: unknown;
}> {}

// ─────────────────────────────────────────────────────────────
// Union type for pattern matching
// ─────────────────────────────────────────────────────────────

export type AppError =
	| UnauthorizedError
	| NotFoundError
	| ValidationError
	| ForbiddenError
	| DatabaseError;
