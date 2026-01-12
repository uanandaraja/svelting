import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { isValidModel } from "$lib/ai";
import { getSession, updateConversationModel } from "../../../data.remote";

export const PATCH: RequestHandler = async ({ request, params }) => {
	await getSession();

	const body = await request.json();
	const { model } = body as { model: string };

	if (!model || typeof model !== "string") {
		error(400, "Model is required");
	}

	if (!isValidModel(model)) {
		error(400, "Invalid model");
	}

	await updateConversationModel({ id: params.id, model });

	return json({ success: true });
};
