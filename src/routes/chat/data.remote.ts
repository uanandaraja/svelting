import * as v from "valibot";
import { Effect } from "effect";
import {
	effectQuery,
	effectQueryWithSchema,
	effectCommand,
	effectCommandWithSchema,
} from "$lib/server/effect/adapters";
import {
	AuthService,
	ConversationService,
	MessageService,
} from "$lib/server/effect/services";
import type { Conversation } from "$lib/ai";

// ─────────────────────────────────────────────────────────────
// Auth Queries
// ─────────────────────────────────────────────────────────────

/**
 * Get the current session or throw 401
 */
export const getSession = effectQuery(
	Effect.gen(function* () {
		const auth = yield* AuthService;
		return yield* auth.getSession;
	}),
);

/**
 * Get the current user or throw 401
 */
export const getUser = effectQuery(
	Effect.gen(function* () {
		const auth = yield* AuthService;
		return yield* auth.getUser;
	}),
);

// ─────────────────────────────────────────────────────────────
// Conversation Queries
// ─────────────────────────────────────────────────────────────

/**
 * Get all conversations for the current user (with first message snippet)
 */
export const getConversations = effectQuery(
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getAll;
	}),
) as () => Promise<Conversation[]>;

/**
 * Get a single conversation by ID (with ownership verification)
 */
export const getConversation = effectQueryWithSchema(v.string(), (id) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getById(id);
	}),
) as (id: string) => Promise<Conversation>;

/**
 * Get raw conversation row (for internal use like streaming)
 */
export const getConversationRaw = effectQueryWithSchema(v.string(), (id) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getRaw(id);
	}),
);

/**
 * Get messages for a conversation (with ownership check)
 */
export const getMessages = effectQueryWithSchema(v.string(), (id) =>
	Effect.gen(function* () {
		const service = yield* MessageService;
		return yield* service.getForConversation(id);
	}),
);

/**
 * Get conversation with all messages (combined to avoid waterfall)
 */
export const getConversationWithMessages = effectQueryWithSchema(v.string(), (id) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.getWithMessages(id);
	}),
);

// ─────────────────────────────────────────────────────────────
// Conversation Commands
// ─────────────────────────────────────────────────────────────

/**
 * Create a new conversation
 */
export const createConversation = effectCommand(
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.create;
	}),
) as () => Promise<{ id: string }>;

/**
 * Delete a conversation (messages cascade automatically)
 */
export const deleteConversation = effectCommandWithSchema(v.string(), (id) =>
	Effect.gen(function* () {
		const service = yield* ConversationService;
		return yield* service.delete(id);
	}),
) as (id: string) => Promise<void>;
