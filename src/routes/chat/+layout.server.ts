import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { getConversations } from "./data.remote";
import { tryGetSession } from "../data.remote";

export const load: LayoutServerLoad = async ({ depends, url }) => {
	depends("app:conversations");

	const session = await tryGetSession();

	if (!session) {
		redirect(303, "/auth");
	}

	// If we're processing a pending prompt, skip fetching conversations
	// The page will redirect to /chat/[id] anyway, which will trigger a fresh load
	const isPending = url.searchParams.get("pending") === "true";

	if (isPending) {
		return {
			user: session.user,
			conversations: [],
		};
	}

	const conversations = await getConversations();
	return {
		user: session.user,
		conversations,
	};
};
