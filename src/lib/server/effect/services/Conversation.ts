import { Context, Layer, Effect } from "effect";
import { eq, desc, asc, and } from "drizzle-orm";
import { conversation, message } from "$lib/server/db/schema";
import { SYSTEM_PROMPT, DEFAULT_MODEL } from "$lib/ai";
import type { Conversation } from "$lib/ai";
import { DatabaseService, runQuery } from "./Database";
import { AuthService } from "./Auth";
import { RequestContext } from "./RequestContext";
import { NotFoundError, DatabaseError, UnauthorizedError } from "../errors";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

// Raw conversation row from database
type ConversationRow = typeof conversation.$inferSelect;

// Message format returned from service
export interface MessageData {
	id: string;
	role: string;
	content: string;
	createdAt: string;
}

// Combined conversation + messages
export interface ConversationWithMessages {
	conversation: Conversation;
	messages: MessageData[];
}

// ─────────────────────────────────────────────────────────────
// Service Definition
// ─────────────────────────────────────────────────────────────

type ConvoErrors = NotFoundError | DatabaseError | UnauthorizedError;
type ConvoContext = DatabaseService | AuthService | RequestContext;

export interface ConversationServiceShape {
	/**
	 * Get all conversations for the current user
	 */
	readonly getAll: Effect.Effect<Conversation[], ConvoErrors, ConvoContext>;

	/**
	 * Get a single conversation by ID (with ownership check)
	 */
	readonly getById: (
		id: string,
	) => Effect.Effect<Conversation, ConvoErrors, ConvoContext>;

	/**
	 * Get raw conversation row (for internal use like streaming)
	 */
	readonly getRaw: (
		id: string,
	) => Effect.Effect<ConversationRow, ConvoErrors, ConvoContext>;

	/**
	 * Get conversation with all its messages
	 */
	readonly getWithMessages: (
		id: string,
	) => Effect.Effect<ConversationWithMessages, ConvoErrors, ConvoContext>;

	/**
	 * Create a new conversation
	 */
	readonly create: (
		model?: string,
	) => Effect.Effect<{ id: string }, ConvoErrors, ConvoContext>;

	/**
	 * Delete a conversation (messages cascade automatically)
	 */
	readonly delete: (
		id: string,
	) => Effect.Effect<void, ConvoErrors, ConvoContext>;

	/**
	 * Update the model for a conversation
	 */
	readonly updateModel: (
		id: string,
		model: string,
	) => Effect.Effect<void, ConvoErrors, ConvoContext>;

	/**
	 * Update the active stream ID for resumable streaming
	 */
	readonly setActiveStreamId: (
		id: string,
		streamId: string | null,
	) => Effect.Effect<void, ConvoErrors, ConvoContext>;

	/**
	 * Get the active stream ID for a conversation (returns null if not streaming)
	 */
	readonly getActiveStreamId: (
		id: string,
	) => Effect.Effect<string | null, ConvoErrors, ConvoContext>;
}

export class ConversationService extends Context.Tag("ConversationService")<
	ConversationService,
	ConversationServiceShape
>() {}

// ─────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Verify the current user owns the conversation
 */
const verifyOwnership = (id: string) =>
	Effect.gen(function* () {
		const authService = yield* AuthService;
		const session = yield* authService.getSession;

		const conv = yield* runQuery((db) =>
			db
				.select()
				.from(conversation)
				.where(
					and(
						eq(conversation.id, id),
						eq(conversation.userId, session.user.id),
					),
				)
				.limit(1),
		);

		if (conv.length === 0) {
			return yield* Effect.fail(
				new NotFoundError({ resource: "Conversation", id }),
			);
		}

		return conv[0];
	});

/**
 * Convert a database row to the Conversation type
 */
const toConversation = (row: ConversationRow): Conversation => ({
	id: row.id,
	systemPrompt: row.systemPrompt,
	model: row.model,
	createdAt: row.createdAt.toISOString(),
	updatedAt: row.updatedAt.toISOString(),
});

// ─────────────────────────────────────────────────────────────
// Live Implementation
// ─────────────────────────────────────────────────────────────

