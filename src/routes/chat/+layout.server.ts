import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";

export async function load({ request }: RequestEvent) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		redirect(303, "/auth");
	}

	return {
		user: session.user,
	};
}
