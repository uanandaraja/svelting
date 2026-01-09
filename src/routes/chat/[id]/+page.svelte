<script lang="ts">
	import { Chat, type UIMessage } from "@ai-sdk/svelte";
	import { DefaultChatTransport } from "ai";
	import { Streamdown } from "svelte-streamdown";
	import Code from "svelte-streamdown/code";
	import { ArrowUp } from "$lib/icons";
	import ChatNavbar from "$lib/components/ChatNavbar.svelte";
	import { extractTextFromParts } from "$lib/ai";

	// Receive data from +page.server.ts load function
	let { data } = $props();

	let chat = $state<Chat | null>(null);
	let input = $state("");
	let textareaRef = $state<HTMLTextAreaElement | null>(null);
	let messagesEndRef = $state<HTMLDivElement | null>(null);
	let initialized = $state(false);

	const isStreaming = $derived(chat?.status === "streaming");
	const isReady = $derived(chat?.status === "ready");
	const messages = $derived(chat?.messages ?? []);

	// Initialize chat when component mounts with server data
	$effect(() => {
		if (data && !initialized) {
			const { conversation, messages: dbMessages } = data;

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

			initialized = true;

			// Check for pending message from homepage and send it
			const pendingMessage = sessionStorage.getItem("pendingMessage");
			if (pendingMessage) {
				sessionStorage.removeItem("pendingMessage");
				chat.sendMessage({ text: pendingMessage });
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

	// Custom theme for Streamdown to match our design
	const streamdownTheme = {
		paragraph: { base: "mb-5 leading-relaxed [&:last-child]:mb-0" },
		h1: { base: "text-2xl font-bold mt-6 mb-3" },
		h2: { base: "text-xl font-bold mt-5 mb-2" },
		h3: { base: "text-lg font-semibold mt-4 mb-2" },
		h4: { base: "text-base font-semibold mt-3 mb-1" },
		ul: { base: "list-disc list-inside my-3 space-y-1" },
		ol: { base: "list-decimal list-inside my-3 space-y-1" },
		li: { base: "leading-relaxed" },
		blockquote: { base: "border-l-4 border-muted-foreground/30 pl-4 my-4 italic text-muted-foreground" },
		link: { base: "text-primary underline underline-offset-2 hover:text-primary/80" },
		codespan: { base: "bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono" },
		code: {
			base: "my-4 rounded-lg border border-border overflow-hidden",
			container: "relative overflow-visible bg-muted/50 p-3 font-mono text-sm",
			header: "flex items-center justify-between px-3 py-2 bg-muted/80 border-b border-border text-xs",
			language: "font-mono text-muted-foreground",
			buttons: "text-muted-foreground hover:text-foreground transition-colors",
			pre: "overflow-x-auto text-sm",
		},
		hr: { base: "my-6 border-border" },
	};
</script>

<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<div class="flex flex-col h-screen bg-background">
	<ChatNavbar />

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
						{#if message.role === "user"}
							<!-- User messages: simple styled bubble -->
							<div class="max-w-[80%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
								<p class="whitespace-pre-wrap">{extractTextFromParts(message.parts)}</p>
							</div>
						{:else}
							<!-- Assistant messages: rendered with Streamdown -->
							<div class="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground">
								<Streamdown
									content={extractTextFromParts(message.parts)}
									theme={streamdownTheme}
									components={{ code: Code }}
									animation={{
										enabled: isStreaming,
										type: "fade",
										duration: 300,
										tokenize: "word",
									}}
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
