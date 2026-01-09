import { error } from "@sveltejs/kit";
import { query, command, getRequestEvent } from "$app/server";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { conversation } from "$lib/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { SYSTEM_PROMPT, DEFAULT_MODEL } from "$lib/ai";
import type { Conversation } from "$lib/ai";

export const getConversations = query(async (): Promise<Conversation[]> => {
	const event = getRequestEvent();

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (!session) {
		error(401, "Unauthorized");
	}

	const conversations = await db
		.select()
		.from(conversation)
		.where(eq(conversation.userId, session.user.id))
		.orderBy(desc(conversation.updatedAt));

	return conversations.map((c) => ({
		id: c.id,
		systemPrompt: c.systemPrompt,
		model: c.model,
		createdAt: c.createdAt.toISOString(),
		updatedAt: c.updatedAt.toISOString(),
	}));
});

export const createConversation = command(async (): Promise<{ id: string }> => {
	const event = getRequestEvent();

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (!session) {
		error(401, "Unauthorized");
	}

	const conversationId = crypto.randomUUID();

	await db.insert(conversation).values({
		id: conversationId,
		userId: session.user.id,
		systemPrompt: SYSTEM_PROMPT,
		model: DEFAULT_MODEL,
	});

	return { id: conversationId };
});
