import type { TextPart } from "$lib/ai/types";

/**
 * Extracts text content from UI message parts
 */
export function extractTextFromParts(parts: TextPart[]): string {
	return parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("");
}
