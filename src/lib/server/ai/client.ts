import { createOpenAI } from "@ai-sdk/openai";
import { env } from "$env/dynamic/private";

export const openrouter = createOpenAI({
	apiKey: env.OPENROUTER_API_KEY,
	baseURL: "https://openrouter.ai/api/v1",
});
