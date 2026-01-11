<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<script lang="ts">
import { goto, invalidate } from "$app/navigation";
import PromptInput from "$lib/components/PromptInput.svelte";
import { createConversation } from "./data.remote";

const PENDING_PROMPT_KEY = "pendingAuthPrompt";

let error = $state("");
let isLoading = $state(false);

// On mount, check if there's a pending prompt from auth flow
$effect(() => {
	const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);
	if (pendingPrompt) {
		localStorage.removeItem(PENDING_PROMPT_KEY);
		handleSubmit(pendingPrompt);
	}
});

async function handleSubmit(message: string) {
	if (!message.trim()) return;

	isLoading = true;
	error = "";

	try {
		// Store the message in sessionStorage for the chat page to pick up
		sessionStorage.setItem("pendingMessage", message.trim());

		// Create conversation using remote function
		const { id } = await createConversation();
		// Invalidate conversations so sidebar updates
		await invalidate("app:conversations");
		goto(`/chat/${id}`);
	} catch (e) {
		// Clear storage on error
		sessionStorage.removeItem("pendingMessage");

		// Check if it's an auth error (401)
		if (e && typeof e === "object" && "status" in e && e.status === 401) {
			goto("/auth");
			return;
		}

		error = e instanceof Error ? e.message : "Something went wrong";
		isLoading = false;
	}
}
</script>

<div class="flex-1 flex flex-col items-center justify-center p-8">
	<div class="w-full max-w-2xl text-center">
		<h1 class="text-5xl font-semibold text-foreground mb-6">svelting</h1>
		<p class="text-lg text-muted-foreground mb-8">
			real time, durable, chat app in svelte
		</p>
		<PromptInput onsubmit={handleSubmit} disabled={isLoading} />
		{#if error}
			<p class="mt-4 text-sm text-destructive">{error}</p>
		{/if}
	</div>
</div>
