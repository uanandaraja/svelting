<script lang="ts">
import { browser } from "$app/environment";
import { Chat, type UIMessage } from "@ai-sdk/svelte";
import { DefaultChatTransport } from "ai";
import { invalidate } from "$app/navigation";
import { useDarkMode } from "$lib/hooks/useDarkMode.svelte";
import { getShikiTheme } from "$lib/streamdown/config";
import ChatMessage from "$lib/components/ChatMessage.svelte";
import PromptInput from "$lib/components/PromptInput.svelte";
import { DEFAULT_MODEL } from "$lib/ai";
import { ArrowDown } from "$lib/icons";

// Receive data from +page.server.ts load function
let { data } = $props();

// Dark mode detection
const { isDark } = useDarkMode();
const shikiTheme = $derived(getShikiTheme(isDark));

// Chat state
let chat = $state<Chat | null>(null);
let input = $state("");
let messagesEndRef = $state<HTMLDivElement | null>(null);
let mainRef = $state<HTMLElement | null>(null);
let currentConversationId = $state<string | null>(null);
let hasSentFirstMessage = $state(false);
let currentModel = $state(DEFAULT_MODEL);
let showScrollButton = $state(false);

// Derived state
const isStreaming = $derived(chat?.status === "streaming");
const isReady = $derived(chat?.status === "ready");
const messages = $derived(chat?.messages ?? []);

// Initialize/reinitialize chat when conversation changes
$effect(() => {
	if (!browser) return;

	const { conversation, messages: dbMessages } = data;

	if (currentConversationId !== conversation.id) {
		currentConversationId = conversation.id;
		hasSentFirstMessage = dbMessages.length > 0;
		currentModel = conversation.model;

		// Convert DB messages to UI messages format
		const uiMessages: UIMessage[] = dbMessages.map((msg) => ({
			id: msg.id,
			role: msg.role as "user" | "assistant",
			parts: [{ type: "text" as const, text: msg.content }],
			createdAt: new Date(msg.createdAt),
		}));

		chat = new Chat({
			id: conversation.id,
			messages: uiMessages,
			transport: new DefaultChatTransport({
				api: `/chat/${conversation.id}/api/messages`,
				// Configure the reconnect endpoint for durable streaming
				prepareReconnectToStreamRequest: ({ id }) => ({
					api: `/chat/${id}/api/stream`,
				}),
			}),
		});

		// Attempt to resume any active stream on mount
		chat.resumeStream().catch(() => {
			// No active stream to resume - this is expected for completed conversations
		});

		// Check for pending message from homepage and send it
		const pendingMessage = sessionStorage.getItem("pendingMessage");
		if (pendingMessage) {
			sessionStorage.removeItem("pendingMessage");
			chat.sendMessage({ text: pendingMessage });
			hasSentFirstMessage = true;
			setTimeout(() => invalidate("app:conversations"), 1000);
			scrollToBottom();
		}
	}
});

// Auto-scroll when messages change
$effect(() => {
	if (messages.length > 0) {
		scrollToBottom();
	}
});

function scrollToBottom() {
	messagesEndRef?.scrollIntoView({ behavior: "smooth" });
}

function handleScroll(event: Event) {
	const target = event.target as HTMLElement;
	const distanceFromBottom =
		target.scrollHeight - target.scrollTop - target.clientHeight;
	showScrollButton = distanceFromBottom > 100;
}

async function handleSubmit(text: string) {
	if (!isReady || !chat) return;

	const isFirstMessage = !hasSentFirstMessage;

	await chat.sendMessage({ text });
	scrollToBottom();

	if (isFirstMessage) {
		hasSentFirstMessage = true;
		setTimeout(() => invalidate("app:conversations"), 1500);
	}
}

async function handleModelChange(modelId: string) {
	if (!currentConversationId || modelId === currentModel) return;

	// Optimistically update the UI
	currentModel = modelId;

	// Persist to server
	try {
		const response = await fetch(`/chat/${currentConversationId}/api/model`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ model: modelId }),
		});

		if (!response.ok) {
			// Revert on error
			currentModel = data.conversation.model;
			console.error("Failed to update model");
		} else {
			// Store as default for new conversations
			localStorage.setItem("preferredModel", modelId);
		}
	} catch {
		// Revert on error
		currentModel = data.conversation.model;
		console.error("Failed to update model");
	}
}
</script>

<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<div class="flex flex-col h-full bg-background">
	<!-- Messages -->
	<main bind:this={mainRef} onscroll={handleScroll} class="flex-1 overflow-y-auto px-6 py-10">
		<div class="w-full md:w-[680px] mx-auto space-y-8">
			{#if messages.length === 0}
				<div class="text-center py-16">
					<p class="text-muted-foreground/60">Start a conversation...</p>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<ChatMessage {message} {shikiTheme} />
				{/each}
			{/if}
			<div bind:this={messagesEndRef}></div>
		</div>
	</main>

	<!-- Input -->
	<footer class="relative px-6 py-5 shrink-0">
		<!-- Gradient fade overlay -->
		<div
			class="absolute inset-x-0 bottom-full h-12 pointer-events-none bg-gradient-to-b from-transparent to-background"
		></div>
		<div class="w-full md:w-[680px] mx-auto relative">
			<!-- Scroll to bottom button -->
			{#if showScrollButton}
				<button
					onclick={scrollToBottom}
					class="absolute -top-12 left-1/2 -translate-x-1/2 p-2 rounded-full bg-muted border border-border hover:bg-accent transition-colors shadow-md"
					aria-label="Scroll to bottom"
				>
					<ArrowDown class="w-4 h-4 text-muted-foreground" />
				</button>
			{/if}
			<PromptInput
				bind:value={input}
				placeholder="Type your message..."
				{isStreaming}
				onsubmit={handleSubmit}
				model={currentModel}
				onModelChange={handleModelChange}
			/>
		</div>
	</footer>
</div>