export const ConversationLive = Layer.succeed(
	ConversationService,
	ConversationService.of({
		getAll: Effect.gen(function* () {
			const authService = yield* AuthService;
			const session = yield* authService.getSession;

			const conversations = yield* runQuery((db) =>
				db
					.select()
					.from(conversation)
					.where(eq(conversation.userId, session.user.id))
					.orderBy(desc(conversation.updatedAt)),
			);

			// Fetch first user message for each conversation (in parallel)
			const withMessages = yield* Effect.all(
				conversations.map((c) =>
					runQuery((db) =>
						db
							.select({ content: message.content })
							.from(message)
							.where(
								and(eq(message.conversationId, c.id), eq(message.role, "user")),
							)
							.orderBy(asc(message.createdAt))
							.limit(1),
					).pipe(
						Effect.map(
							(msgs): Conversation => ({
								id: c.id,
								systemPrompt: c.systemPrompt,
								model: c.model,
								createdAt: c.createdAt.toISOString(),
								updatedAt: c.updatedAt.toISOString(),
								firstMessage: msgs[0]?.content,
							}),
						),
					),
				),
				{ concurrency: "unbounded" },
			);

			return withMessages;
		}),

		getById: (id: string) =>
			verifyOwnership(id).pipe(Effect.map(toConversation)),

		getRaw: (id: string) => verifyOwnership(id),

		getWithMessages: (id: string) =>
			Effect.gen(function* () {
				const conv = yield* verifyOwnership(id);

				const msgs = yield* runQuery((db) =>
					db
						.select()
						.from(message)
						.where(eq(message.conversationId, id))
						.orderBy(asc(message.createdAt)),
				);

				return {
					conversation: toConversation(conv),
					messages: msgs.map((m) => ({
						id: m.id,
						role: m.role,
						content: m.content,
						createdAt: m.createdAt.toISOString(),
					})),
				};
			}),

		create: (model?: string) =>
			Effect.gen(function* () {
				const authService = yield* AuthService;
				const session = yield* authService.getSession;
				const conversationId = crypto.randomUUID();

				yield* runQuery((db) =>
					db.insert(conversation).values({
						id: conversationId,
						userId: session.user.id,
						systemPrompt: SYSTEM_PROMPT,
						model: model ?? DEFAULT_MODEL,
					}),
				);

				return { id: conversationId };
			}),

		delete: (id: string) =>
			Effect.gen(function* () {
				yield* verifyOwnership(id);
				yield* runQuery((db) =>
					db.delete(conversation).where(eq(conversation.id, id)),
				);
			}),

		setActiveStreamId: (id: string, streamId: string | null) =>
			Effect.gen(function* () {
				yield* verifyOwnership(id);
				yield* runQuery((db) =>
					db
						.update(conversation)
						.set({ activeStreamId: streamId })
						.where(eq(conversation.id, id)),
				);
			}),

		updateModel: (id: string, model: string) =>
			Effect.gen(function* () {
				yield* verifyOwnership(id);
				yield* runQuery((db) =>
					db
						.update(conversation)
						.set({ model, updatedAt: new Date() })
						.where(eq(conversation.id, id)),
				);
			}),

		getActiveStreamId: (id: string) =>
			Effect.gen(function* () {
				const conv = yield* verifyOwnership(id);
				return conv.activeStreamId;
			}),
	}),
);

// ─────────────────────────────────────────────────────────────
// Convenience Accessors
// ─────────────────────────────────────────────────────────────

export const getAllConversations = Effect.gen(function* () {
	const service = yield* ConversationService;
	return yield* service.getAll;
});

export const getConversationById = (id: string) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getById(id);
	});

export const getConversationRaw = (id: string) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getRaw(id);
	});

export const getConversationWithMessages = (id: string) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getWithMessages(id);
	});

export const createConversation = (model?: string) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.create(model);
	});

export const deleteConversation = (id: string) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.delete(id);
	});

export const updateConversationModel = (id: string, model: string) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.updateModel(id, model);
	});
