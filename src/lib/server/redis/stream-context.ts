import { createResumableStreamContext } from "resumable-stream";

/**
 * Get or create the resumable stream context.
 *
 * The resumable-stream package uses the `redis` package internally
 * and automatically reads from REDIS_URL env var.
 *
 * SvelteKit doesn't have Next.js's `after()` function, but since we're
 * running on a persistent server (not serverless), we can pass null
 * for waitUntil - the process won't be suspended.
 */
export const getStreamContext = () => {
	return createResumableStreamContext({
		waitUntil: null, // SvelteKit on persistent server doesn't need this
		keyPrefix: "svelting:stream",
	});
};
