import { redirect } from "@sveltejs/kit";
import { getSession } from "./data.remote";

export async function load() {
	try {
		const session = await getSession();
		return {
			user: session.user,
		};
	} catch {
		// getSession throws 401 if not authenticated, redirect to auth
		redirect(303, "/auth");
	}
}
