import { Context, Layer, Effect } from "effect";
import { db } from "$lib/server/db";
import { DatabaseError } from "../errors";

// ─────────────────────────────────────────────────────────────
// Database Service
// Wraps Drizzle ORM with Effect error handling
// ─────────────────────────────────────────────────────────────

export type Database = typeof db;

export class DatabaseService extends Context.Tag("DatabaseService")<
	DatabaseService,
	Database
>() {}

/**
 * Live implementation - provides the actual Drizzle db instance
 */
export const DatabaseLive = Layer.succeed(DatabaseService, db);

/**
 * Helper to run database operations with proper error handling.
 * Wraps any database query in Effect.tryPromise with DatabaseError.
 *
 * @example
 * ```ts
 * const users = yield* runQuery((db) =>
 *   db.select().from(user).where(eq(user.id, id))
 * );
 * ```
 */
export const runQuery = <A>(operation: (db: Database) => Promise<A>) =>
	Effect.gen(function* () {
		const database = yield* DatabaseService;
		return yield* Effect.tryPromise({
			try: () => operation(database),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});
