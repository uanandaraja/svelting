<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<script lang="ts">
import { goto } from "$app/navigation";
import PromptInput from "$lib/components/PromptInput.svelte";
import { DEFAULT_MODEL } from "$lib/ai";
import { createConversation } from "./data.remote";

const PENDING_PROMPT_KEY = "pendingAuthPrompt";
const PREFERRED_MODEL_KEY = "preferredModel";

interface Props {
	data: {
		hasPendingPrompt: boolean;
	};
}

let { data }: Props = $props();

let error = $state("");
let isLoading = $state(false);
let selectedModel = $state(DEFAULT_MODEL);

// Load preferred model from localStorage on mount
$effect(() => {
	const stored = localStorage.getItem(PREFERRED_MODEL_KEY);
	if (stored) {
		selectedModel = stored;
	}
});

// Use server-provided state for initial render (avoids hydration flash)
let showLoading = $derived(data.hasPendingPrompt || isLoading);

// Process pending prompt from auth flow
$effect(() => {
	if (data.hasPendingPrompt) {
		const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);
		if (pendingPrompt) {
			localStorage.removeItem(PENDING_PROMPT_KEY);
			processPendingPrompt(pendingPrompt);
		} else {
			// No prompt in storage, just redirect to clean URL
			goto("/chat", { replaceState: true });
		}
	}
});

async function processPendingPrompt(message: string) {
	try {
		// Store the message and model in sessionStorage for the chat page to pick up
		sessionStorage.setItem("pendingMessage", message.trim());
		sessionStorage.setItem("pendingModel", selectedModel);

		// Create conversation using remote function
		const { id } = await createConversation();
		// Navigate directly - the layout will refresh conversations on navigation
		goto(`/chat/${id}`, { replaceState: true });
	} catch (e) {
		// Clear storage on error
		sessionStorage.removeItem("pendingMessage");
		sessionStorage.removeItem("pendingModel");
		error = e instanceof Error ? e.message : "Something went wrong";
		// Clear the pending query param
		goto("/chat", { replaceState: true });
	}
}

async function handleSubmit(message: string) {
	if (!message.trim()) return;

	isLoading = true;
	error = "";

	try {
		// Store the message and model in sessionStorage for the chat page to pick up
		sessionStorage.setItem("pendingMessage", message.trim());
		sessionStorage.setItem("pendingModel", selectedModel);

		// Create conversation using remote function
		const { id } = await createConversation();
		goto(`/chat/${id}`);
	} catch (e) {
		// Clear storage on error
		sessionStorage.removeItem("pendingMessage");
		sessionStorage.removeItem("pendingModel");

		// Check if it's an auth error (401)
		if (e && typeof e === "object" && "status" in e && e.status === 401) {
			goto("/auth");
			return;
		}

		error = e instanceof Error ? e.message : "Something went wrong";
		isLoading = false;
	}
}

function handleModelChange(modelId: string) {
	selectedModel = modelId;
	localStorage.setItem(PREFERRED_MODEL_KEY, modelId);
}
</script>

{#if showLoading}
	<div class="flex-1 flex flex-col items-center justify-center p-8">
		<div class="text-center">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground border-t-foreground mb-4"></div>
			<p class="text-lg text-muted-foreground">starting your chat...</p>
		</div>
	</div>
{:else}
	<div class="flex-1 flex flex-col items-center justify-center p-8">
		<div class="w-full max-w-2xl text-center">
			<h1 class="text-5xl font-semibold text-foreground mb-6">svelting</h1>
			<p class="text-lg text-muted-foreground mb-8">
				real time, durable, chat app in svelte
			</p>
			<PromptInput
				onsubmit={handleSubmit}
				disabled={isLoading}
				model={selectedModel}
				onModelChange={handleModelChange}
			/>
			{#if error}
				<p class="mt-4 text-sm text-destructive">{error}</p>
			{/if}
		</div>
	</div>
{/if}
