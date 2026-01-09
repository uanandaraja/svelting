import { getConversations } from "./data.remote";

export async function load() {
	return { conversations: await getConversations() };
}
