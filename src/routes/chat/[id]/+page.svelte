<script lang="ts">
import { Chat, type UIMessage } from "@ai-sdk/svelte";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "svelte-streamdown";
import Code from "svelte-streamdown/code";
import gruvboxLight from "@shikijs/themes/gruvbox-light-hard";
import gruvboxDark from "@shikijs/themes/gruvbox-dark-hard";
import { ArrowUp } from "$lib/icons";
import { extractTextFromParts } from "$lib/ai";
import { invalidate } from "$app/navigation";
import { onMount } from "svelte";

const shikiThemes = {
	"gruvbox-light-hard": gruvboxLight,
	"gruvbox-dark-hard": gruvboxDark,
};

// Dark mode detection
let isDark = $state(false);
onMount(() => {
	const checkTheme = () => {
		isDark =
			document.documentElement.classList.contains("dark") ||
			document.body.classList.contains("dark");
	};
	checkTheme();
	const observer = new MutationObserver(checkTheme);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	return () => observer.disconnect();
});
const shikiTheme = $derived(
	isDark ? "gruvbox-dark-hard" : "gruvbox-light-hard",
);

// Receive data from +page.server.ts load function
let { data } = $props();

let chat = $state<Chat | null>(null);
let input = $state("");
let textareaRef = $state<HTMLTextAreaElement | null>(null);
let messagesEndRef = $state<HTMLDivElement | null>(null);
let currentConversationId = $state<string | null>(null);
let hasSentFirstMessage = $state(false);

const isStreaming = $derived(chat?.status === "streaming");
const isReady = $derived(chat?.status === "ready");
const messages = $derived(chat?.messages ?? []);

// Initialize/reinitialize chat when conversation changes
$effect(() => {
	const { conversation, messages: dbMessages } = data;

	// Only reinitialize if the conversation ID changed
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
			// Invalidate after a short delay to let the message be saved
			setTimeout(() => invalidate("app:conversations"), 1000);
			scrollToBottom();
		}
	}
});

function autoResize() {
	if (textareaRef) {
		textareaRef.style.height = "auto";
		textareaRef.style.height = Math.min(textareaRef.scrollHeight, 192) + "px";
	}
}

function scrollToBottom() {
	messagesEndRef?.scrollIntoView({ behavior: "smooth" });
}

async function handleSubmit() {
	if (!input.trim() || !isReady || !chat) return;

	const text = input.trim();
	const isFirstMessage = !hasSentFirstMessage;
	input = "";
	if (textareaRef) {
		textareaRef.style.height = "auto";
	}

	await chat.sendMessage({ text });
	scrollToBottom();

	// If this was the first message, invalidate conversations to update sidebar
	if (isFirstMessage) {
		hasSentFirstMessage = true;
		// Delay to allow the message to be saved to DB
		setTimeout(() => invalidate("app:conversations"), 1500);
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		handleSubmit();
	}
}

$effect(() => {
	// Auto-scroll when messages change
	if (messages.length > 0) {
		scrollToBottom();
	}
});

// Custom theme for Streamdown to match our design
const streamdownTheme = {
	paragraph: { base: "mb-4 text-sm leading-[22px] [&:last-child]:mb-0" },
	h1: { base: "text-xl font-bold mt-5 mb-2" },
	h2: { base: "text-lg font-bold mt-4 mb-2" },
	h3: { base: "text-base font-semibold mt-3 mb-2" },
	h4: { base: "text-sm font-semibold mt-2 mb-1" },
	ul: { base: "list-disc list-inside my-3 space-y-1 text-sm leading-[22px]" },
	ol: {
		base: "list-decimal list-inside my-3 space-y-1 text-sm leading-[22px]",
	},
	li: { base: "leading-[22px]" },
	blockquote: {
		base: "border-l-4 border-muted-foreground/30 pl-4 my-4 italic text-muted-foreground",
	},
	link: {
		base: "text-primary underline underline-offset-2 hover:text-primary/80",
	},
	codespan: { base: "bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono" },
	code: {
		base: "my-4 rounded-lg border border-border overflow-hidden",
		container: "relative bg-muted/50 font-mono text-sm",
		header:
			"flex items-center justify-between px-3 py-2 bg-muted/80 border-b border-border text-xs",
		language: "font-mono text-muted-foreground",
		buttons:
			"flex items-center gap-2 text-muted-foreground [&>button]:p-1 [&>button]:rounded [&>button]:hover:bg-muted [&>button]:hover:text-foreground [&>button]:transition-colors [&_svg]:size-4",
		pre: "p-3 overflow-x-auto text-sm [&>code]:block",
		line: "block",
	},
	hr: { base: "my-6 border-border" },
};
</script>

<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<div class="flex flex-col h-full bg-background">
	<!-- Messages -->
	<main class="flex-1 overflow-y-auto px-6 py-8">
		<div class="w-full md:w-[680px] mx-auto space-y-6">
			{#if messages.length === 0}
				<div class="text-center py-12">
					<p class="text-muted-foreground">Start a conversation...</p>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						{#if message.role === "user"}
							<!-- User messages: styled bubble -->
							<div class="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground text-sm">
								<p class="whitespace-pre-wrap">{extractTextFromParts(message.parts)}</p>
							</div>
						{:else}
							<!-- Assistant messages: rendered with Streamdown -->
							<div class="w-full text-foreground">
<Streamdown
								content={extractTextFromParts(message.parts)}
								theme={streamdownTheme}
								{shikiThemes}
								{shikiTheme}
								components={{ code: Code }}
							/>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
			<div bind:this={messagesEndRef}></div>
		</div>
	</main>

	<!-- Input -->
	<footer class="px-6 py-4 shrink-0">
		<div class="w-full md:w-[680px] mx-auto">
			<div
				role="button"
				tabindex="-1"
				onclick={() => textareaRef?.focus()}
				onkeydown={(e) => e.key === "Enter" && textareaRef?.focus()}
				class="relative w-full rounded-xl bg-muted outline outline-1 outline-border antialiased cursor-text"
				class:opacity-50={isStreaming}
			>
				<textarea
					bind:this={textareaRef}
					bind:value={input}
					oninput={autoResize}
					onkeydown={handleKeydown}
					placeholder="Type your message..."
					rows={1}
					disabled={isStreaming}
					class="w-full px-4.5 pt-4.5 pb-14 text-sm text-foreground bg-transparent resize-none outline-none placeholder:text-muted-foreground overflow-y-auto disabled:cursor-not-allowed"
					style="min-height: 60px; max-height: 192px;"
				></textarea>
				<button
					type="button"
					aria-label="Send message"
					onclick={handleSubmit}
					disabled={!input.trim() || isStreaming}
					class="absolute bottom-1.5 right-1.5 flex justify-center items-center p-1.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isStreaming}
						<div
							class="size-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"
						></div>
					{:else}
						<ArrowUp class="size-5 text-primary-foreground" />
					{/if}
				</button>
			</div>
		</div>
	</footer>
</div>
