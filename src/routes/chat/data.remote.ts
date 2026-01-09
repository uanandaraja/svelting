import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query, command, getRequestEvent } from "$app/server";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { conversation, message } from "$lib/server/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { SYSTEM_PROMPT, DEFAULT_MODEL } from "$lib/ai";
import type { Conversation } from "$lib/ai";

// ─────────────────────────────────────────────────────────────
// Shared auth helper - returns session or throws 401
// ─────────────────────────────────────────────────────────────
export const getSession = query(async () => {
	const event = getRequestEvent();
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});
	if (!session) {
		error(401, "Unauthorized");
	}
	return session;
});

// ─────────────────────────────────────────────────────────────
// Private helper: verify conversation ownership, returns raw row
// ─────────────────────────────────────────────────────────────
async function verifyConversationOwnership(id: string, userId: string) {
	const conv = await db
		.select()
		.from(conversation)
		.where(and(eq(conversation.id, id), eq(conversation.userId, userId)))
		.limit(1);

	if (conv.length === 0) {
		error(404, "Conversation not found");
	}

	return conv[0];
}

// ─────────────────────────────────────────────────────────────
// Get user info (for layout/pages that need user data)
// ─────────────────────────────────────────────────────────────
export const getUser = query(async () => {
	const session = await getSession();
	return session.user;
});

// ─────────────────────────────────────────────────────────────
// Get all conversations for current user (with first message snippet)
// ─────────────────────────────────────────────────────────────
export const getConversations = query(async (): Promise<Conversation[]> => {
	const session = await getSession();

	const conversations = await db
		.select()
		.from(conversation)
		.where(eq(conversation.userId, session.user.id))
		.orderBy(desc(conversation.updatedAt));

	// Fetch first user message for each conversation
	const conversationsWithMessages = await Promise.all(
		conversations.map(async (c) => {
			const firstMsg = await db
				.select({ content: message.content })
				.from(message)
				.where(and(eq(message.conversationId, c.id), eq(message.role, "user")))
				.orderBy(asc(message.createdAt))
				.limit(1);

			return {
				id: c.id,
				systemPrompt: c.systemPrompt,
				model: c.model,
				createdAt: c.createdAt.toISOString(),
				updatedAt: c.updatedAt.toISOString(),
				firstMessage: firstMsg[0]?.content,
			};
		}),
	);

	return conversationsWithMessages;
});

// ─────────────────────────────────────────────────────────────
// Get single conversation with ownership verification
// ─────────────────────────────────────────────────────────────
export const getConversation = query(v.string(), async (id): Promise<Conversation> => {
	const session = await getSession();
	const conv = await verifyConversationOwnership(id, session.user.id);

	return {
		id: conv.id,
		systemPrompt: conv.systemPrompt,
		model: conv.model,
		createdAt: conv.createdAt.toISOString(),
		updatedAt: conv.updatedAt.toISOString(),
	};
});

// ─────────────────────────────────────────────────────────────
// Get raw conversation row (for internal use, e.g., streaming)
// ─────────────────────────────────────────────────────────────
export const getConversationRaw = query(v.string(), async (id) => {
	const session = await getSession();
	return verifyConversationOwnership(id, session.user.id);
});

// ─────────────────────────────────────────────────────────────
// Get messages for a conversation (with ownership check)
// ─────────────────────────────────────────────────────────────
export const getMessages = query(v.string(), async (id) => {
	// Verify ownership by fetching conversation first
	await getConversation(id);

	const msgs = await db
		.select()
		.from(message)
		.where(eq(message.conversationId, id))
		.orderBy(asc(message.createdAt));

	return msgs.map((m) => ({
		id: m.id,
		role: m.role,
		content: m.content,
		createdAt: m.createdAt.toISOString(),
	}));
});

// ─────────────────────────────────────────────────────────────
// Get conversation with messages (combined to avoid waterfall)
// ─────────────────────────────────────────────────────────────
export const getConversationWithMessages = query(v.string(), async (id) => {
	const session = await getSession();
	const conv = await verifyConversationOwnership(id, session.user.id);

	const msgs = await db
		.select()
		.from(message)
		.where(eq(message.conversationId, id))
		.orderBy(asc(message.createdAt));

	return {
		conversation: {
			id: conv.id,
			systemPrompt: conv.systemPrompt,
			model: conv.model,
			createdAt: conv.createdAt.toISOString(),
			updatedAt: conv.updatedAt.toISOString(),
		} as Conversation,
		messages: msgs.map((m) => ({
			id: m.id,
			role: m.role,
			content: m.content,
			createdAt: m.createdAt.toISOString(),
		})),
	};
});

// ─────────────────────────────────────────────────────────────
// Create a new conversation
// ─────────────────────────────────────────────────────────────
export const createConversation = command(async (): Promise<{ id: string }> => {
	const session = await getSession();

	const conversationId = crypto.randomUUID();

	await db.insert(conversation).values({
		id: conversationId,
		userId: session.user.id,
		systemPrompt: SYSTEM_PROMPT,
		model: DEFAULT_MODEL,
	});

	return { id: conversationId };
});

// ─────────────────────────────────────────────────────────────
// Delete a conversation (messages cascade automatically)
// ─────────────────────────────────────────────────────────────
export const deleteConversation = command(v.string(), async (id): Promise<void> => {
	const session = await getSession();
	await verifyConversationOwnership(id, session.user.id);
	await db.delete(conversation).where(eq(conversation.id, id));
});
