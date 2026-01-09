export interface TextPart {
	type: "text";
	text: string;
}

export interface UIMessage {
	id: string;
	role: "user" | "assistant" | "system";
	parts: TextPart[];
	createdAt?: string;
}

export interface Conversation {
	id: string;
	systemPrompt: string;
	model: string;
	createdAt: string;
	updatedAt: string;
}
