import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
	// Pass pending state to client so server renders loading state correctly
	const hasPendingPrompt = url.searchParams.get("pending") === "true";

	return {
		hasPendingPrompt,
	};
};
