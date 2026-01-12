import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { conversation, message } from "$lib/server/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { streamText, generateId } from "ai";
import { openrouter, extractTextFromParts } from "$lib/server/ai";
import type { UIMessage } from "$lib/ai";
import { getSession } from "../../../data.remote";
import { getStreamContext } from "$lib/server/redis/stream-context";

export const POST: RequestHandler = async ({ request, params }) => {
	const session = await getSession();
	const { id } = params;

	// Fetch conversation directly from DB to get fresh model value (no caching)
	const [conv] = await db
		.select()
		.from(conversation)
		.where(
			and(eq(conversation.id, id), eq(conversation.userId, session.user.id)),
		)
		.limit(1);

	if (!conv) {
		error(404, "Conversation not found");
	}

	const body = await request.json();
	const { messages: uiMessages } = body as { messages: UIMessage[] };

	if (!uiMessages || uiMessages.length === 0) {
		error(400, "Messages are required");
	}

	const lastMessage = uiMessages[uiMessages.length - 1];
	if (lastMessage.role !== "user") {
		error(400, "Last message must be from user");
	}

	const userContent = extractTextFromParts(lastMessage.parts);
	if (!userContent.trim()) {
		error(400, "Message content is required");
	}

	const existingMessages = await db
		.select()
		.from(message)
		.where(eq(message.conversationId, id))
		.orderBy(asc(message.createdAt));

	const existingIds = new Set(existingMessages.map((m) => m.id));

	// Save user message if not already saved
	if (!existingIds.has(lastMessage.id)) {
		await db.insert(message).values({
			id: lastMessage.id,
			conversationId: id,
			role: "user",
			content: userContent.trim(),
		});
	}

	// Clear any previous active stream
	await db
		.update(conversation)
		.set({ activeStreamId: null })
		.where(eq(conversation.id, id));

	const aiMessages = uiMessages
		.filter((msg) => msg.role === "user" || msg.role === "assistant")
		.map((msg) => ({
			role: msg.role as "user" | "assistant",
			content: extractTextFromParts(msg.parts),
		}));

	const result = streamText({
		model: openrouter.chat(conv.model),
		system: conv.systemPrompt,
		messages: aiMessages,
		onFinish: async ({ text }) => {
			// Save assistant message
			await db.insert(message).values({
				id: crypto.randomUUID(),
				conversationId: id,
				role: "assistant",
				content: text,
			});

			// Update conversation timestamp and clear active stream
			await db
				.update(conversation)
				.set({ updatedAt: new Date(), activeStreamId: null })
				.where(eq(conversation.id, id));
		},
	});

	return result.toUIMessageStreamResponse({
		originalMessages: uiMessages,
		generateMessageId: generateId,
		// Consume the SSE stream and persist to Redis for resumability
		async consumeSseStream({ stream }) {
			const streamId = generateId();
			const streamContext = getStreamContext();

			// Create a resumable stream that persists to Redis
			await streamContext.createNewResumableStream(streamId, () => stream);

			// Track the active stream in the database
			await db
				.update(conversation)
				.set({ activeStreamId: streamId })
				.where(eq(conversation.id, id));
		},
	});
};
