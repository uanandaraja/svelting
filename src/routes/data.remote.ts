import { Effect, Option } from "effect";
import { effectQuery } from "$lib/server/effect/adapters";
import { AuthService } from "$lib/server/effect/services";

/**
 * Try to get the current session, returns null if not authenticated
 */
export const tryGetSession = effectQuery(
	Effect.gen(function* () {
		const auth = yield* AuthService;
		return yield* auth.getSession;
	}).pipe(Effect.option, Effect.map(Option.getOrNull)),
);
