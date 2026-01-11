import { Context, Layer, Effect } from "effect";
import { eq, asc } from "drizzle-orm";
import { message } from "$lib/server/db/schema";
import { DatabaseService, runQuery } from "./Database";
import { ConversationService } from "./Conversation";
import { AuthService } from "./Auth";
import { RequestContext } from "./RequestContext";
import { NotFoundError, DatabaseError, UnauthorizedError } from "../errors";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MessageData {
	id: string;
	role: string;
	content: string;
	createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Service Definition
// ─────────────────────────────────────────────────────────────

type MsgErrors = NotFoundError | DatabaseError | UnauthorizedError;
type MsgContext =
	| DatabaseService
	| AuthService
	| ConversationService
	| RequestContext;

export interface MessageServiceShape {
	/**
	 * Get all messages for a conversation (with ownership check)
	 */
	readonly getForConversation: (
		conversationId: string,
	) => Effect.Effect<MessageData[], MsgErrors, MsgContext>;
}

export class MessageService extends Context.Tag("MessageService")<
	MessageService,
	MessageServiceShape
>() {}

// ─────────────────────────────────────────────────────────────
// Live Implementation
// ─────────────────────────────────────────────────────────────

export const MessageLive = Layer.succeed(
	MessageService,
	MessageService.of({
		getForConversation: (conversationId: string) =>
			Effect.gen(function* () {
				// Verify ownership via conversation service
				const convoService = yield* ConversationService;
				yield* convoService.getById(conversationId);

				const msgs = yield* runQuery((db) =>
					db
						.select()
						.from(message)
						.where(eq(message.conversationId, conversationId))
						.orderBy(asc(message.createdAt)),
				);

				return msgs.map((m) => ({
					id: m.id,
					role: m.role,
					content: m.content,
					createdAt: m.createdAt.toISOString(),
				}));
			}),
	}),
);

// ─────────────────────────────────────────────────────────────
// Convenience Accessors
// ─────────────────────────────────────────────────────────────

export const getMessagesForConversation = (conversationId: string) =>
	Effect.gen(function* () {
		const service = yield* MessageService;
		return yield* service.getForConversation(conversationId);
	});
