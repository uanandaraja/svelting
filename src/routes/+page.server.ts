import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { tryGetSession } from "./data.remote";

export const load: PageServerLoad = async () => {
	const session = await tryGetSession();

	if (session) {
		redirect(303, "/auth");
	}

	return {};
};
