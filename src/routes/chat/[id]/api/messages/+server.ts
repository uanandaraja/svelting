import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { conversation, message } from "$lib/server/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { streamText } from "ai";
import { openrouter, extractTextFromParts } from "$lib/server/ai";
import type { UIMessage } from "$lib/ai";

// Get messages for a conversation
export const GET: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		error(401, "Unauthorized");
	}

	const { id } = params;

	// Verify conversation ownership
	const conv = await db
		.select()
		.from(conversation)
		.where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))
		.limit(1);

	if (conv.length === 0) {
		error(404, "Conversation not found");
	}

	const messages = await db
		.select()
		.from(message)
		.where(eq(message.conversationId, id))
		.orderBy(asc(message.createdAt));

	return json({ messages });
};

// Send a message and stream AI response
export const POST: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		error(401, "Unauthorized");
	}

	const { id } = params;

	// Verify conversation ownership
	const conv = await db
		.select()
		.from(conversation)
		.where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))
		.limit(1);

	if (conv.length === 0) {
		error(404, "Conversation not found");
	}

	const body = await request.json();

	// DefaultChatTransport sends: { messages: UIMessage[], chatId: string, ... }
	const { messages: uiMessages } = body as { messages: UIMessage[] };

	if (!uiMessages || uiMessages.length === 0) {
		error(400, "Messages are required");
	}

	// Get the last user message (the new one being sent)
	const lastMessage = uiMessages[uiMessages.length - 1];
	if (lastMessage.role !== "user") {
		error(400, "Last message must be from user");
	}

	const userContent = extractTextFromParts(lastMessage.parts);
	if (!userContent.trim()) {
		error(400, "Message content is required");
	}

	// Check if this message already exists in DB (from conversation creation)
	const existingMessages = await db
		.select()
		.from(message)
		.where(eq(message.conversationId, id))
		.orderBy(asc(message.createdAt));

	const existingIds = new Set(existingMessages.map((m) => m.id));

	// Save new user message if it doesn't exist
	if (!existingIds.has(lastMessage.id)) {
		await db.insert(message).values({
			id: lastMessage.id,
			conversationId: id,
			role: "user",
			content: userContent.trim(),
		});
	}

	// Prepare messages for AI - use all messages from UI
	const aiMessages = uiMessages
		.filter((msg) => msg.role === "user" || msg.role === "assistant")
		.map((msg) => ({
			role: msg.role as "user" | "assistant",
			content: extractTextFromParts(msg.parts),
		}));

	// Stream AI response
	const result = streamText({
		model: openrouter(conv[0].model),
		system: conv[0].systemPrompt,
		messages: aiMessages,
		onFinish: async ({ text }) => {
			// Save assistant message after streaming completes
			await db.insert(message).values({
				id: crypto.randomUUID(),
				conversationId: id,
				role: "assistant",
				content: text,
			});

			// Update conversation updatedAt
			await db
				.update(conversation)
				.set({ updatedAt: new Date() })
				.where(eq(conversation.id, id));
		},
	});

	return result.toUIMessageStreamResponse();
};
