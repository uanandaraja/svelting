import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { conversation } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { getSession } from "../../../data.remote";
import { getStreamContext } from "$lib/server/redis/stream-context";

/**
 * GET /chat/[id]/api/stream
 *
 * This endpoint is called by the AI SDK's useChat hook when `resume: true` is set.
 * It checks if there's an active stream for this conversation and resumes it.
 *
 * Returns:
 * - 204 No Content: No active stream (client should proceed normally)
 * - 200 with stream: Active stream exists, resume from Redis
 * - 401/404: Auth or not found errors
 */
export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	// Verify authentication
	const session = await getSession();

	// Get conversation and verify ownership
	const conv = await db
		.select({ activeStreamId: conversation.activeStreamId })
		.from(conversation)
		.where(
			and(eq(conversation.id, id), eq(conversation.userId, session.user.id)),
		)
		.limit(1);

	if (conv.length === 0) {
		error(404, "Conversation not found");
	}

	const { activeStreamId } = conv[0];

	// No active stream - return 204 No Content
	if (!activeStreamId) {
		return new Response(null, { status: 204 });
	}

	// Try to resume the existing stream from Redis
	const streamContext = getStreamContext();
	const stream = await streamContext.resumeExistingStream(activeStreamId);

	// Stream not found or already completed
	if (!stream) {
		// Clear the stale activeStreamId
		await db
			.update(conversation)
			.set({ activeStreamId: null })
			.where(eq(conversation.id, id));

		return new Response(null, { status: 204 });
	}

	// Return the resumed stream with proper headers
	return new Response(stream, {
		headers: UI_MESSAGE_STREAM_HEADERS,
	});
};
