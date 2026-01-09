import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { conversation, message } from "$lib/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { streamText } from "ai";
import { openrouter, extractTextFromParts } from "$lib/server/ai";
import type { UIMessage } from "$lib/ai";
import { getSession, getConversationRaw, getMessages } from "../../../data.remote";

// Get messages for a conversation
export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	const messages = await getMessages(id);
	return json({ messages });
};

// Send a message and stream AI response
export const POST: RequestHandler = async ({ request, params }) => {
	// Auth + ownership check via shared helpers
	await getSession();
	const conv = await getConversationRaw(params.id);
	const { id } = params;

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
		model: openrouter.chat(conv.model),
		system: conv.systemPrompt,
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
