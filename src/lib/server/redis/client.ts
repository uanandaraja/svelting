import Redis from "ioredis";
import { env } from "$env/dynamic/private";

if (!env.REDIS_URL) {
	throw new Error("REDIS_URL is not set");
}

/**
 * Main Redis client for general operations.
 * Used by resumable-stream as the publisher.
 */
export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: 3,
	lazyConnect: true,
});

/**
 * Creates a new Redis client for pub/sub subscriber.
 * resumable-stream needs a separate connection for subscriptions
 * because ioredis enters subscriber mode.
 */
export const createSubscriber = () =>
	new Redis(env.REDIS_URL!, {
		maxRetriesPerRequest: 3,
		lazyConnect: true,
	});
