<script lang="ts">
	import { Chat, type UIMessage } from "@ai-sdk/svelte";
	import { DefaultChatTransport } from "ai";
	import { ArrowUp } from "$lib/icons";
	import { onMount } from "svelte";

	let { data } = $props();

	let chat = $state<Chat | null>(null);
	let input = $state("");
	let textareaRef = $state<HTMLTextAreaElement | null>(null);
	let messagesEndRef = $state<HTMLDivElement | null>(null);

	const isStreaming = $derived(chat?.status === "streaming");
	const isReady = $derived(chat?.status === "ready");
	const messages = $derived(chat?.messages ?? []);

	// Initialize chat on mount to avoid SSR fetch issues
	onMount(async () => {
		// Convert DB messages to UI messages format
		const initialMessages: UIMessage[] = data.messages.map((msg) => ({
			id: msg.id,
			role: msg.role as "user" | "assistant",
			parts: [{ type: "text" as const, text: msg.content }],
			createdAt: new Date(msg.createdAt),
		}));

		chat = new Chat({
			id: data.conversation.id,
			messages: initialMessages,
			transport: new DefaultChatTransport({
				api: `/chat/${data.conversation.id}/api/messages`,
			}),
		});

		// Check for pending message from homepage and send it
		const pendingMessage = sessionStorage.getItem("pendingMessage");
		if (pendingMessage) {
			sessionStorage.removeItem("pendingMessage");
			await chat.sendMessage({ text: pendingMessage });
			scrollToBottom();
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
		input = "";
		if (textareaRef) {
			textareaRef.style.height = "auto";
		}

		await chat.sendMessage({ text });
		scrollToBottom();
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
</script>

<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<div class="flex flex-col h-screen bg-background">
	<!-- Header -->
	<header class="border-b border-border px-6 py-4 flex-shrink-0">
		<div class="max-w-3xl mx-auto flex items-center justify-between">
			<a href="/chat" class="text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors">
				svelting
			</a>
			<span class="text-sm text-muted-foreground">
				{data.conversation.model}
			</span>
		</div>
	</header>

	<!-- Messages -->
	<main class="flex-1 overflow-y-auto px-6 py-8">
		<div class="max-w-3xl mx-auto space-y-6">
			{#if messages.length === 0}
				<div class="text-center py-12">
					<p class="text-muted-foreground">Start a conversation...</p>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[80%] rounded-2xl px-4 py-3 {message.role === 'user'
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-foreground'}"
						>
							{#each message.parts as part}
								{#if part.type === "text"}
									<p class="whitespace-pre-wrap">{part.text}</p>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			{/if}
			<div bind:this={messagesEndRef}></div>
		</div>
	</main>

	<!-- Input -->
	<footer class="border-t border-border px-6 py-4 flex-shrink-0">
		<div class="max-w-3xl mx-auto">
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
