// ─────────────────────────────────────────────────────────────
// Effect Services - Re-exports
// ─────────────────────────────────────────────────────────────

// Request Context
export { RequestContext, makeRequestContextLayer } from "./RequestContext";
export type { RequestContextShape } from "./RequestContext";

// Database
export { DatabaseService, DatabaseLive, runQuery } from "./Database";
export type { Database } from "./Database";

// Auth
export { AuthService, AuthLive, getSession, getUser } from "./Auth";
export type { AuthServiceShape } from "./Auth";

// Conversation
export {
	ConversationService,
	ConversationLive,
	getAllConversations,
	getConversationById,
	getConversationRaw,
	getConversationWithMessages,
	createConversation,
	deleteConversation,
} from "./Conversation";
export type {
	ConversationServiceShape,
	MessageData,
	ConversationWithMessages,
} from "./Conversation";

// Message
export {
	MessageService,
	MessageLive,
	getMessagesForConversation,
} from "./Message";
export type { MessageServiceShape } from "./Message";
