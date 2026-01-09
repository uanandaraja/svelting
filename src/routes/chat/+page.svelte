<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	interface Conversation {
		id: string;
		systemPrompt: string;
		model: string;
		createdAt: string;
		updatedAt: string;
	}

	let conversations = $state<Conversation[]>([]);
	let loading = $state(true);
	let error = $state("");

	onMount(async () => {
		try {
			const res = await fetch("/chat/api/conversations");
			if (!res.ok) throw new Error("Failed to load");
			const data = await res.json();
			conversations = data.conversations;
		} catch {
			error = "Failed to load conversations";
		} finally {
			loading = false;
		}
	});

	async function createNewChat() {
		try {
			const res = await fetch("/chat/api/conversations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			if (!res.ok) throw new Error("Failed to create");
			const conversation = await res.json();
			goto(`/chat/${conversation.id}`);
		} catch {
			error = "Failed to create conversation";
		}
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
</script>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="border-b border-border px-6 py-4">
		<div class="max-w-3xl mx-auto flex items-center justify-between">
			<a href="/" class="text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors">
				svelting
			</a>
			<button
				onclick={createNewChat}
				class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
			>
				new chat
			</button>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-3xl mx-auto px-6 py-8">
		<h1 class="text-2xl font-semibold text-foreground mb-6">your conversations</h1>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="size-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<p class="text-destructive">{error}</p>
			</div>
		{:else if conversations.length === 0}
			<div class="text-center py-12">
				<p class="text-muted-foreground mb-4">no conversations yet</p>
				<button
					onclick={createNewChat}
					class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
				>
					start your first chat
				</button>
			</div>
		{:else}
			<div class="space-y-2">
				{#each conversations as conversation (conversation.id)}
					<a
						href="/chat/{conversation.id}"
						class="block p-4 rounded-xl bg-muted hover:bg-accent transition-colors group"
					>
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground truncate">
									{conversation.model}
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									{formatDate(conversation.updatedAt)}
								</p>
							</div>
							<svg
								class="size-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>
