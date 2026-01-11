import type { TextPart } from "./types";

/**
 * Extracts text content from UI message parts.
 * Works on both client and server.
 * Accepts any array of parts with type/text fields.
 */
export function extractTextFromParts(
	parts: readonly { type: string; text?: string }[],
): string {
	return parts
		.filter(
			(part): part is TextPart =>
				part.type === "text" && typeof part.text === "string",
		)
		.map((part) => part.text)
		.join("");
}
