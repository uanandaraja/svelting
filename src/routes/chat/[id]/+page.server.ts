import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { conversation, message } from "$lib/server/db/schema";
import { eq, asc, and } from "drizzle-orm";

export const load: PageServerLoad = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		redirect(303, "/auth");
	}

	const { id } = params;

	// Get conversation and verify ownership
	const conv = await db
		.select()
		.from(conversation)
		.where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))
		.limit(1);

	if (conv.length === 0) {
		error(404, "Conversation not found");
	}

	// Get messages for this conversation
	const messages = await db
		.select()
		.from(message)
		.where(eq(message.conversationId, id))
		.orderBy(asc(message.createdAt));

	return {
		conversation: conv[0],
		messages,
		user: session.user,
	};
};
