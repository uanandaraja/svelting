import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { getSession, getConversations } from "./data.remote";

export const load: LayoutServerLoad = async ({ depends }) => {
	depends("app:conversations");

	try {
		const [session, conversations] = await Promise.all([
			getSession(),
			getConversations(),
		]);
		return {
			user: session.user,
			conversations,
		};
	} catch {
		// getSession throws 401 if not authenticated, redirect to auth
		redirect(303, "/auth");
	}
};
