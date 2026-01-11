<script lang="ts">
import { Chat, type UIMessage } from "@ai-sdk/svelte";
import { DefaultChatTransport } from "ai";
import { invalidate } from "$app/navigation";
import { useDarkMode } from "$lib/hooks/useDarkMode.svelte";
import { getShikiTheme } from "$lib/streamdown/config";
import ChatMessage from "$lib/components/ChatMessage.svelte";
import PromptInput from "$lib/components/PromptInput.svelte";

// Receive data from +page.server.ts load function
let { data } = $props();

// Dark mode detection
const { isDark } = useDarkMode();
const shikiTheme = $derived(getShikiTheme(isDark));

// Chat state
let chat = $state<Chat | null>(null);
let input = $state("");
let messagesEndRef = $state<HTMLDivElement | null>(null);
let currentConversationId = $state<string | null>(null);
let hasSentFirstMessage = $state(false);

// Derived state
const isStreaming = $derived(chat?.status === "streaming");
const isReady = $derived(chat?.status === "ready");
const messages = $derived(chat?.messages ?? []);

// Initialize/reinitialize chat when conversation changes
$effect(() => {
	const { conversation, messages: dbMessages } = data;

	if (currentConversationId !== conversation.id) {
		currentConversationId = conversation.id;
		hasSentFirstMessage = dbMessages.length > 0;

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
			}),
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
</script>

<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<div class="flex flex-col h-full bg-background">
	<!-- Messages -->
	<main class="flex-1 overflow-y-auto px-6 py-10">
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
	<footer class="px-6 py-5 shrink-0">
		<div class="w-full md:w-[680px] mx-auto">
			<PromptInput
				bind:value={input}
				placeholder="Type your message..."
				{isStreaming}
				onsubmit={handleSubmit}
			/>
		</div>
	</footer>
</div>
