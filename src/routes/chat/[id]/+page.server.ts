import { getConversationWithMessages } from "../data.remote";

export async function load({ params }: { params: { id: string } }) {
	return await getConversationWithMessages(params.id);
}
